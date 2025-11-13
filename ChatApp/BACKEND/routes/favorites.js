const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'favoriteRooms',
        populate: [
          { path: 'creator', select: 'username avatar' },
          { path: 'participants', select: 'username avatar' }
        ]
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { 
        favoriteRooms: user.favoriteRooms,
        count: user.favoriteRooms.length
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.post('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

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
        message: 'You must be a participant to favorite this room'
      });
    }

    const user = await User.findById(req.user._id);

    if (user.favoriteRooms.includes(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Room already in favorites'
      });
    }

    user.favoriteRooms.push(roomId);
    await user.save();

    await user.populate({
      path: 'favoriteRooms',
      populate: [
        { path: 'creator', select: 'username avatar' },
        { path: 'participants', select: 'username avatar' }
      ]
    });

    res.json({
      success: true,
      message: 'Room added to favorites',
      data: { 
        favoriteRooms: user.favoriteRooms 
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.delete('/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user.favoriteRooms.includes(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Room not in favorites'
      });
    }

    user.favoriteRooms = user.favoriteRooms.filter(
      id => id.toString() !== roomId
    );
    await user.save();

    await user.populate({
      path: 'favoriteRooms',
      populate: [
        { path: 'creator', select: 'username avatar' },
        { path: 'participants', select: 'username avatar' }
      ]
    });

    res.json({
      success: true,
      message: 'Room removed from favorites',
      data: { 
        favoriteRooms: user.favoriteRooms 
      }
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/check/:roomId', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = await User.findById(req.user._id);

    const isFavorite = user.favoriteRooms.some(
      id => id.toString() === roomId
    );

    res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;