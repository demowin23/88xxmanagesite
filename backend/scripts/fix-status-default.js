require('dotenv').config();
const db = require('../config/database');

// Script để xóa DEFAULT value cho status nếu có
async function fixStatusDefault() {
  try {
    console.log('Checking and fixing status DEFAULT value...');

    // Kiểm tra xem có DEFAULT value không
    const checkDefault = await db.query(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'website' 
      AND column_name = 'status'
    `);

    if (checkDefault.rows.length > 0 && checkDefault.rows[0].column_default) {
      console.log(`Found DEFAULT value: ${checkDefault.rows[0].column_default}`);
      console.log('Removing DEFAULT value...');
      
      // Xóa DEFAULT value
      await db.query(`
        ALTER TABLE website 
        ALTER COLUMN status DROP DEFAULT
      `);
      
      console.log('✅ Removed DEFAULT value for status column');
    } else {
      console.log('✅ No DEFAULT value found for status column');
    }

    // Kiểm tra keyword column
    const checkKeyword = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'website' 
      AND column_name = 'keyword'
    `);

    if (checkKeyword.rows.length === 0) {
      console.log('Adding keyword column...');
      await db.query(`
        ALTER TABLE website 
        ADD COLUMN keyword VARCHAR(255)
      `);
      console.log('✅ Added keyword column');
    } else {
      console.log(`✅ Keyword column exists: ${checkKeyword.rows[0].data_type}`);
    }

    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fix error:', error);
    process.exit(1);
  }
}

fixStatusDefault();

