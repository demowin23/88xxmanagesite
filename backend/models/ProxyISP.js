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
    
    // Đảm bảo proxy_url được build từ các trường riêng nếu chưa có
    const data = result.rows.map(proxy => {
      if (!proxy.proxy_url && proxy.ip && proxy.port && proxy.username && proxy.password) {
        proxy.proxy_url = this.buildProxyUrl(proxy);
      }
      return proxy;
    });
    
    return {
      data,
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
    // Đảm bảo proxy_url được build từ các trường riêng nếu chưa có
    return result.rows.map(proxy => {
      if (!proxy.proxy_url && proxy.ip && proxy.port && proxy.username && proxy.password) {
        proxy.proxy_url = this.buildProxyUrl(proxy);
      }
      return proxy;
    });
  }

  static async getById(id) {
    const result = await db.query('SELECT * FROM proxy_isp WHERE id = $1', [id]);
    const proxy = result.rows[0];
    if (proxy && !proxy.proxy_url && proxy.ip && proxy.port && proxy.username && proxy.password) {
      proxy.proxy_url = this.buildProxyUrl(proxy);
    }
    return proxy;
  }

  static async create(data) {
    const { isp_name, ip, port, username, password, status } = data;
    
    if (!isp_name || !ip || !port || !username || !password) {
      throw new Error('ISP name, IP, port, username, and password are required');
    }
    
    // Build proxy_url từ các trường riêng
    const proxy_url = `http://${username}:${password}@${ip}:${port}`;
    
    const result = await db.query(
      'INSERT INTO proxy_isp (isp_name, proxy_url, ip, port, username, password, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [isp_name, proxy_url, ip, port, username, password, status || 'active']
    );
    return result.rows[0];
  }
  
  /**
   * Build proxy URL từ các trường riêng
   */
  static buildProxyUrl(proxy) {
    if (proxy.proxy_url) {
      return proxy.proxy_url;
    }
    if (proxy.ip && proxy.port && proxy.username && proxy.password) {
      return `http://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
    }
    return null;
  }

  static async update(id, data) {
    const { isp_name, ip, port, username, password, status } = data;
    
    // Build proxy_url từ các trường riêng
    let proxy_url = null;
    if (ip && port && username && password) {
      proxy_url = `http://${username}:${password}@${ip}:${port}`;
    }
    
    const result = await db.query(
      'UPDATE proxy_isp SET isp_name = $1, proxy_url = $2, ip = $3, port = $4, username = $5, password = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [isp_name, proxy_url, ip, port, username, password, status, id]
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



