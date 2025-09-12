import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!process.env.DATABASE_URL) {
      logger.warn('DATABASE_URL environment variable is not set - database features disabled');
      return;
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { 
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
};

export const query = async (text: string, params?: any[]): Promise<any> => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};