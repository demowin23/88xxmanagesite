const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Lấy danh sách teams (chỉ admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filters = { page, limit };
    const result = await Team.getAll(filters);
    res.json({ 
      success: true, 
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy chi tiết team (chỉ admin)
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const team = await Team.getById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tạo team mới (chỉ admin) - tự động tạo user với username được cung cấp hoặc = team name
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, username, description, password } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }
    
    // Tạo team
    const team = await Team.create({ name, description });
    
    // Tự động tạo user với username được cung cấp hoặc = team name
    const finalUsername = username || name;
    const defaultPassword = password || finalUsername.toLowerCase().replace(/\s+/g, '') + '123';
    
    try {
      const user = await User.create({
        username: finalUsername,
        password: defaultPassword,
        role: 'team',
        team_id: team.id
      });
      
      res.status(201).json({ 
        success: true, 
        data: {
          ...team,
          user: {
            username: user.username,
            password: defaultPassword // Trả về password để admin biết
          }
        }
      });
    } catch (userError) {
      // Nếu tạo user lỗi (username đã tồn tại), vẫn trả về team nhưng cảnh báo
      if (userError.code === '23505') {
        res.status(201).json({ 
          success: true, 
          data: team,
          warning: 'Team created but username already exists'
        });
      } else {
        throw userError;
      }
    }
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Team name or username already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật team (chỉ admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, username, description, password } = req.body;
    const team = await Team.update(req.params.id, { name, description });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    
    // Tìm user của team
    const teamUser = await User.getByTeamId(team.id);
    let updatedUserInfo = null;
    
    if (teamUser) {
      const updateData = {};
      
      // Cập nhật username nếu có
      if (username && username.trim()) {
        updateData.username = username.trim();
      }
      
      // Cập nhật password nếu có
      if (password && password.trim()) {
        updateData.password = password.trim();
      }
      
      // Nếu có thay đổi, update user
      if (Object.keys(updateData).length > 0) {
        await User.update(teamUser.id, updateData);
        
        // Trả về thông tin user đã cập nhật
        updatedUserInfo = {
          username: updateData.username || teamUser.username,
          password: updateData.password || null // Chỉ trả về password nếu có đổi
        };
      }
    }
    
    const response = {
      success: true,
      data: team
    };
    
    if (updatedUserInfo && (updatedUserInfo.password || updatedUserInfo.username !== teamUser.username)) {
      response.data.user = updatedUserInfo;
    }
    
    res.json(response);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Team name or username already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa team (chỉ admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await Team.delete(req.params.id);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

