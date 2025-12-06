const express = require('express');
const router = express.Router();
const WebsiteKeyword = require('../models/WebsiteKeyword');
const KeywordRankHistory = require('../models/KeywordRankHistory');
const Website = require('../models/Website');
const serpApiService = require('../services/serpApiService');

// Lấy keywords của một website
router.get('/website/:websiteId', async (req, res) => {
  try {
    const keywords = await WebsiteKeyword.getByWebsite(req.params.websiteId);
    res.json({ success: true, data: keywords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy chi tiết keyword
router.get('/:id', async (req, res) => {
  try {
    const keyword = await WebsiteKeyword.getById(req.params.id);
    if (!keyword) {
      return res.status(404).json({ success: false, error: 'Keyword not found' });
    }
    
    // Lấy lịch sử ranking
    const history = await KeywordRankHistory.getByKeyword(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...keyword,
        history
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tạo keyword mới
router.post('/', async (req, res) => {
  try {
    const { website_id, keyword, target_url, note, is_active } = req.body;
    
    if (!website_id || !keyword) {
      return res.status(400).json({ success: false, error: 'Website ID and keyword are required' });
    }
    
    const keywordData = await WebsiteKeyword.create({
      website_id,
      keyword,
      target_url,
      note,
      is_active
    });
    
    res.status(201).json({ success: true, data: keywordData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật keyword
router.put('/:id', async (req, res) => {
  try {
    const { keyword, target_url, note, is_active } = req.body;
    const keywordData = await WebsiteKeyword.update(req.params.id, {
      keyword,
      target_url,
      note,
      is_active
    });
    res.json({ success: true, data: keywordData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa keyword
router.delete('/:id', async (req, res) => {
  try {
    await WebsiteKeyword.delete(req.params.id);
    res.json({ success: true, message: 'Keyword deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check ranking cho một keyword
router.post('/:id/check-ranking', async (req, res) => {
  try {
    const keywordData = await WebsiteKeyword.getById(req.params.id);
    if (!keywordData) {
      return res.status(404).json({ success: false, error: 'Keyword not found' });
    }

    const website = await Website.getById(keywordData.website_id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Check ranking với mặc định Việt Nam, Tiếng Việt
    const options = {
      gl: 'vn', // Quốc gia: Việt Nam
      hl: 'vi', // Ngôn ngữ: Tiếng Việt
      ...req.body.options
    };
    
    const result = await serpApiService.checkRanking(
      keywordData.keyword,
      website.domain,
      keywordData.target_url,
      options
    );

    // Lưu kết quả vào database (kể cả khi không tìm thấy ranking)
    if (result.success || result.error) {
      await KeywordRankHistory.create({
        website_keyword_id: keywordData.id,
        position: result.position,
        found_url: result.foundUrl,
        serpapi_search_id: result.searchId
      });
    }

    // Trả về kết quả với thông tin chi tiết
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to check ranking',
        data: result
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        message: result.position 
          ? `Found at position ${result.position}` 
          : 'Not found in top 100 results'
      }
    });
  } catch (error) {
    // Xử lý lỗi API key
    if (error.message.includes('SERPAPI_KEY')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        hint: 'Please add your SerpAPI key to .env file. Get your API key at https://serpapi.com/'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Lấy lịch sử ranking
router.get('/:id/rank-history', async (req, res) => {
  try {
    const history = await KeywordRankHistory.getByKeyword(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check ranking cho tất cả keywords của một website
router.post('/website/:websiteId/check-all', async (req, res) => {
  try {
    const website = await Website.getById(req.params.websiteId);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Lấy tất cả keywords active của website
    const keywords = await WebsiteKeyword.getByWebsite(req.params.websiteId);
    const activeKeywords = keywords.filter(k => k.is_active);

    if (activeKeywords.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active keywords found for this website' 
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Check ranking cho từng keyword với mặc định Việt Nam, Tiếng Việt
    const defaultOptions = {
      gl: 'vn', // Quốc gia: Việt Nam
      hl: 'vi', // Ngôn ngữ: Tiếng Việt
      ...req.body.options
    };
    
    for (let i = 0; i < activeKeywords.length; i++) {
      const keyword = activeKeywords[i];
      try {
        const result = await serpApiService.checkRanking(
          keyword.keyword,
          website.domain,
          keyword.target_url,
          defaultOptions
        );

        // Lưu kết quả vào database
        if (result.success || result.error) {
          await KeywordRankHistory.create({
            website_keyword_id: keyword.id,
            position: result.position,
            found_url: result.foundUrl,
            serpapi_search_id: result.searchId
          });
        }

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }

        results.push({
          keyword: keyword.keyword,
          ...result
        });

        // Delay giữa các request để tránh rate limit (quan trọng cho gói Free)
        if (i < activeKeywords.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        errorCount++;
        results.push({
          keyword: keyword.keyword,
          success: false,
          error: error.message
        });
      }
    }

    // Lấy website mới nhất với ranking đã cập nhật
    const updatedWebsite = await Website.getById(req.params.websiteId);

    res.json({
      success: true,
      data: {
        website: updatedWebsite,
        totalKeywords: activeKeywords.length,
        successCount,
        errorCount,
        results
      },
      message: `Checked ${successCount} keywords successfully, ${errorCount} failed`
    });
  } catch (error) {
    if (error.message.includes('SERPAPI_KEY')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        hint: 'Please add your SerpAPI key to .env file. Get your FREE API key at https://serpapi.com/'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test SerpAPI connection
router.get('/test/serpapi', async (req, res) => {
  try {
    const testKeyword = req.query.keyword || 'test';
    const testDomain = req.query.domain || 'example.com';
    
    const result = await serpApiService.checkRanking(
      testKeyword,
      testDomain,
      null,
      { num: 10 } // Chỉ lấy 10 kết quả đầu để test nhanh
    );

    res.json({
      success: result.success,
      message: result.success 
        ? 'SerpAPI connection successful!' 
        : 'SerpAPI connection failed',
      data: {
        keyword: result.keyword,
        domain: result.domain,
        position: result.position,
        error: result.error
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: error.message.includes('SERPAPI_KEY') 
        ? 'Please configure SERPAPI_KEY in your .env file. Get your API key at https://serpapi.com/'
        : null
    });
  }
});

module.exports = router;



