const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const WebsiteBlockStatus = require('../models/WebsiteBlockStatus');
const db = require('../config/database');

// Dashboard tổng quan
router.get('/overview', async (req, res) => {
  try {
    // Tổng số website
    const totalWebsitesResult = await db.query('SELECT COUNT(*) as count FROM website');
    const totalWebsites = parseInt(totalWebsitesResult.rows[0].count);

    // Website bị chặn (trong 24h gần nhất)
    const blockedWebsitesResult = await db.query(
      `SELECT COUNT(DISTINCT website_id) as count 
       FROM website_block_status 
       WHERE checked_at >= NOW() - INTERVAL '1 day' 
       AND status != 'OK'`
    );
    const blockedWebsites = parseInt(blockedWebsitesResult.rows[0].count);

    // Tổng số keyword (từ cột keyword trong website)
    const totalKeywordsResult = await db.query(
      `SELECT COUNT(*) as count FROM website WHERE keyword IS NOT NULL AND keyword != ''`
    );
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
router.get('/blocked-websites', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Count query
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT w.id) as total
       FROM website w
       INNER JOIN website_block_status wbs ON w.id = wbs.website_id
       WHERE wbs.status != 'OK'`
    );
    const total = parseInt(countResult.rows[0].total);

    // Data query with pagination
    const result = await db.query(
      `SELECT DISTINCT ON (w.id, wbs.isp_name)
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
       ORDER BY w.id, wbs.isp_name, wbs.checked_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

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
router.get('/ranking-changes', async (req, res) => {
  try {
    // Trả về danh sách website có keyword
    const result = await db.query(
      `SELECT 
        w.id as website_id,
        w.keyword,
        w.domain,
        w.status
       FROM website w
       WHERE w.keyword IS NOT NULL AND w.keyword != ''
       ORDER BY w.created_at DESC
       LIMIT 50`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



