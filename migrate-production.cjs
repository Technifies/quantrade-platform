const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection using your Northflank URL
const DATABASE_URL = "postgresql://_2e2b19cf9acbcab2:_e4ce12500496f999b32729ca748d8d@primary.quant-platform-database--lt5sgl89h54n.addon.code.run:28499/_db9f02bdcb81?sslmode=require";

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting database migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'backend/src/utils/init-database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Execute migration
    await client.query(sql);
    console.log('✅ Database schema created successfully');
    
    // Test connection with a simple query
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Users table ready (current count: ${result.rows[0].count})`);
    
    client.release();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch(console.error);