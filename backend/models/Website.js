const db = require('../config/database');

class Website {
  static async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        w.*, 
        t.name as team_name, 
        t.id as team_id,
        CASE WHEN w.keyword IS NOT NULL AND w.keyword != '' THEN 1 ELSE 0 END as keywords_count
      FROM website w
      LEFT JOIN teams t ON w.team_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.search) {
      query += ` AND w.domain ILIKE $${paramCount}`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND w.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.team_id) {
      query += ` AND w.team_id = $${paramCount}`;
      params.push(filters.team_id);
      paramCount++;
    }

    if (filters.has_keyword !== undefined) {
      if (filters.has_keyword) {
        query += ` AND w.keyword IS NOT NULL AND w.keyword != ''`;
      } else {
        query += ` AND (w.keyword IS NULL OR w.keyword = '')`;
      }
    }

    // Count query
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Data query with pagination
    query += ` ORDER BY w.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    
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

  static async getById(id) {
    const result = await db.query(
      `SELECT w.*, t.name as team_name, t.id as team_id
       FROM website w
       LEFT JOIN teams t ON w.team_id = t.id
       WHERE w.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getByDomain(domain) {
    const result = await db.query(
      `SELECT w.*, t.name as team_name, t.id as team_id
       FROM website w
       LEFT JOIN teams t ON w.team_id = t.id
       WHERE w.domain = $1`,
      [domain]
    );
    return result.rows[0];
  }

  static async create(data) {
    const { domain, team_id, keyword, status, note } = data;
    
    // Chỉ INSERT các field được cung cấp, không set status nếu null
    const fields = ['domain'];
    const values = [domain];
    let paramCount = 2;
    
    if (team_id !== undefined && team_id !== null && team_id !== '') {
      fields.push('team_id');
      values.push(team_id);
      paramCount++;
    }
    
    if (keyword !== undefined && keyword !== null && keyword !== '') {
      fields.push('keyword');
      values.push(keyword.trim());
      paramCount++;
    }
    
    // Chỉ set status nếu được cung cấp và không null
    if (status !== undefined && status !== null && status !== '') {
      fields.push('status');
      values.push(status);
      paramCount++;
    }
    
    if (note !== undefined && note !== null) {
      fields.push('note');
      values.push(note);
      paramCount++;
    }
    
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO website (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const { domain, team_id, keyword, ranking, status, note } = data;
    const result = await db.query(
      'UPDATE website SET domain = $1, team_id = $2, keyword = $3, ranking = $4, status = $5, note = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [domain, team_id || null, keyword || null, ranking !== undefined ? ranking : null, status, note, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM website WHERE id = $1', [id]);
    return { id };
  }

  static async getBlockStatus(websiteId) {
    const result = await db.query(
      `SELECT * FROM website_block_status 
       WHERE website_id = $1 
       ORDER BY checked_at DESC 
       LIMIT 10`,
      [websiteId]
    );
    return result.rows;
  }

  static async getLatestBlockStatus(websiteId) {
    const result = await db.query(
      `SELECT DISTINCT ON (wbs.isp_name) wbs.*, pi.isp_name 
       FROM website_block_status wbs
       JOIN proxy_isp pi ON wbs.isp_name = pi.isp_name
       WHERE wbs.website_id = $1 
       ORDER BY wbs.isp_name, wbs.checked_at DESC`,
      [websiteId]
    );
    return result.rows;
  }
}

module.exports = Website;



