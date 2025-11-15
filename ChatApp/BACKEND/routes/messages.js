const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');
const cheerio = require('cheerio');

// Helper function to extract URL previews
const extractUrlPreviews = async (content) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  const previews = [];

  for (const url of urls.slice(0, 3)) { // Limit to 3 URLs per message
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

    const messages = await Message.find({ room: roomId, deleted: false })
      .populate('sender', 'username avatar')
      .populate('reactions.user', 'username avatar')
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

    // Extract URL previews
    const urlPreviews = await extractUrlPreviews(content);

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      urlPreviews
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

// Edit message
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
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
        message: 'You can only edit your own messages'
      });
    }

    // Save to edit history
    message.editHistory.push({
      content: message.content,
      editedAt: new Date()
    });

    // Extract new URL previews
    const urlPreviews = await extractUrlPreviews(content);

    message.content = content;
    message.edited = true;
    message.urlPreviews = urlPreviews;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
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

// Delete message
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

// Add reaction
router.post('/:id/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
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

module.exports = router;