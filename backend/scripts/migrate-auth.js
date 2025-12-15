require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Cập nhật bảng users và tạo admin user
const migrateAuth = async () => {
  try {
    // Thêm team_id vào bảng users nếu chưa có
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
    `);
    console.log('✓ Added team_id column to users');

    // Thêm role mặc định nếu chưa có
    await db.query(`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'team'
    `);
    console.log('✓ Updated role default');

    // Tạo admin user mặc định nếu chưa có
    const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
        ['admin', hashedPassword, 'admin']
      );
      console.log('✓ Created default admin user (username: admin, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    console.log('Auth migration completed successfully');
  } catch (err) {
    throw err;
  }
};

// Chạy migration
migrateAuth()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });

