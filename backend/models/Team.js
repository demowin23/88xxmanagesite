const db = require('../config/database');

class Team {
  static async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    // Count query
    const countResult = await db.query('SELECT COUNT(*) as total FROM teams');
    const total = parseInt(countResult.rows[0].total);

    // Data query with pagination
    const result = await db.query(
      'SELECT * FROM teams ORDER BY name LIMIT $1 OFFSET $2',
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

  static async getById(id) {
    const result = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async getByName(name) {
    const result = await db.query('SELECT * FROM teams WHERE name = $1', [name]);
    return result.rows[0];
  }

  static async create(data) {
    const { name, description } = data;
    const result = await db.query(
      'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, description } = data;
    const result = await db.query(
      'UPDATE teams SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM teams WHERE id = $1', [id]);
    return { id };
  }
}

module.exports = Team;

