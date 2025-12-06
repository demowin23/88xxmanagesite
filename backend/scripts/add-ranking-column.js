require('dotenv').config();
const db = require('../config/database');

// Script để thêm cột ranking vào bảng website
async function addRankingColumn() {
  try {
    console.log('Adding ranking column to website table...');

    // Kiểm tra xem cột ranking đã tồn tại chưa
    const checkColumn = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'website' 
      AND column_name = 'ranking'
    `);

    if (checkColumn.rows.length > 0) {
      console.log(`✅ Ranking column already exists: ${checkColumn.rows[0].data_type}`);
    } else {
      console.log('Adding ranking column...');
      
      // Thêm cột ranking (INTEGER để lưu vị trí ranking)
      await db.query(`
        ALTER TABLE website 
        ADD COLUMN ranking INTEGER
      `);
      
      console.log('✅ Added ranking column to website table');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

addRankingColumn();

