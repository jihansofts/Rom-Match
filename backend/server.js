require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const roomRoutes = require("./routes/roomRoutes");
const Room = require("./models/Room");

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ✅ Allow multiple origins (Vercel + localhost)
// .env example:
// CLIENT_URLS=http://localhost:3000,https://rom-match.vercel.app
// (fallback) CLIENT_URL=https://rom-match.vercel.app
const allowedOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ✅ CORS for REST API
app.use(
  cors({
    origin: "https://rom-match.vercel.app",
    methods: ["GET", "POST"],

    methods: ["GET", "POST"],
    credentials: true,
  }),
);

// ✅ Handle preflight
app.options("*", cors());

app.use(express.json());
app.use("/api/rooms", roomRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "RoomMatch Signaling Server is running 🚀" });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // ── Join Room ───────────────────────────────────────────────────────────────
  socket.on("join-room", async ({ code, username }) => {
    try {
      const room = await Room.findOne({ code, isActive: true });
      if (!room) {
        socket.emit("error-message", { message: "Room not found" });
        return;
      }

      if (room.participants.length >= room.maxParticipants) {
        socket.emit("error-message", { message: "Room is full" });
        return;
      }

      // Add participant to DB
      room.participants.push({ socketId: socket.id, username });
      if (!room.hostSocketId) {
        room.hostSocketId = socket.id;
      }
      await room.save();

      // Join socket.io room
      socket.join(code);
      socket.data.code = code;
      socket.data.username = username;

      // Send existing users to the new user
      const existingUsers = room.participants
        .filter((p) => p.socketId !== socket.id)
        .map((p) => ({ socketId: p.socketId, username: p.username }));

      socket.emit("existing-users", { users: existingUsers });

      // Notify others that a new user joined
      socket.to(code).emit("user-joined", {
        socketId: socket.id,
        username,
      });

      console.log(`👤 ${username} joined room ${code}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("error-message", { message: "Failed to join room" });
    }
  });

  // ── WebRTC Signaling: Offer ─────────────────────────────────────────────────
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  // ── WebRTC Signaling: Answer ────────────────────────────────────────────────
  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  // ── WebRTC Signaling: ICE Candidate ─────────────────────────────────────────
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ── Screen Share Toggle ─────────────────────────────────────────────────────
  socket.on("screen-share-toggle", ({ code, isSharing }) => {
    socket.to(code).emit("screen-share-update", {
      socketId: socket.id,
      isSharing,
    });
  });

  // ── Chat Message ────────────────────────────────────────────────────────────
  socket.on("chat-message", ({ code, message, username }) => {
    io.to(code).emit("chat-message", {
      username,
      message,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
    });
  });

  // ── Leave Room ──────────────────────────────────────────────────────────────
  socket.on("leave-room", async ({ code }) => {
    await handleUserLeave(socket, code);
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    const code = socket.data.code;
    if (code) {
      await handleUserLeave(socket, code);
    }
  });
});

// ─── Handle user leaving a room ───────────────────────────────────────────────
async function handleUserLeave(socket, code) {
  try {
    const room = await Room.findOne({ code });
    if (!room) return;

    // Remove participant
    room.participants = room.participants.filter(
      (p) => p.socketId !== socket.id,
    );

    // If room is now empty, deactivate
    if (room.participants.length === 0) {
      room.isActive = false;
    }

    await room.save();

    socket.leave(code);

    // Notify remaining participants
    socket.to(code).emit("user-left", { socketId: socket.id });

    console.log(`🚪 ${socket.data.username || socket.id} left room ${code}`);
  } catch (error) {
    console.error("Error handling user leave:", error);
  }
}

// ─── MongoDB Connection + Server Start ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// ✅ Docker-compose use করলে localhost নয় — service name `mongo`
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://mongo:27017/antigravity-meet";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("📦 Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`🚀 RoomMatch server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
