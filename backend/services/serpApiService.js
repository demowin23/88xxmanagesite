const axios = require('axios');

/**
 * Service để gọi SerpAPI và lấy kết quả ranking
 * Hỗ trợ gói Free: 250 searches/tháng
 */
class SerpApiService {
  constructor() {
   
    this.apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
    this.baseUrl = 'https://serpapi.com/search.json';
    this.rateLimitDelay = 2000;
  }

  /**
   * Kiểm tra API key
   */
  validateApiKey() {
    if (!this.apiKey || this.apiKey === 'your_serpapi_key_here' || this.apiKey.trim() === '') {
      throw new Error('SERPAPI_KEY is not configured. Please add SERPAPI_KEY to your .env file. Get your FREE API key at https://serpapi.com/');
    }
  }

  /**
   * Tìm vị trí của domain/URL trong kết quả tìm kiếm
   */
  findDomainPosition(organicResults, targetDomain, targetUrl = null) {
    if (!organicResults || !Array.isArray(organicResults)) {
      return null;
    }

   
    const normalizeDomain = (domain) => {
      if (!domain) return '';
      return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase();
    };

    const targetDomainClean = normalizeDomain(targetDomain);
    const targetUrlClean = targetUrl ? normalizeDomain(targetUrl) : null;

    for (let i = 0; i < organicResults.length; i++) {
      const result = organicResults[i];
      const link = result.link || result.displayed_link || '';
      
      if (!link) continue;

      try {
       
        let url;
        try {
          url = new URL(link.startsWith('http') ? link : `https://${link}`);
        } catch {
         
          const normalized = normalizeDomain(link);
          if (normalized.includes(targetDomainClean)) {
            return {
              position: i + 1,
              foundUrl: link,
              title: result.title || '',
              snippet: result.snippet || ''
            };
          }
          continue;
        }

        const domain = normalizeDomain(url.hostname);

       
        if (domain === targetDomainClean || domain.includes(targetDomainClean) || targetDomainClean.includes(domain)) {
         
          if (targetUrlClean) {
            const linkNormalized = normalizeDomain(link);
            if (linkNormalized.includes(targetUrlClean) || targetUrlClean.includes(linkNormalized)) {
              return {
                position: i + 1,
                foundUrl: link,
                title: result.title || '',
                snippet: result.snippet || ''
              };
            }
          } else {
           
            return {
              position: i + 1,
              foundUrl: link,
              title: result.title || '',
              snippet: result.snippet || ''
            };
          }
        }
      } catch (e) {
       
        continue;
      }
    }

    return null;
  }

  /**
   * Tìm kiếm từ khóa và lấy ranking
   * Lưu ý: Gói Free có giới hạn 250 searches/tháng
   */
  async searchKeyword(keyword, options = {}) {
    this.validateApiKey();

   
    const {
      gl = 'vn',
      hl = 'vi',
      num = 100,
      start = 0 
    } = options;

    try {
      const params = {
        engine: 'google',
        q: keyword,
        api_key: this.apiKey,
        gl,
        hl,
        num,
        start
      };

      console.log(`[SerpAPI] Searching keyword: "${keyword}" with params:`, { gl, hl, num, start });

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 60000
      });

      const data = response.data;
      console.log(data);
     
      if (data.error) {
        console.error('SerpAPI Error Response:', data.error);
        
       
        let errorMessage = data.error;
        if (data.error.includes('insufficient') || data.error.includes('credits')) {
          errorMessage = 'Insufficient credits. Free plan includes 250 searches/month. Check usage at https://serpapi.com/dashboard';
        }
        
        return {
          success: false,
          keyword,
          totalResults: 0,
          organicResults: [],
          searchId: null,
          error: errorMessage
        };
      }

      const organicResults = data.organic_results || [];
      const searchMetadata = data.search_metadata || {};

      console.log(`[SerpAPI] Found ${organicResults.length} organic results for "${keyword}"`);

      return {
        success: true,
        keyword,
        totalResults: data.search_information?.total_results || 0,
        organicResults,
        searchId: searchMetadata.id || searchMetadata.google_job_id || null,
        searchTime: searchMetadata.created_at || null,
        error: null
      };
    } catch (error) {
      console.error('[SerpAPI] Request Error:', error.message);
      
     
      let errorMessage = error.message;
      if (error.response) {
       
        const responseData = error.response.data;
        if (responseData?.error) {
          errorMessage = responseData.error;
          if (responseData.error.includes('insufficient') || responseData.error.includes('credits')) {
            errorMessage = 'Insufficient credits. Free plan includes 250 searches/month. Check usage at https://serpapi.com/dashboard';
          }
        } else {
          errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
       
        errorMessage = 'No response from SerpAPI. Please check your internet connection.';
      }

      return {
        success: false,
        keyword,
        totalResults: 0,
        organicResults: [],
        searchId: null,
        error: errorMessage
      };
    }
  }

  async checkRanking(keyword, domain, targetUrl = null, options = {}) {
    const maxChecks = 3;
    let foundPosition = null;
    let foundUrl = null;
    let searchId = null;
    let lastError = null;

   
    for (let checkNum = 1; checkNum <= maxChecks; checkNum++) {
      let start, num;
      
      if (checkNum === 1) {
       
        start = 0;
        num = 50;
      } else if (checkNum === 2) {
       
        start = 10;
        num = 40;
      } else {
       
        start = 20;
        num = 30;
      }

      const searchOptions = {
        ...options,
        num,
        start
      };

      console.log(`[SerpAPI] Check ${checkNum}: start=${start}, num=${num} (checking positions ${start + 1}-${start + num})`);
      
      const searchResult = await this.searchKeyword(keyword, searchOptions);
      
      if (!searchResult.success) {
        lastError = searchResult.error;
       
        if (searchResult.error && searchResult.error.includes('insufficient')) {
         
          break;
        }
        continue;
      }

     
      if (!searchId && searchResult.searchId) {
        searchId = searchResult.searchId;
      }

     
      const positionData = this.findDomainPosition(
        searchResult.organicResults,
        domain,
        targetUrl
      );

      if (positionData?.position) {
       
       
        foundPosition = start + positionData.position;
        foundUrl = positionData.foundUrl;
        console.log(`[SerpAPI] Found "${domain}" at position ${foundPosition} in check ${checkNum}`);
        break;
      }

     
      console.log(`[SerpAPI] Not found in check ${checkNum}, continuing...`);
      
     
      if (checkNum < maxChecks) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return {
      success: foundPosition !== null,
      keyword,
      domain,
      position: foundPosition,
      foundUrl: foundUrl,
      searchId: searchId,
      error: foundPosition === null ? (lastError || 'Not found in first 50 positions') : null
    };
  }

  /**
   * Check ranking cho nhiều keyword (với delay để tránh rate limit)
   * Lưu ý: Gói Free có rate limit ~50 searches/giờ
   */
  async checkMultipleKeywords(keywords, domain, targetUrl = null, options = {}) {
    const results = [];
    
    console.log(`[SerpAPI] Checking ${keywords.length} keywords (Free plan: 250/month, ~50/hour)`);
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      const result = await this.checkRanking(keyword, domain, targetUrl, options);
      results.push(result);
      
     
      if (i < keywords.length - 1) {
        console.log(`[SerpAPI] Waiting ${this.rateLimitDelay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }
    
    return results;
  }
}

module.exports = new SerpApiService();
