const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

router.get('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this room'
      });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { roomId, content, messageType } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and content are required'
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this room'
      });
    }

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await message.deleteOne();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;