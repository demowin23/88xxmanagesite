const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    // Tìm user
    const user = await User.getByUsername(username);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, team_id: user.team_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Trả về user info (không có password)
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      team_id: user.team_id
    };

    res.json({
      success: true,
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.getById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      team_id: user.team_id
    };

    res.json({
      success: true,
      data: userInfo
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

module.exports = router;

