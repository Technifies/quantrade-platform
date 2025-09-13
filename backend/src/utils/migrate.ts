import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const runMigration = async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false,
  });

  try {
    console.log('🚀 Starting database migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'init-database.sql');
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
};

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };