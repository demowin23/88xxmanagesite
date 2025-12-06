const db = require('../config/database');

class WebsiteBlockStatus {
  static async create(data) {
    const { website_id, isp_name, status, http_code, error_message } = data;
    const result = await db.query(
      `INSERT INTO website_block_status (website_id, isp_name, status, http_code, error_message) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [website_id, isp_name, status, http_code, error_message]
    );
    return result.rows[0];
  }

  static async getByWebsite(websiteId, limit = 100) {
    const result = await db.query(
      `SELECT * FROM website_block_status 
       WHERE website_id = $1 
       ORDER BY checked_at DESC 
       LIMIT $2`,
      [websiteId, limit]
    );
    return result.rows;
  }

  static async getLatestByISP(websiteId) {
    const result = await db.query(
      `SELECT DISTINCT ON (wbs.isp_name) wbs.* 
       FROM website_block_status wbs
       WHERE wbs.website_id = $1 
       ORDER BY wbs.isp_name, wbs.checked_at DESC`,
      [websiteId]
    );
    return result.rows;
  }

  static async getStatistics() {
    const result = await db.query(
      `SELECT 
        isp_name,
        status,
        COUNT(*) as count
       FROM website_block_status
       WHERE checked_at >= NOW() - INTERVAL '1 day'
       GROUP BY isp_name, status`
    );
    return result.rows;
  }
}

module.exports = WebsiteBlockStatus;



