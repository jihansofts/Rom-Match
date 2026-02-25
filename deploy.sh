#!/bin/bash
# deploy.sh
# Script to easily deploy or update RoomMatch on the VPS

echo "-----------------------------------"
echo "  Deploying RoomMatch...           "
echo "-----------------------------------"

echo "[1/4] Pulling latest changes from GitHub..."
git pull origin main

echo "[2/4] Pulling Docker images (if any)..."
docker compose pull

echo "[3/4] Rebuilding and starting containers (in background)..."
# Using --build ensures any new changes in Dockerfile or local files are picked up
# Using -d runs it in the background
docker compose up -d --build

echo "[4/4] Removing dangling images to free up space..."
docker image prune -f

echo "-----------------------------------"
echo "  Deployments Complete! ✅        "
echo "-----------------------------------"
docker compose ps
