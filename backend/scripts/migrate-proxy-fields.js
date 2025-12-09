require('dotenv').config();
const db = require('../config/database');

// Thay đổi cấu trúc bảng proxy_isp: thay proxy_url bằng ip, port, username, password
const migrateProxyFields = async () => {
  try {
    // Kiểm tra xem các cột mới đã tồn tại chưa
    const checkColumns = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'proxy_isp' 
      AND column_name IN ('ip', 'port', 'username', 'password')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Thêm các cột mới nếu chưa có
    if (!existingColumns.includes('ip')) {
      await db.query(`ALTER TABLE proxy_isp ADD COLUMN ip VARCHAR(255)`);
      console.log('✓ Added column: ip');
    }
    
    if (!existingColumns.includes('port')) {
      await db.query(`ALTER TABLE proxy_isp ADD COLUMN port INTEGER`);
      console.log('✓ Added column: port');
    }
    
    if (!existingColumns.includes('username')) {
      await db.query(`ALTER TABLE proxy_isp ADD COLUMN username VARCHAR(255)`);
      console.log('✓ Added column: username');
    }
    
    if (!existingColumns.includes('password')) {
      await db.query(`ALTER TABLE proxy_isp ADD COLUMN password VARCHAR(255)`);
      console.log('✓ Added column: password');
    }
    
    // Migrate dữ liệu từ proxy_url sang các cột mới (nếu có proxy_url)
    const proxies = await db.query('SELECT id, proxy_url FROM proxy_isp WHERE proxy_url IS NOT NULL AND proxy_url != \'\'');
    
    for (const proxy of proxies.rows) {
      try {
        const url = new URL(proxy.proxy_url);
        const ip = url.hostname;
        const port = url.port || (url.protocol.includes('https') ? 443 : 80);
        const username = url.username || '';
        const password = url.password || '';
        
        await db.query(
          'UPDATE proxy_isp SET ip = $1, port = $2, username = $3, password = $4 WHERE id = $5',
          [ip, port, username, password, proxy.id]
        );
        console.log(`✓ Migrated proxy ${proxy.id}`);
      } catch (error) {
        console.log(`⚠ Could not migrate proxy ${proxy.id}: ${error.message}`);
      }
    }
    
    // Không xóa proxy_url để tương thích ngược, nhưng có thể set nullable
    console.log('Migration completed successfully');
  } catch (err) {
    throw err;
  }
};

// Chạy migration
migrateProxyFields()
  .then(() => {
    console.log('Proxy fields migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });

