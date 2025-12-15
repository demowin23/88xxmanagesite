const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async getByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { username, password, role = 'team', team_id = null } = data;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (username, password, role, team_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashedPassword, role, team_id]
    );
    
    // Không trả về password
    const user = result.rows[0];
    delete user.password;
    return user;
  }

  static async update(id, data) {
    const { username, password, role, team_id } = data;
    
    let query = 'UPDATE users SET';
    const params = [];
    let paramCount = 1;
    const updates = [];

    if (username !== undefined) {
      updates.push(`username = $${paramCount}`);
      params.push(username);
      paramCount++;
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount}`);
      params.push(hashedPassword);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (team_id !== undefined) {
      updates.push(`team_id = $${paramCount}`);
      params.push(team_id);
      paramCount++;
    }

    if (updates.length === 0) {
      return await this.getById(id);
    }

    params.push(id);
    query += ` ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);
    const user = result.rows[0];
    if (user) {
      delete user.password;
    }
    return user;
  }

  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return { id };
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getByTeamId(teamId) {
    const result = await db.query('SELECT * FROM users WHERE team_id = $1', [teamId]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult.rows[0].total);

    const result = await db.query(
      'SELECT id, username, role, team_id, created_at FROM users ORDER BY username LIMIT $1 OFFSET $2',
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
}

module.exports = User;

