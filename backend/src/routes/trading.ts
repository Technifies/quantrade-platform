import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Get trading signals
router.get('/signals', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(`
      SELECT ts.*, s.name as strategy_name
      FROM trading_signals ts
      JOIN strategies s ON ts.strategy_id = s.id
      WHERE s.user_id = $1
      ORDER BY ts.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch trading signals:', error);
    res.status(500).json({ error: 'Failed to fetch trading signals' });
  }
});

// Execute trading signal
router.post('/signals/:signalId/execute',
  param('signalId').isUUID(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { signalId } = req.params;
      const userId = req.user?.id;

      // Get signal details
      const signalResult = await query(`
        SELECT ts.*, s.user_id
        FROM trading_signals ts
        JOIN strategies s ON ts.strategy_id = s.id
        WHERE ts.id = $1 AND s.user_id = $2 AND ts.status = 'generated'
      `, [signalId, userId]);

      if (signalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Signal not found or already executed' });
      }

      const signal = signalResult.rows[0];

      // Here you would integrate with TradingService.executeSignal
      // For now, we'll simulate the execution
      
      // Update signal status
      await query(`
        UPDATE trading_signals 
        SET status = 'executed', updated_at = NOW()
        WHERE id = $1
      `, [signalId]);

      // Create trade record
      const tradeResult = await query(`
        INSERT INTO trades (
          id, user_id, strategy_id, symbol, side, quantity, 
          entry_price, stop_loss, target_price, status, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW()
        )
        RETURNING *
      `, [
        userId,
        signal.strategy_id,
        signal.symbol,
        signal.action,
        signal.quantity,
        signal.price,
        signal.stop_loss,
        signal.target
      ]);

      logger.info(`Signal executed: ${signalId} for user ${userId}`);
      res.json({
        message: 'Signal executed successfully',
        trade: tradeResult.rows[0]
      });
    } catch (error) {
      logger.error('Signal execution failed:', error);
      res.status(500).json({ error: 'Signal execution failed' });
    }
  }
);

// Get trades
router.get('/trades', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    let whereClause = 'WHERE user_id = $1';
    const queryParams = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    const result = await query(`
      SELECT t.*, s.name as strategy_name
      FROM trades t
      LEFT JOIN strategies s ON t.strategy_id = s.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get positions
router.get('/positions', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(`
      SELECT * FROM positions 
      WHERE user_id = $1 AND quantity > 0
      ORDER BY updated_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Close position
router.post('/positions/close/:positionId',
  param('positionId').isUUID(),
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { positionId } = req.params;
      const userId = req.user?.id;

      // Verify position belongs to user
      const positionResult = await query(`
        SELECT * FROM positions 
        WHERE id = $1 AND user_id = $2 AND quantity > 0
      `, [positionId, userId]);

      if (positionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Position not found' });
      }

      const position = positionResult.rows[0];

      // Here you would integrate with TradingService.closePosition
      // For now, we'll simulate the closure
      
      // Update position
      await query(`
        UPDATE positions 
        SET quantity = 0, status = 'closed', updated_at = NOW()
        WHERE id = $1
      `, [positionId]);

      // Create closing trade record
      await query(`
        INSERT INTO trades (
          id, user_id, symbol, side, quantity, entry_price, 
          status, created_at
        )
        VALUES (
          gen_random_uuid(), $1, $2, 'SELL', $3, $4, 'pending', NOW()
        )
      `, [userId, position.symbol, position.quantity, position.current_price]);

      logger.info(`Position closed: ${positionId} for user ${userId}`);
      res.json({ message: 'Position closed successfully' });
    } catch (error) {
      logger.error('Position closure failed:', error);
      res.status(500).json({ error: 'Position closure failed' });
    }
  }
);

export default router;