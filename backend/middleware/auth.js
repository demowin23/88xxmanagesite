const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware để xác thực JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.getById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        team_id: user.team_id
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Middleware để kiểm tra quyền admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  
  next();
};

/**
 * Middleware để kiểm tra quyền team hoặc admin
 */
const requireTeamOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'team') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireTeamOrAdmin,
  JWT_SECRET
};

