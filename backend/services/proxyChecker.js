const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

/**
 * Kiểm tra website có bị chặn qua proxy của nhà mạng không
 */
class ProxyChecker {
  constructor() {
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Parse proxy URL thành object
   */
  parseProxyUrl(proxyUrl) {
    try {
      const url = new URL(proxyUrl);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: url.port,
        auth: url.username && url.password ? {
          username: url.username,
          password: url.password
        } : null
      };
    } catch (error) {
      throw new Error(`Invalid proxy URL: ${proxyUrl}`);
    }
  }

  /**
   * Tạo proxy agent
   */
  createProxyAgent(proxyUrl) {
    const proxy = this.parseProxyUrl(proxyUrl);
    
    const agentOptions = {
      host: proxy.host,
      port: proxy.port,
      ...(proxy.auth && {
        auth: `${proxy.auth.username}:${proxy.auth.password}`
      })
    };

    if (proxy.protocol === 'https') {
      return new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`, agentOptions);
    } else {
      return new HttpProxyAgent(`http://${proxy.host}:${proxy.port}`, agentOptions);
    }
  }

  /**
   * Kiểm tra website qua proxy
   */
  async checkWebsite(domain, proxyUrl) {
    const startTime = Date.now();
    const url = `https://${domain}`;
    
    try {
      const agent = this.createProxyAgent(proxyUrl);
      
      const response = await axios.get(url, {
        httpsAgent: agent,
        httpAgent: agent,
        timeout: this.timeout,
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Chấp nhận mọi status < 500
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const responseTime = Date.now() - startTime;
      const httpCode = response.status;

      // Phân tích kết quả
      let status = 'OK';
      if (httpCode === 403 || httpCode === 451) {
        status = 'BLOCK_HTTP';
      } else if (httpCode >= 200 && httpCode < 300) {
        status = 'OK';
      } else if (httpCode >= 300 && httpCode < 400) {
        status = 'OK'; // Redirect được coi là OK
      } else {
        status = 'BLOCK_UNKNOWN';
      }

      return {
        status,
        httpCode,
        responseTime,
        errorMessage: null
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let status = 'BLOCK_UNKNOWN';
      let errorMessage = error.message;

      // Phân tích lỗi
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        status = 'BLOCK_DNS';
        errorMessage = 'DNS resolution failed';
      } else if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        status = 'BLOCK_HTTPS';
        errorMessage = error.code === 'ETIMEDOUT' ? 'Connection timeout' : 'Connection reset';
      } else if (error.code === 'ECONNREFUSED') {
        status = 'BLOCK_HTTPS';
        errorMessage = 'Connection refused';
      } else if (error.response) {
        // Có response nhưng status code lỗi
        status = error.response.status === 403 || error.response.status === 451 
          ? 'BLOCK_HTTP' 
          : 'BLOCK_UNKNOWN';
        errorMessage = `HTTP ${error.response.status}`;
      }

      return {
        status,
        httpCode: error.response?.status || null,
        responseTime,
        errorMessage
      };
    }
  }

  /**
   * Kiểm tra nhiều website qua một proxy
   */
  async checkMultipleWebsites(domains, proxyUrl) {
    const results = [];
    for (const domain of domains) {
      const result = await this.checkWebsite(domain, proxyUrl);
      results.push({
        domain,
        ...result
      });
      // Delay nhỏ giữa các request để tránh rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results;
  }
}

module.exports = new ProxyChecker();



