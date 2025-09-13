import { Router } from 'express';
import { runMigration } from '../utils/migrate';
import { logger } from '../utils/logger';

const router = Router();

// Migration endpoint (for production setup)
router.post('/migrate', async (req, res) => {
  try {
    logger.info('Starting database migration via API...');
    await runMigration();
    res.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });
  } catch (error) {
    logger.error('Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for migration status
router.get('/migration-status', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const result = await query('SELECT COUNT(*) FROM users');
    res.json({ 
      success: true, 
      tables_exist: true,
      user_count: result.rows[0].count 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      tables_exist: false,
      error: 'Tables not found - migration needed'
    });
  }
});

export default router;