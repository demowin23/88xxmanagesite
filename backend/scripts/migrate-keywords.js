require('dotenv').config();
const db = require('../config/database');

// Migration script để chuyển keywords vào bảng website
async function migrateKeywords() {
  try {
    console.log('Starting keywords migration...');

    // 1. Thêm cột keywords vào bảng website nếu chưa có
    try {
      await db.query(`
        ALTER TABLE website 
        ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb
      `);
      console.log('✅ Added keywords column to website table');
    } catch (error) {
      if (error.code !== '42701') { // Column already exists
        throw error;
      }
      console.log('✅ Keywords column already exists');
    }

    // 2. Migrate dữ liệu từ website_keywords sang website.keywords (nếu có bảng cũ)
    try {
      const hasOldTable = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'website_keywords'
        )
      `);

      if (hasOldTable.rows[0].exists) {
        console.log('Migrating keywords from website_keywords table...');
        
        // Lấy tất cả websites
        const websites = await db.query('SELECT id FROM website');
        
        for (const website of websites.rows) {
          // Lấy keywords từ bảng cũ
          const oldKeywords = await db.query(
            'SELECT keyword FROM website_keywords WHERE website_id = $1 AND is_active = true',
            [website.id]
          );
          
          if (oldKeywords.rows.length > 0) {
            const keywordsArray = oldKeywords.rows.map(row => row.keyword);
            await db.query(
              'UPDATE website SET keywords = $1::jsonb WHERE id = $2',
              [JSON.stringify(keywordsArray), website.id]
            );
            console.log(`Migrated ${keywordsArray.length} keywords for website ${website.id}`);
          }
        }
        
        console.log('✅ Keywords migration completed');
      } else {
        console.log('No old website_keywords table found, skipping migration');
      }
    } catch (error) {
      console.log('Note: Could not migrate old keywords:', error.message);
    }

    // 3. Cập nhật keyword_rank_history để dùng website_id và keyword text
    try {
      // Kiểm tra xem đã có cột website_id và keyword chưa
      const columns = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'keyword_rank_history'
      `);
      
      const columnNames = columns.rows.map(r => r.column_name);
      
      if (!columnNames.includes('website_id')) {
        // Thêm cột website_id và keyword
        await db.query(`
          ALTER TABLE keyword_rank_history 
          ADD COLUMN website_id INTEGER REFERENCES website(id) ON DELETE CASCADE,
          ADD COLUMN keyword VARCHAR(255)
        `);
        console.log('✅ Added website_id and keyword columns to keyword_rank_history');
        
        // Migrate dữ liệu từ website_keyword_id sang website_id và keyword
        const hasOldColumn = columnNames.includes('website_keyword_id');
        if (hasOldColumn) {
          await db.query(`
            UPDATE keyword_rank_history krh
            SET website_id = wk.website_id,
                keyword = wk.keyword
            FROM website_keywords wk
            WHERE krh.website_keyword_id = wk.id
          `);
          console.log('✅ Migrated rank history data');
        }
      } else {
        console.log('✅ keyword_rank_history already has website_id and keyword columns');
      }
    } catch (error) {
      console.log('Note: Could not update keyword_rank_history:', error.message);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateKeywords();

