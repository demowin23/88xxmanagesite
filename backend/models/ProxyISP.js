const db = require('../config/database');

class ProxyISP {
  static async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    // Count query
    const countResult = await db.query('SELECT COUNT(*) as total FROM proxy_isp');
    const total = parseInt(countResult.rows[0].total);

    // Data query with pagination
    const result = await db.query(
      'SELECT * FROM proxy_isp ORDER BY isp_name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getActive() {
    const result = await db.query(
      "SELECT * FROM proxy_isp WHERE status = 'active' ORDER BY isp_name"
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM proxy_isp WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { isp_name, proxy_url, status } = data;
    const result = await db.query(
      'INSERT INTO proxy_isp (isp_name, proxy_url, status) VALUES ($1, $2, $3) RETURNING *',
      [isp_name, proxy_url, status || 'active']
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { isp_name, proxy_url, status } = data;
    const result = await db.query(
      'UPDATE proxy_isp SET isp_name = $1, proxy_url = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [isp_name, proxy_url, status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM proxy_isp WHERE id = $1', [id]);
    return { id };
  }

  static async updateLastCheck(id) {
    await db.query('UPDATE proxy_isp SET last_check = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }
}

module.exports = ProxyISP;



