const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Lấy danh sách teams
router.get('/', async (req, res) => {
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

// Lấy chi tiết team
router.get('/:id', async (req, res) => {
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

// Tạo team mới
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Team name is required' });
    }
    
    const team = await Team.create({ name, description });
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Team name already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật team
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.update(req.params.id, { name, description });
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, error: 'Team name already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa team
router.delete('/:id', async (req, res) => {
  try {
    await Team.delete(req.params.id);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

