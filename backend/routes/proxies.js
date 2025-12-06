const express = require('express');
const router = express.Router();
const ProxyISP = require('../models/ProxyISP');
const proxyChecker = require('../services/proxyChecker');

// Lấy danh sách proxy
router.get('/', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filters = { page, limit };
    const result = await ProxyISP.getAll(filters);
    res.json({ 
      success: true, 
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy danh sách proxy đang hoạt động
router.get('/active', async (req, res) => {
  try {
    const proxies = await ProxyISP.getActive();
    res.json({ success: true, data: proxies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Lấy chi tiết proxy
router.get('/:id', async (req, res) => {
  try {
    const proxy = await ProxyISP.getById(req.params.id);
    if (!proxy) {
      return res.status(404).json({ success: false, error: 'Proxy not found' });
    }
    res.json({ success: true, data: proxy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tạo proxy mới
router.post('/', async (req, res) => {
  try {
    const { isp_name, proxy_url, status } = req.body;
    
    if (!isp_name || !proxy_url) {
      return res.status(400).json({ success: false, error: 'ISP name and proxy URL are required' });
    }
    
    const proxy = await ProxyISP.create({ isp_name, proxy_url, status });
    res.status(201).json({ success: true, data: proxy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cập nhật proxy
router.put('/:id', async (req, res) => {
  try {
    const { isp_name, proxy_url, status } = req.body;
    const proxy = await ProxyISP.update(req.params.id, { isp_name, proxy_url, status });
    res.json({ success: true, data: proxy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Xóa proxy
router.delete('/:id', async (req, res) => {
  try {
    await ProxyISP.delete(req.params.id);
    res.json({ success: true, message: 'Proxy deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test proxy
router.post('/:id/test', async (req, res) => {
  try {
    const proxy = await ProxyISP.getById(req.params.id);
    if (!proxy) {
      return res.status(404).json({ success: false, error: 'Proxy not found' });
    }
    
    const { testDomain } = req.body;
    const domain = testDomain || 'google.com';
    
    const result = await proxyChecker.checkWebsite(domain, proxy.proxy_url);
    
    // Cập nhật last_check
    await ProxyISP.updateLastCheck(req.params.id);
    
    res.json({
      success: true,
      data: {
        proxy: proxy.isp_name,
        testDomain: domain,
        ...result
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;



