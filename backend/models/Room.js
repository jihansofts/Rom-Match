const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  username: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  hostSocketId: { type: String, default: null },
  participants: [participantSchema],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  maxParticipants: { type: Number, default: 8 },
});

module.exports = mongoose.model('Room', roomSchema);
