require('dotenv').config();
const db = require('../config/database');

// Script để thêm cột keyword vào bảng website
async function addKeywordColumn() {
  try {
    console.log('Adding keyword column to website table...');

    // Kiểm tra xem cột keyword đã tồn tại chưa
    const checkColumn = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'website' 
      AND column_name = 'keyword'
    `);

    if (checkColumn.rows.length > 0) {
      console.log(`✅ Keyword column already exists: ${checkColumn.rows[0].data_type}`);
    } else {
      console.log('Adding keyword column...');
      
      // Thêm cột keyword
      await db.query(`
        ALTER TABLE website 
        ADD COLUMN keyword VARCHAR(255)
      `);
      
      console.log('✅ Added keyword column to website table');
    }

    // Kiểm tra và xóa cột keywords (JSONB) nếu có
    const checkKeywordsColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'website' 
      AND column_name = 'keywords'
    `);

    if (checkKeywordsColumn.rows.length > 0) {
      console.log('Found old keywords column (JSONB), dropping it...');
      await db.query(`
        ALTER TABLE website 
        DROP COLUMN IF EXISTS keywords
      `);
      console.log('✅ Dropped old keywords column');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

addKeywordColumn();

