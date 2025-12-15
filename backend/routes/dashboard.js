const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const WebsiteBlockStatus = require('../models/WebsiteBlockStatus');
const db = require('../config/database');
const { authenticate, requireTeamOrAdmin } = require('../middleware/auth');

// Dashboard tổng quan
router.get('/overview', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    // Tổng số website (filter theo team nếu là team user)
    let totalWebsitesQuery = 'SELECT COUNT(*) as count FROM website';
    let totalWebsitesParams = [];
    
    if (req.user.role === 'team') {
      totalWebsitesQuery += ' WHERE team_id = $1';
      totalWebsitesParams = [req.user.team_id];
    }
    
    const totalWebsitesResult = await db.query(totalWebsitesQuery, totalWebsitesParams);
    const totalWebsites = parseInt(totalWebsitesResult.rows[0].count);

    // Website bị chặn (trong 24h gần nhất) - filter theo team nếu là team user
    let blockedWebsitesQuery = `
      SELECT COUNT(DISTINCT wbs.website_id) as count 
      FROM website_block_status wbs
      INNER JOIN website w ON wbs.website_id = w.id
      WHERE wbs.checked_at >= NOW() - INTERVAL '1 day' 
      AND wbs.status != 'OK'
    `;
    let blockedWebsitesParams = [];
    
    if (req.user.role === 'team') {
      blockedWebsitesQuery += ' AND w.team_id = $1';
      blockedWebsitesParams = [req.user.team_id];
    }
    
    const blockedWebsitesResult = await db.query(blockedWebsitesQuery, blockedWebsitesParams);
    const blockedWebsites = parseInt(blockedWebsitesResult.rows[0].count);

    // Tổng số keyword (từ cột keyword trong website) - filter theo team nếu là team user
    let totalKeywordsQuery = `SELECT COUNT(*) as count FROM website WHERE keyword IS NOT NULL AND keyword != ''`;
    let totalKeywordsParams = [];
    
    if (req.user.role === 'team') {
      totalKeywordsQuery += ' AND team_id = $1';
      totalKeywordsParams = [req.user.team_id];
    }
    
    const totalKeywordsResult = await db.query(totalKeywordsQuery, totalKeywordsParams);
    const totalKeywords = parseInt(totalKeywordsResult.rows[0].count) || 0;

    // Keyword có ranking (đếm website có keyword)
    const keywordsWithRanking = totalKeywords; // Tạm thời bằng tổng keywords

    // Thống kê chặn theo ISP
    const blockStatsByISP = await WebsiteBlockStatus.getStatistics();

    // Thống kê ranking - đã xóa bảng keyword_rank_history
    const rankStats = [];

    res.json({
      success: true,
      data: {
        totalWebsites,
        blockedWebsites,
        totalKeywords,
        keywordsWithRanking,
        blockStatsByISP,
        rankStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Thống kê website bị chặn
router.get('/blocked-websites', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Count query - filter theo team nếu là team user
    let countQuery = `
      SELECT COUNT(DISTINCT w.id) as total
      FROM website w
      INNER JOIN website_block_status wbs ON w.id = wbs.website_id
      WHERE wbs.status != 'OK'
    `;
    let countParams = [];
    
    if (req.user.role === 'team') {
      countQuery += ' AND w.team_id = $1';
      countParams = [req.user.team_id];
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Data query with pagination - filter theo team nếu là team user
    let dataQuery = `
      SELECT DISTINCT ON (w.id, wbs.isp_name)
        w.id,
        w.domain,
        t.name as team_name,
        w.status,
        wbs.isp_name,
        wbs.status as block_status,
        wbs.checked_at
       FROM website w
       INNER JOIN website_block_status wbs ON w.id = wbs.website_id
       LEFT JOIN teams t ON w.team_id = t.id
       WHERE wbs.status != 'OK'
    `;
    let dataParams = [];
    
    if (req.user.role === 'team') {
      dataQuery += ' AND w.team_id = $1';
      dataParams = [req.user.team_id];
    }
    
    dataQuery += ' ORDER BY w.id, wbs.isp_name, wbs.checked_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const result = await db.query(dataQuery, dataParams);

    res.json({ 
      success: true, 
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Thống kê ranking changes - đã xóa bảng keyword_rank_history
router.get('/ranking-changes', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    // Trả về danh sách website có keyword - filter theo team nếu là team user
    let query = `
      SELECT 
        w.id as website_id,
        w.keyword,
        w.domain,
        w.status
       FROM website w
       WHERE w.keyword IS NOT NULL AND w.keyword != ''
    `;
    let params = [];
    
    if (req.user.role === 'team') {
      query += ' AND w.team_id = $1';
      params = [req.user.team_id];
    }
    
    query += ' ORDER BY w.created_at DESC LIMIT 50';
    
    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



