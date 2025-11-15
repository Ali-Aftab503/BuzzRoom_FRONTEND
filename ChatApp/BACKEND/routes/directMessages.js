const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const DMMessage = require('../models/DMMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to extract URL previews
const extractUrlPreviews = async (content) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  const previews = [];

  for (const url of urls.slice(0, 3)) {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const $ = cheerio.load(response.data);
      
      const preview = {
        url,
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
        description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
        siteName: $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname
      };

      if (preview.title || preview.description || preview.image) {
        previews.push(preview);
      }
    } catch (error) {
      console.error('URL preview error:', error.message);
    }
  }

  return previews;
};

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

    const messages = await DMMessage.find({ conversation: conversationId, deleted: false })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .populate('reactions.user', 'username avatar')
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

    // Extract URL previews
    const urlPreviews = await extractUrlPreviews(content);

    const message = await DMMessage.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver: receiverId,
      content,
      urlPreviews
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

// Edit DM message
router.put('/:conversationId/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await DMMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    message.editHistory.push({
      content: message.content,
      editedAt: new Date()
    });

    const urlPreviews = await extractUrlPreviews(content);

    message.content = content;
    message.edited = true;
    message.urlPreviews = urlPreviews;
    await message.save();

    const populatedMessage = await DMMessage.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .populate('reactions.user', 'username avatar');

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete DM message
router.delete('/:conversationId/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await DMMessage.findById(req.params.messageId);

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

    message.deleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: { messageId: message._id }
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

// Add reaction to DM
router.post('/:conversationId/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await DMMessage.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();

    const populatedMessage = await DMMessage.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .populate('reactions.user', 'username avatar');

    res.json({
      success: true,
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
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