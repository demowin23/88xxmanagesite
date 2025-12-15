const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const WebsiteBlockStatus = require('../models/WebsiteBlockStatus');
const serpApiService = require('../services/serpApiService');
const axios = require('axios');
const { authenticate, requireTeamOrAdmin } = require('../middleware/auth');

// Lấy danh sách website với filter
router.get('/', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const { search, status, team_id, has_keyword, page, limit } = req.query;
    const filters = { search, status, team_id, page, limit };
    
    // Nếu là team user, chỉ được xem website của team mình
    if (req.user.role === 'team') {
      filters.team_id = req.user.team_id;
    }
    // Admin có thể filter theo team_id nếu muốn, nhưng không bắt buộc
    
    if (has_keyword !== undefined) {
      filters.has_keyword = has_keyword === 'true' || has_keyword === '1';
    }
    const result = await Website.getAll(filters);
    res.json({ 
      success: true, 
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy chi tiết website
router.get('/:id', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const website = await Website.getById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    // Nếu là team user, chỉ được xem website của team mình
    if (req.user.role === 'team' && website.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Lấy block status mới nhất
    const blockStatus = await Website.getLatestBlockStatus(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...website,
        blockStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tạo website mới
router.post('/', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const { domain, team_id, keyword, note, checkRankingAfterCreate } = req.body;
    
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    
    // Nếu là team user, chỉ được tạo website cho team mình
    const finalTeamId = req.user.role === 'team' ? req.user.team_id : team_id;
    
    // Không set status khi tạo mới, chỉ set sau khi check
    const website = await Website.create({ domain, team_id: finalTeamId, keyword: keyword?.trim() || null, status: null, note });
    
    // Lấy website đầy đủ thông tin sau khi tạo (bao gồm team_name, keyword, etc.)
    const fullWebsite = await Website.getById(website.id);
    
    // Nếu có keyword và được yêu cầu check ranking ngay
    if (keyword && keyword.trim() && checkRankingAfterCreate) {
      try {
        const result = await serpApiService.checkRanking(
          keyword.trim(),
          fullWebsite.domain,
          null,
          { gl: 'vn', hl: 'vi' }
        );
        
        // Cập nhật ranking vào bảng website nếu tìm thấy
        if (result.success && result.position) {
          await Website.update(fullWebsite.id, {
            domain: fullWebsite.domain,
            team_id: fullWebsite.team_id,
            keyword: fullWebsite.keyword,
            ranking: result.position,
            status: fullWebsite.status,
            note: fullWebsite.note
          });
        }
        
        // Lấy website mới nhất với ranking
        const updatedWebsite = await Website.getById(fullWebsite.id);
        return res.status(201).json({ 
          success: true, 
          data: updatedWebsite,
          rankingResult: result
        });
      } catch (error) {
        // Vẫn trả về website đã tạo dù check ranking lỗi
        return res.status(201).json({ 
          success: true, 
          data: fullWebsite,
          rankingError: error.message
        });
      }
    }
    
    res.status(201).json({ success: true, data: fullWebsite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật website
router.put('/:id', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    // Kiểm tra website có tồn tại và quyền truy cập
    const existingWebsite = await Website.getById(req.params.id);
    if (!existingWebsite) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    // Nếu là team user, chỉ được sửa website của team mình
    if (req.user.role === 'team' && existingWebsite.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const { domain, team_id, keyword, status, note } = req.body;
    
    // Nếu là team user, không được đổi team_id
    const finalTeamId = req.user.role === 'team' ? req.user.team_id : team_id;
    
    const website = await Website.update(req.params.id, { 
      domain, 
      team_id: finalTeamId, 
      keyword: keyword?.trim() || null, 
      status, 
      note 
    });
    res.json({ success: true, data: website });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa website
router.delete('/:id', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    // Kiểm tra website có tồn tại và quyền truy cập
    const website = await Website.getById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    // Nếu là team user, chỉ được xóa website của team mình
    if (req.user.role === 'team' && website.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    await Website.delete(req.params.id);
    res.json({ success: true, message: 'Website deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy lịch sử block status
router.get('/:id/block-status', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    // Kiểm tra quyền truy cập
    const website = await Website.getById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    if (req.user.role === 'team' && website.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const history = await WebsiteBlockStatus.getByWebsite(req.params.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check redirect của website (301, 302, etc.)
router.get('/:id/check-redirect', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const website = await Website.getById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role === 'team' && website.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const domain = website.domain;
    const url = `https://${domain}`;
    
    try {
      // Gọi với maxRedirects = 0 để không follow redirect, chỉ lấy status code và Location header
      const response = await axios.get(url, {
        maxRedirects: 0,
        validateStatus: () => true, // Chấp nhận mọi status code
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const statusCode = response.status;
      const redirectUrl = response.headers.location || null;
      const isRedirect = statusCode >= 300 && statusCode < 400;

      // Nếu có redirect, follow để lấy URL cuối cùng
      let finalRedirectUrl = null;
      if (isRedirect && redirectUrl) {
        try {
          // Xử lý relative URL
          let followUrl = redirectUrl;
          if (!redirectUrl.startsWith('http')) {
            // Relative URL - cần resolve
            if (redirectUrl.startsWith('//')) {
              followUrl = `https:${redirectUrl}`;
            } else if (redirectUrl.startsWith('/')) {
              followUrl = `https://${domain}${redirectUrl}`;
            } else {
              followUrl = `https://${domain}/${redirectUrl}`;
            }
          }
          
          const followResponse = await axios.get(followUrl, {
            maxRedirects: 10,
            validateStatus: () => true,
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          finalRedirectUrl = followResponse.request?.res?.responseUrl || followResponse.request?.responseURL || followUrl;
        } catch (e) {
          // Nếu không follow được, dùng redirectUrl ban đầu
          finalRedirectUrl = redirectUrl;
        }
      }

      return res.json({
        success: true,
        data: {
          domain,
          statusCode: statusCode,
          isRedirect: isRedirect,
          redirectType: statusCode === 301 ? '301 Permanent Redirect' : 
                       statusCode === 302 ? '302 Temporary Redirect' :
                       statusCode === 307 ? '307 Temporary Redirect' :
                       statusCode === 308 ? '308 Permanent Redirect' : null,
          redirectUrl: redirectUrl,
          finalRedirectUrl: finalRedirectUrl,
          originalUrl: url
        }
      });
    } catch (error) {
      console.error('Error checking redirect:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check ranking cho keyword của website
router.post('/:id/check-ranking', authenticate, requireTeamOrAdmin, async (req, res) => {
  try {
    const website = await Website.getById(req.params.id);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }
    
    // Kiểm tra quyền truy cập
    if (req.user.role === 'team' && website.team_id !== req.user.team_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!website.keyword || !website.keyword.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'No keyword found for this website' 
      });
    }

    // Check ranking với mặc định Việt Nam, Tiếng Việt
    const defaultOptions = {
      gl: 'vn', // Quốc gia: Việt Nam
      hl: 'vi', // Ngôn ngữ: Tiếng Việt
      ...req.body.options
    };

    const result = await serpApiService.checkRanking(
      website.keyword.trim(),
      website.domain,
      null,
      defaultOptions
    );

    // Cập nhật ranking vào bảng website
    if (result.success && result.position) {
      await Website.update(req.params.id, {
        domain: website.domain,
        team_id: website.team_id,
        keyword: website.keyword,
        ranking: result.position,
        status: website.status,
        note: website.note
      });
    } else {
      // Nếu không tìm thấy, set ranking = null
      await Website.update(req.params.id, {
        domain: website.domain,
        team_id: website.team_id,
        keyword: website.keyword,
        ranking: null,
        status: website.status,
        note: website.note
      });
    }

    // Lấy website mới nhất với ranking đã cập nhật
    const updatedWebsite = await Website.getById(req.params.id);

    res.json({
      success: true,
      data: {
        website: updatedWebsite,
        result
      },
      message: result.success ? 'Ranking checked successfully' : `Error: ${result.error || 'Unknown error'}`
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

module.exports = router;



