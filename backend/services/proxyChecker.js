const axios = require('axios');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

/**
 * Service để check website có bị chặn không thông qua proxy
 */
class ProxyChecker {
  constructor() {
    this.timeout = 10000; // 10 giây timeout mặc định
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Parse proxy URL để lấy thông tin
   * Format: http://user:pass@host:port hoặc socks5://user:pass@host:port
   */
  parseProxyUrl(proxyUrl) {
    try {
      const url = new URL(proxyUrl);
      return {
        protocol: url.protocol.replace(':', ''), // http, https, socks5
        host: url.hostname,
        port: url.port || (url.protocol.includes('https') ? 443 : 80),
        username: url.username || '',
        password: url.password || '',
        fullUrl: proxyUrl
      };
    } catch (error) {
      throw new Error(`Invalid proxy URL format: ${proxyUrl}`);
    }
  }

  /**
   * Tạo proxy agent dựa trên protocol
   */
  createProxyAgent(proxyInfo) {
    const { protocol, host, port, username, password } = proxyInfo;
    
    // Tạo auth string nếu có username/password
    let authString = '';
    if (username && password) {
      authString = `${username}:${password}@`;
    }
    
    const proxyUrl = `${protocol}://${authString}${host}:${port}`;

    switch (protocol) {
      case 'http':
        return new HttpProxyAgent(proxyUrl);
      case 'https':
        return new HttpsProxyAgent(proxyUrl);
      case 'socks5':
      case 'socks':
        return new SocksProxyAgent(proxyUrl);
      default:
        // Mặc định dùng HTTPS proxy agent
        return new HttpsProxyAgent(proxyUrl);
    }
  }

  /**
   * Check website qua HTTP
   */
  async checkHTTP(domain, proxyAgent) {
    try {
      const url = `http://${domain}`;
      const response = await axios.get(url, {
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        },
        validateStatus: () => true, // Chấp nhận mọi status code
        maxRedirects: 5
      });

      return {
        success: true,
        httpCode: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        return {
          success: false,
          error: 'DNS resolution failed',
          httpCode: null
        };
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Connection failed or timeout',
          httpCode: null
        };
      }
      return {
        success: false,
        error: error.message,
        httpCode: null
      };
    }
  }

  /**
   * Check website qua HTTPS
   */
  async checkHTTPS(domain, proxyAgent) {
    try {
      const url = `https://${domain}`;
      const response = await axios.get(url, {
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        },
        validateStatus: () => true,
        maxRedirects: 5
      });

      return {
        success: true,
        httpCode: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        return {
          success: false,
          error: 'DNS resolution failed',
          httpCode: null
        };
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: 'Connection failed or timeout',
          httpCode: null
        };
      }
      if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        // Certificate error nhưng vẫn có thể kết nối được
        return {
          success: true,
          httpCode: 200,
          statusText: 'OK (certificate warning)'
        };
      }
      return {
        success: false,
        error: error.message,
        httpCode: null
      };
    }
  }

  /**
   * Xác định trạng thái chặn dựa trên kết quả check
   */
  determineBlockStatus(httpResult, httpsResult) {
    // Nếu cả HTTP và HTTPS đều fail
    if (!httpResult.success && !httpsResult.success) {
      // Kiểm tra lỗi cụ thể
      if (httpResult.error && httpResult.error.includes('DNS')) {
        return {
          status: 'BLOCK_DNS',
          httpCode: null,
          errorMessage: 'DNS resolution failed'
        };
      }
      if (httpResult.error && httpResult.error.includes('timeout')) {
        return {
          status: 'BLOCK_UNKNOWN',
          httpCode: null,
          errorMessage: 'Connection timeout'
        };
      }
      return {
        status: 'BLOCK_UNKNOWN',
        httpCode: null,
        errorMessage: httpResult.error || httpsResult.error || 'Connection failed'
      };
    }

    // Nếu HTTP fail nhưng HTTPS OK
    if (!httpResult.success && httpsResult.success) {
      return {
        status: 'BLOCK_HTTP',
        httpCode: httpsResult.httpCode,
        errorMessage: `HTTP blocked, HTTPS accessible (${httpsResult.httpCode})`
      };
    }

    // Nếu HTTPS fail nhưng HTTP OK
    if (httpResult.success && !httpsResult.success) {
      return {
        status: 'BLOCK_HTTPS',
        httpCode: httpResult.httpCode,
        errorMessage: `HTTPS blocked, HTTP accessible (${httpResult.httpCode})`
      };
    }

    // Nếu cả HTTP và HTTPS đều OK
    if (httpResult.success && httpsResult.success) {
      return {
        status: 'OK',
        httpCode: httpsResult.httpCode || httpResult.httpCode,
        errorMessage: null
      };
    }

    // Trường hợp không xác định được
    return {
      status: 'BLOCK_UNKNOWN',
      httpCode: null,
      errorMessage: 'Unable to determine block status'
    };
  }

  /**
   * Check website có bị chặn không qua proxy
   * @param {string} domain - Domain cần check (ví dụ: example.com)
   * @param {string} proxyUrl - Proxy URL (ví dụ: http://user:pass@ip:port)
   * @returns {Promise<Object>} Kết quả check với status, httpCode, errorMessage
   */
  async checkWebsite(domain, proxyUrl) {
    try {
      // Parse proxy URL
      const proxyInfo = this.parseProxyUrl(proxyUrl);
      
      // Tạo proxy agent
      const proxyAgent = this.createProxyAgent(proxyInfo);

      // Check HTTP và HTTPS qua proxy
      const [httpResult, httpsResult] = await Promise.allSettled([
        this.checkHTTP(domain, proxyAgent),
        this.checkHTTPS(domain, proxyAgent)
      ]);

      // Lấy kết quả từ Promise.allSettled
      const httpCheck = httpResult.status === 'fulfilled' ? httpResult.value : {
        success: false,
        error: httpResult.reason?.message || 'HTTP check failed',
        httpCode: null
      };

      const httpsCheck = httpsResult.status === 'fulfilled' ? httpsResult.value : {
        success: false,
        error: httpsResult.reason?.message || 'HTTPS check failed',
        httpCode: null
      };

      // Xác định trạng thái chặn
      const blockStatus = this.determineBlockStatus(httpCheck, httpsCheck);

      return {
        status: blockStatus.status,
        httpCode: blockStatus.httpCode,
        errorMessage: blockStatus.errorMessage,
        responseTime: Date.now() // Có thể tính toán chính xác hơn nếu cần
      };
    } catch (error) {
      return {
        status: 'ERROR',
        httpCode: null,
        errorMessage: error.message || 'Unknown error occurred',
        responseTime: null
      };
    }
  }
}

module.exports = new ProxyChecker();
