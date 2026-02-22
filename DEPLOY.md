# RoomMatch — VPS Deployment Guide (Docker + CI/CD)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  VPS Server                                             │
│                                                         │
│  ┌─────────┐     ┌──────────┐     ┌──────────────────┐ │
│  │  Nginx   │────▶│ Frontend │     │     MongoDB      │ │
│  │ :80/:443 │     │  :3000   │     │     :27017       │ │
│  │          │────▶│          │     │                  │ │
│  │          │     └──────────┘     └──────────────────┘ │
│  │          │────▶┌──────────┐            ▲             │
│  │          │     │ Backend  │────────────┘             │
│  │          │     │  :5000   │                          │
│  └─────────┘     └──────────┘                          │
│                                                         │
│  All containers on Docker bridge network                │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: VPS Setup (One-time)

SSH into your VPS (Ubuntu 22.04+ recommended):

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

## Step 2: Clone & Configure Project on VPS

```bash
# Clone your repo
cd /opt
git clone https://github.com/YOUR_USERNAME/roommatch.git
cd roommatch

# Edit docker-compose.yml — replace 'your-domain.com' with actual domain
nano docker-compose.yml

# Edit nginx/nginx.conf — replace 'your-domain.com'
nano nginx/nginx.conf
```

## Step 3: SSL Certificate (Let's Encrypt)

```bash
# Create SSL directories
mkdir -p nginx/ssl nginx/certbot

# Option A: Use Certbot standalone (stop nginx first)
sudo apt install certbot -y
sudo certbot certonly --standalone -d your-domain.com

# Copy certs to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Option B: For initial testing without SSL, modify nginx.conf to
# only use the port 80 server block (remove the 443 block and redirect)
```

## Step 4: Launch Everything

```bash
cd /opt/roommatch

# Build and start all containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

| Service  | Internal Port | External Port |
|----------|:---:|:---:|
| MongoDB  | 27017 | 27017 |
| Backend  | 5000 | 5000 |
| Frontend | 3000 | 3000 |
| Nginx    | 80/443 | 80/443 |

## Step 5: GitHub Secrets for CI/CD

Go to **GitHub → Repo → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Your VPS IP (e.g., `123.45.67.89`) |
| `VPS_USER` | SSH user (e.g., `root` or `deploy`) |
| `VPS_SSH_KEY` | Your private SSH key (entire content) |
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-domain.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-domain.com` |

## Step 6: CI/CD Flow

```
git push to main
      │
      ▼
GitHub Actions triggers
      │
      ├── Build backend Docker image
      ├── Build frontend Docker image
      ├── Push both to GitHub Container Registry (ghcr.io)
      │
      ▼
SSH into VPS
      │
      ├── docker compose pull
      ├── docker compose up -d (zero-downtime restart)
      └── docker image prune -f (cleanup)
```

Every `git push main` → auto-builds → auto-deploys to VPS.

---

## Useful Commands

```bash
# View running containers
docker compose ps

# View logs (follow)
docker compose logs -f backend

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Full rebuild
docker compose up -d --build --force-recreate

# MongoDB shell
docker exec -it roommatch-mongo mongosh

# Auto-renew SSL (add to crontab)
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem /opt/roommatch/nginx/ssl/ && docker compose restart nginx
```

## TURN Server (Production WebRTC)

For WebRTC across NAT/firewalls, add a TURN server:

```bash
# Install coturn
sudo apt install coturn -y

# Edit /etc/turnserver.conf
realm=your-domain.com
fingerprint
lt-cred-mech
user=roommatch:your-secret-password
```

Then update `useWebRTC.ts` ICE servers:
```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-domain.com:3478',
    username: 'roommatch',
    credential: 'your-secret-password',
  },
]
```
