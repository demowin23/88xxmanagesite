const cron = require('node-cron');
const Website = require('../models/Website');
const ProxyISP = require('../models/ProxyISP');
const WebsiteBlockStatus = require('../models/WebsiteBlockStatus');
const proxyChecker = require('./proxyChecker');
const serpApiService = require('./serpApiService');

class Scheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Chạy check chặn cho tất cả website
   */
  async runBlockCheck() {
    if (this.isRunning) {
      console.log('Block check is already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduled block check...');

    try {
      const websites = await Website.getAll();
      const proxies = await ProxyISP.getActive();

      if (proxies.length === 0) {
        console.log('No active proxies available');
        return;
      }

      let checked = 0;
      for (const website of websites) {
        try {
          for (const proxy of proxies) {
            const result = await proxyChecker.checkWebsite(website.domain, proxy.proxy_url);
            
            await WebsiteBlockStatus.create({
              website_id: website.id,
              isp_name: proxy.isp_name,
              status: result.status,
              http_code: result.httpCode,
              error_message: result.errorMessage
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          checked++;
          console.log(`Checked ${website.domain} (${checked}/${websites.length})`);
        } catch (error) {
          console.error(`Error checking ${website.domain}:`, error.message);
        }
      }

      console.log(`Block check completed. Checked ${checked} websites.`);
    } catch (error) {
      console.error('Scheduled block check error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Chạy check ranking cho tất cả websites có keyword
   */
  async runRankingCheck() {
    console.log('Starting scheduled ranking check...');

    try {
      const websites = await Website.getAll();
      let totalChecked = 0;

      for (const website of websites) {
        if (!website.keyword || !website.keyword.trim()) continue;

        try {
          // Check ranking với mặc định Việt Nam, Tiếng Việt
          const result = await serpApiService.checkRanking(
            website.keyword.trim(),
            website.domain,
            null,
            { gl: 'vn', hl: 'vi' }
          );

          // Check ranking - không lưu lịch sử nữa (đã xóa bảng keyword_rank_history)

          totalChecked++;
          console.log(`Checked: ${website.domain} - "${website.keyword}" (${totalChecked} total)`);

          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error checking ${website.domain} - "${website.keyword}":`, error.message);
        }
      }

      console.log(`Ranking check completed. Checked ${totalChecked} keywords.`);
    } catch (error) {
      console.error('Scheduled ranking check error:', error);
    }
  }

  /**
   * Khởi động scheduler
   */
  start() {
    // Check chặn mỗi 6 giờ
    cron.schedule('0 */6 * * *', () => {
      this.runBlockCheck();
    });

    // Check ranking mỗi ngày lúc 2h sáng
    cron.schedule('0 2 * * *', () => {
      this.runRankingCheck();
    });

    console.log('Scheduler started');
    console.log('- Block check: Every 6 hours');
    console.log('- Ranking check: Daily at 2:00 AM');
  }

  /**
   * Dừng scheduler
   */
  stop() {
    // Cron jobs sẽ tự động dừng khi process kết thúc
    console.log('Scheduler stopped');
  }
}

module.exports = new Scheduler();



