const db = require('../config/database');

class KeywordRankHistory {
  static async create(data) {
    const { website_id, keyword, position, found_url, serpapi_search_id } = data;
    const result = await db.query(
      `INSERT INTO keyword_rank_history (website_id, keyword, position, found_url, serpapi_search_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [website_id, keyword, position, found_url, serpapi_search_id]
    );
    return result.rows[0];
  }

  static async getByWebsite(websiteId, limit = 100) {
    const result = await db.query(
      `SELECT * FROM keyword_rank_history 
       WHERE website_id = $1 
       ORDER BY checked_at DESC 
       LIMIT $2`,
      [websiteId, limit]
    );
    return result.rows;
  }

  static async getByWebsiteAndKeyword(websiteId, keyword, limit = 100) {
    const result = await db.query(
      `SELECT * FROM keyword_rank_history 
       WHERE website_id = $1 AND keyword = $2
       ORDER BY checked_at DESC 
       LIMIT $3`,
      [websiteId, keyword, limit]
    );
    return result.rows;
  }

  static async getLatestByWebsiteAndKeyword(websiteId, keyword) {
    const result = await db.query(
      `SELECT * FROM keyword_rank_history 
       WHERE website_id = $1 AND keyword = $2
       ORDER BY checked_at DESC 
       LIMIT 1`,
      [websiteId, keyword]
    );
    return result.rows[0];
  }

  static async getStatistics() {
    const result = await db.query(
      `SELECT 
        DATE(checked_at) as date,
        COUNT(*) as total_checks,
        AVG(position) as avg_position,
        COUNT(CASE WHEN position IS NULL THEN 1 END) as not_found_count
       FROM keyword_rank_history
       WHERE checked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(checked_at)
       ORDER BY date DESC`
    );
    return result.rows;
  }
}

module.exports = KeywordRankHistory;



