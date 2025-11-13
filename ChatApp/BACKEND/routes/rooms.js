const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('creator', 'username avatar')
      .populate('participants', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('participants', 'username avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const room = await Room.create({
      name,
      description,
      isPrivate: isPrivate || false,
      creator: req.user._id,
      participants: [req.user._id]
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('creator', 'username avatar')
      .populate('participants', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room: populatedRoom }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const isParticipant = room.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      room.participants.push(req.user._id);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate('creator', 'username avatar')
      .populate('participants', 'username avatar');

    res.json({
      success: true,
      message: isParticipant ? 'Already a member of this room' : 'Joined room successfully',
      data: { room: populatedRoom }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only room creator can delete the room'
      });
    }

    await room.deleteOne();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;