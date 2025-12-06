const db = require('../config/database');

class WebsiteKeyword {
  static async getByWebsite(websiteId) {
    const result = await db.query(
      'SELECT * FROM website_keywords WHERE website_id = $1 ORDER BY created_at DESC',
      [websiteId]
    );
    return result.rows;
  }

  static async getActive() {
    const result = await db.query(
      'SELECT * FROM website_keywords WHERE is_active = true ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM website_keywords WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { website_id, keyword, target_url, note, is_active } = data;
    const result = await db.query(
      'INSERT INTO website_keywords (website_id, keyword, target_url, note, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [website_id, keyword, target_url, note, is_active !== undefined ? is_active : true]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { keyword, target_url, note, is_active } = data;
    const result = await db.query(
      'UPDATE website_keywords SET keyword = $1, target_url = $2, note = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [keyword, target_url, note, is_active, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM website_keywords WHERE id = $1', [id]);
    return { id };
  }
}

module.exports = WebsiteKeyword;



