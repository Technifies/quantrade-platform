import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { backtraderService } from '../services/backtrader';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all strategies for user
router.get('/', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const result = await query(`
      SELECT * FROM strategies 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch strategies:', error);
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// Get strategy by ID
router.get('/:id', 
  param('id').isUUID(),
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      const result = await query(`
        SELECT * FROM strategies 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Failed to fetch strategy:', error);
      res.status(500).json({ error: 'Failed to fetch strategy' });
    }
  }
);

// Create new strategy
router.post('/',
  [
    body('name').trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('code').trim().isLength({ min: 1 }),
    body('parameters').optional().isObject()
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, code, parameters } = req.body;
      const userId = req.user?.id;

      // Validate strategy code
      const validation = await backtraderService.validateStrategy(code);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Invalid strategy code',
          details: validation.errors 
        });
      }

      const result = await query(`
        INSERT INTO strategies (id, user_id, name, description, code, parameters, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'draft', NOW(), NOW())
        RETURNING *
      `, [userId, name, description, code, JSON.stringify(parameters || {})]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create strategy:', error);
      res.status(500).json({ error: 'Failed to create strategy' });
    }
  }
);

// Update strategy
router.put('/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('code').optional().trim().isLength({ min: 1 }),
    body('parameters').optional().isObject(),
    body('status').optional().isIn(['draft', 'backtested', 'live', 'paused'])
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body;

      // Check if strategy exists
      const existingResult = await query(`
        SELECT * FROM strategies WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      // Validate code if provided
      if (updates.code) {
        const validation = await backtraderService.validateStrategy(updates.code);
        if (!validation.valid) {
          return res.status(400).json({ 
            error: 'Invalid strategy code',
            details: validation.errors 
          });
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (['name', 'description', 'code', 'status'].includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(updates[key]);
          paramIndex++;
        } else if (key === 'parameters') {
          updateFields.push(`parameters = $${paramIndex}`);
          updateValues.push(JSON.stringify(updates[key]));
          paramIndex++;
        }
      });

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id, userId);

      const result = await query(`
        UPDATE strategies 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `, updateValues);

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update strategy:', error);
      res.status(500).json({ error: 'Failed to update strategy' });
    }
  }
);

// Delete strategy
router.delete('/:id',
  param('id').isUUID(),
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const userId = req.user?.id;

      const result = await query(`
        DELETE FROM strategies 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      res.json({ message: 'Strategy deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete strategy:', error);
      res.status(500).json({ error: 'Failed to delete strategy' });
    }
  }
);

// Get strategy templates
router.get('/templates/list', async (req: express.Request, res: express.Response) => {
  try {
    const templates = [
      { id: 'moving_average', name: 'Moving Average Crossover', description: 'Simple moving average crossover strategy' },
      { id: 'rsi', name: 'RSI Strategy', description: 'RSI overbought/oversold strategy' }
    ];
    res.json(templates);
  } catch (error) {
    logger.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get strategy template code
router.get('/templates/:templateType', async (req: express.Request, res: express.Response) => {
  try {
    const { templateType } = req.params;
    const template = await backtraderService.generateStrategyTemplate(templateType);
    res.json({ template });
  } catch (error) {
    logger.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

export default router;