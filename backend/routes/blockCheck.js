const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const ProxyISP = require('../models/ProxyISP');
const WebsiteBlockStatus = require('../models/WebsiteBlockStatus');
const proxyChecker = require('../services/proxyChecker');

// Check chặn cho một website
router.post('/check/:websiteId', async (req, res) => {
  try {
    const website = await Website.getById(req.params.websiteId);
    if (!website) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    // Lấy danh sách proxy đang hoạt động
    const proxies = await ProxyISP.getActive();
    if (proxies.length === 0) {
      return res.status(400).json({ success: false, error: 'No active proxies available' });
    }

    const results = [];
    let hasBlocked = false;
    let hasError = false;
    
    // Check qua từng proxy
    for (const proxy of proxies) {
      try {
        // Build proxy_url từ các trường riêng nếu chưa có
        const proxyUrl = ProxyISP.buildProxyUrl(proxy);
        if (!proxyUrl) {
          results.push({
            isp: proxy.isp_name,
            status: 'ERROR',
            errorMessage: 'Proxy URL cannot be built from provided fields'
          });
          continue;
        }
        
        const checkResult = await proxyChecker.checkWebsite(website.domain, proxyUrl);
        
        // Lưu kết quả vào database
        await WebsiteBlockStatus.create({
          website_id: website.id,
          isp_name: proxy.isp_name,
          status: checkResult.status,
          http_code: checkResult.httpCode,
          error_message: checkResult.errorMessage
        });

        // Cập nhật last_check cho proxy
        await ProxyISP.updateLastCheck(proxy.id);

        // Kiểm tra nếu có bị chặn
        if (checkResult.status !== 'OK') {
          hasBlocked = true;
        }
        if (checkResult.status === 'ERROR') {
          hasError = true;
        }

        results.push({
          isp: proxy.isp_name,
          ...checkResult
        });

        // Delay nhỏ giữa các request
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        hasError = true;
        results.push({
          isp: proxy.isp_name,
          status: 'ERROR',
          errorMessage: error.message
        });
      }
    }

    // Tự động cập nhật status của website dựa trên kết quả check
    let websiteStatus = 'active';
    if (hasBlocked) {
      websiteStatus = 'blocked';
    } else if (hasError) {
      websiteStatus = 'error';
    }
    
    // Cập nhật status của website
    await Website.update(website.id, {
      domain: website.domain,
      team_id: website.team_id,
      status: websiteStatus,
      note: website.note
    });

    res.json({
      success: true,
      data: {
        website: website.domain,
        status: websiteStatus,
        results
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check chặn cho nhiều website
router.post('/check-batch', async (req, res) => {
  try {
    const { websiteIds } = req.body;
    
    if (!websiteIds || !Array.isArray(websiteIds)) {
      return res.status(400).json({ success: false, error: 'websiteIds array is required' });
    }

    const proxies = await ProxyISP.getActive();
    if (proxies.length === 0) {
      return res.status(400).json({ success: false, error: 'No active proxies available' });
    }

    const allResults = [];

    for (const websiteId of websiteIds) {
      const website = await Website.getById(websiteId);
      if (!website) continue;

      const websiteResults = [];

      for (const proxy of proxies) {
        try {
          // Build proxy_url từ các trường riêng nếu chưa có
          const proxyUrl = ProxyISP.buildProxyUrl(proxy);
          if (!proxyUrl) {
            websiteResults.push({
              isp: proxy.isp_name,
              status: 'ERROR',
              errorMessage: 'Proxy URL cannot be built from provided fields'
            });
            continue;
          }
          
          const checkResult = await proxyChecker.checkWebsite(website.domain, proxyUrl);
          
          await WebsiteBlockStatus.create({
            website_id: website.id,
            isp_name: proxy.isp_name,
            status: checkResult.status,
            http_code: checkResult.httpCode,
            error_message: checkResult.errorMessage
          });

          websiteResults.push({
            isp: proxy.isp_name,
            ...checkResult
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          websiteResults.push({
            isp: proxy.isp_name,
            status: 'ERROR',
            errorMessage: error.message
          });
        }
      }

      allResults.push({
        website: website.domain,
        results: websiteResults
      });
    }

    res.json({
      success: true,
      data: allResults
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



