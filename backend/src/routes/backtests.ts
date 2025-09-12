import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { backtraderService } from '../services/backtrader';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all backtests for user
router.get('/', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const result = await query(`
      SELECT b.*, s.name as strategy_name
      FROM backtests b
      JOIN strategies s ON b.strategy_id = s.id
      WHERE s.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch backtests:', error);
    res.status(500).json({ error: 'Failed to fetch backtests' });
  }
});

// Get backtest by ID
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
        SELECT b.*, s.name as strategy_name
        FROM backtests b
        JOIN strategies s ON b.strategy_id = s.id
        WHERE b.id = $1 AND s.user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Backtest not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Failed to fetch backtest:', error);
      res.status(500).json({ error: 'Failed to fetch backtest' });
    }
  }
);

// Run backtest
router.post('/',
  [
    body('strategyId').isUUID(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('initialCapital').isFloat({ min: 1000 }),
    body('symbols').isArray({ min: 1 }),
    body('symbols.*').isString().trim().isLength({ min: 1 })
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { strategyId, startDate, endDate, initialCapital, symbols } = req.body;
      const userId = req.user?.id;

      // Get strategy details
      const strategyResult = await query(`
        SELECT * FROM strategies 
        WHERE id = $1 AND user_id = $2
      `, [strategyId, userId]);

      if (strategyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const strategy = strategyResult.rows[0];

      // Prepare backtest request
      const backtestRequest = {
        strategyId,
        strategyCode: strategy.code,
        parameters: strategy.parameters || {},
        startDate,
        endDate,
        initialCapital,
        symbols,
        dataSource: 'yahoo' as 'yahoo'
      };

      // Run backtest
      logger.info(`Starting backtest for strategy ${strategyId}`);
      const backtestResult = await backtraderService.runBacktest(backtestRequest);

      // Save backtest results to database
      const saveResult = await query(`
        INSERT INTO backtests (
          id, strategy_id, start_date, end_date, initial_capital, 
          final_capital, total_trades, win_rate, max_drawdown, 
          sharpe_ratio, total_return, results, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        )
        RETURNING *
      `, [
        strategyId,
        startDate,
        endDate,
        initialCapital,
        backtestResult.finalCapital,
        backtestResult.totalTrades,
        backtestResult.winRate,
        backtestResult.maxDrawdown,
        backtestResult.sharpeRatio,
        backtestResult.totalReturn,
        JSON.stringify(backtestResult.results)
      ]);

      // Update strategy status to backtested
      await query(`
        UPDATE strategies 
        SET status = 'backtested', updated_at = NOW()
        WHERE id = $1
      `, [strategyId]);

      const savedBacktest = saveResult.rows[0];
      res.status(201).json({
        ...savedBacktest,
        results: backtestResult.results
      });

    } catch (error) {
      logger.error('Backtest failed:', error);
      res.status(500).json({ 
        error: 'Backtest failed',
        details: (error as Error).message 
      });
    }
  }
);

// Get backtests for a specific strategy
router.get('/strategy/:strategyId',
  param('strategyId').isUUID(),
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { strategyId } = req.params;
      const userId = req.user?.id;

      // Verify strategy belongs to user
      const strategyResult = await query(`
        SELECT id FROM strategies 
        WHERE id = $1 AND user_id = $2
      `, [strategyId, userId]);

      if (strategyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Strategy not found' });
      }

      const result = await query(`
        SELECT * FROM backtests 
        WHERE strategy_id = $1
        ORDER BY created_at DESC
      `, [strategyId]);

      res.json(result.rows);
    } catch (error) {
      logger.error('Failed to fetch strategy backtests:', error);
      res.status(500).json({ error: 'Failed to fetch strategy backtests' });
    }
  }
);

// Delete backtest
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
        DELETE FROM backtests 
        WHERE id = $1 AND strategy_id IN (
          SELECT id FROM strategies WHERE user_id = $2
        )
        RETURNING id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Backtest not found' });
      }

      res.json({ message: 'Backtest deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete backtest:', error);
      res.status(500).json({ error: 'Failed to delete backtest' });
    }
  }
);

export default router;