require('dotenv').config();
const db = require('../config/database');

// Tạo các bảng
const createTables = async () => {
  try {
    // Bảng teams
    await db.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng website
    await db.query(`
      CREATE TABLE IF NOT EXISTS website (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) NOT NULL UNIQUE,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        keyword VARCHAR(255),
        ranking INTEGER,
        status VARCHAR(50),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng proxy_isp
    await db.query(`
      CREATE TABLE IF NOT EXISTS proxy_isp (
        id SERIAL PRIMARY KEY,
        isp_name VARCHAR(255) NOT NULL UNIQUE,
        proxy_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        last_check TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng website_block_status
    await db.query(`
      CREATE TABLE IF NOT EXISTS website_block_status (
        id SERIAL PRIMARY KEY,
        website_id INTEGER NOT NULL REFERENCES website(id) ON DELETE CASCADE,
        isp_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        http_code INTEGER,
        error_message TEXT,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(website_id, isp_name, checked_at)
      )
    `);

    // Bảng keyword_rank_history - ĐÃ XÓA, keyword giờ nằm trong bảng website

    // Bảng users (cho phân quyền)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bảng activity_log
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo index để tối ưu query
    await db.query(`CREATE INDEX IF NOT EXISTS idx_website_team_id ON website(team_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_website_block_status_website_id ON website_block_status(website_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_website_block_status_checked_at ON website_block_status(checked_at)`);
    // Index cho keyword_rank_history - ĐÃ XÓA

    console.log('All tables created successfully');
  } catch (err) {
    throw err;
  }
};

// Chạy migration
createTables()
  .then(() => {
    console.log('Database migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });



