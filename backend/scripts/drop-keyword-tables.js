require('dotenv').config();
const db = require('../config/database');

// Script để xóa các bảng keyword cũ
async function dropKeywordTables() {
  try {
    console.log('Dropping old keyword tables...');

    // 1. Xóa bảng website_keywords nếu có
    try {
      const hasTable = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'website_keywords'
        )
      `);

      if (hasTable.rows[0].exists) {
        console.log('Dropping website_keywords table...');
        await db.query('DROP TABLE IF EXISTS website_keywords CASCADE');
        console.log('✅ Dropped website_keywords table');
      } else {
        console.log('✅ website_keywords table does not exist');
      }
    } catch (error) {
      console.log('Note: Could not drop website_keywords:', error.message);
    }

    // 2. Xóa bảng keyword_rank_history nếu có (theo yêu cầu)
    try {
      const hasTable = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'keyword_rank_history'
        )
      `);

      if (hasTable.rows[0].exists) {
        console.log('Dropping keyword_rank_history table...');
        await db.query('DROP TABLE IF EXISTS keyword_rank_history CASCADE');
        console.log('✅ Dropped keyword_rank_history table');
      } else {
        console.log('✅ keyword_rank_history table does not exist');
      }
    } catch (error) {
      console.log('Note: Could not drop keyword_rank_history:', error.message);
    }

    console.log('\n✅ Drop completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Drop error:', error);
    process.exit(1);
  }
}

dropKeywordTables();

