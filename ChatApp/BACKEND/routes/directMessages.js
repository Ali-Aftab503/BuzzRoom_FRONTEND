const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const DMMessage = require('../models/DMMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const conversations = await DirectMessage.find({
      participants: req.user._id
    })
      .populate('participants', 'username avatar')
      .populate('lastMessage.sender', 'username avatar')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let conversation = await DirectMessage.findOne({
      participants: { $all: [req.user._id, receiverId] }
    })
      .populate('participants', 'username avatar')
      .populate('lastMessage.sender', 'username avatar');

    if (!conversation) {
      conversation = await DirectMessage.create({
        participants: [req.user._id, receiverId],
        unreadCount: {
          [req.user._id]: 0,
          [receiverId]: 0
        }
      });

      conversation = await DirectMessage.findById(conversation._id)
        .populate('participants', 'username avatar');
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const conversation = await DirectMessage.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const messages = await DMMessage.find({ conversation: conversationId })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(limit);

    await DMMessage.updateMany(
      {
        conversation: conversationId,
        receiver: req.user._id,
        read: false
      },
      { read: true }
    );

    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

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

router.post('/:conversationId/messages', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const conversation = await DirectMessage.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    const receiverId = conversation.participants.find(
      id => id.toString() !== req.user._id.toString()
    );

    const message = await DMMessage.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    const populatedMessage = await DMMessage.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    conversation.lastMessage = {
      content,
      sender: req.user._id,
      timestamp: new Date()
    };
    conversation.updatedAt = new Date();
    
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save();

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

router.get('/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .select('username email avatar')
      .limit(10);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;