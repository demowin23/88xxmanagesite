require('dotenv').config();
const db = require('../config/database');

// Migration script để chuyển keywords từ JSONB array sang VARCHAR string
async function migrateKeywordToString() {
  try {
    console.log('Starting keyword migration (JSONB array -> VARCHAR string)...');

    // 1. Thêm cột keyword mới nếu chưa có
    try {
      await db.query(`
        ALTER TABLE website 
        ADD COLUMN IF NOT EXISTS keyword VARCHAR(255)
      `);
      console.log('✅ Added keyword column to website table');
    } catch (error) {
      if (error.code !== '42701') { // Column already exists
        throw error;
      }
      console.log('✅ Keyword column already exists');
    }

    // 2. Migrate dữ liệu từ keywords (JSONB) sang keyword (VARCHAR)
    try {
      const hasKeywordsColumn = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'website' AND column_name = 'keywords'
        )
      `);

      if (hasKeywordsColumn.rows[0].exists) {
        console.log('Migrating keywords from JSONB array to VARCHAR string...');
        
        // Lấy tất cả websites có keywords
        const websites = await db.query(`
          SELECT id, keywords 
          FROM website 
          WHERE keywords IS NOT NULL 
          AND keywords != '[]'::jsonb
        `);
        
        for (const website of websites.rows) {
          try {
            let keywordValue = null;
            
            // Parse keywords từ JSONB
            if (website.keywords) {
              let keywordsArray = [];
              if (typeof website.keywords === 'string') {
                keywordsArray = JSON.parse(website.keywords);
              } else {
                keywordsArray = website.keywords;
              }
              
              // Lấy keyword đầu tiên nếu có
              if (Array.isArray(keywordsArray) && keywordsArray.length > 0) {
                keywordValue = keywordsArray[0]; // Lấy keyword đầu tiên
              }
            }
            
            if (keywordValue) {
              await db.query(
                'UPDATE website SET keyword = $1 WHERE id = $2',
                [keywordValue, website.id]
              );
              console.log(`Migrated keyword for website ${website.id}: "${keywordValue}"`);
            }
          } catch (error) {
            console.error(`Error migrating website ${website.id}:`, error.message);
          }
        }
        
        console.log('✅ Keywords migration completed');
      } else {
        console.log('No keywords column found, skipping migration');
      }
    } catch (error) {
      console.log('Note: Could not migrate keywords:', error.message);
    }

    // 3. Xóa cột keywords cũ (JSONB) nếu muốn
    // Uncomment dòng dưới nếu muốn xóa cột cũ sau khi migrate
    // await db.query('ALTER TABLE website DROP COLUMN IF EXISTS keywords');

    console.log('\n✅ Migration completed successfully!');
    console.log('Note: Old "keywords" column (JSONB) is still in the table.');
    console.log('You can drop it manually if needed: ALTER TABLE website DROP COLUMN IF EXISTS keywords;');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateKeywordToString();

