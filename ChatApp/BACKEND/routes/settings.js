const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings');
    
    res.json({
      success: true,
      data: { 
        settings: user.settings || {
          notifications: true,
          darkMode: true,
          soundEffects: false
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const { notifications, darkMode, soundEffects } = req.body;

    const user = await User.findById(req.user._id);

    if (typeof notifications === 'boolean') {
      user.settings.notifications = notifications;
    }
    if (typeof darkMode === 'boolean') {
      user.settings.darkMode = darkMode;
    }
    if (typeof soundEffects === 'boolean') {
      user.settings.soundEffects = soundEffects;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: user.settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;

    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;