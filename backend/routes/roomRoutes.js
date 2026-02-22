const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// ─── Generate unique 8-digit room code ────────────────────────────────────────
async function generateUniqueCode() {
    let code;
    let exists = true;

    while (exists) {
        code = String(Math.floor(10000000 + Math.random() * 90000000));
        const room = await Room.findOne({ code, isActive: true });
        exists = !!room;
    }

    return code;
}

// ─── POST /api/rooms/create ───────────────────────────────────────────────────
router.post('/create', async (req, res) => {
    try {
        const code = await generateUniqueCode();

        const room = new Room({
            code,
            participants: [],
            isActive: true,
        });

        await room.save();

        res.status(201).json({
            success: true,
            code: room.code,
            message: 'Room created successfully',
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
        });
    }
});

// ─── GET /api/rooms/:code ─────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ code, isActive: true });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found or inactive',
            });
        }

        if (room.participants.length >= room.maxParticipants) {
            return res.status(403).json({
                success: false,
                message: 'Room is full',
            });
        }

        res.status(200).json({
            success: true,
            room: {
                code: room.code,
                participantCount: room.participants.length,
                maxParticipants: room.maxParticipants,
                createdAt: room.createdAt,
            },
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room',
        });
    }
});

// ─── DELETE /api/rooms/:code ──────────────────────────────────────────────────
router.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOneAndUpdate(
            { code, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Room closed successfully',
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close room',
        });
    }
});

module.exports = router;
