import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { RiskCalculator } from '../utils/riskCalculator';
import { logger } from '../utils/logger';

const router = express.Router();

// Get portfolio risk metrics
router.get('/portfolio', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    // Get current positions
    const positionsResult = await query(`
      SELECT COUNT(*) as position_count, 
             COALESCE(SUM(quantity * current_price), 0) as total_exposure,
             COALESCE(SUM(unrealized_pnl), 0) as unrealized_pnl
      FROM positions 
      WHERE user_id = $1 AND quantity > 0
    `, [userId]);

    // Get today's realized P&L
    const tradesResult = await query(`
      SELECT COALESCE(SUM(pnl), 0) as realized_pnl
      FROM trades 
      WHERE user_id = $1 AND status = 'completed' 
      AND DATE(executed_at) = CURRENT_DATE
    `, [userId]);

    // Get user's risk profile
    const userResult = await query(`
      SELECT risk_profile FROM users WHERE id = $1
    `, [userId]);

    const positionData = positionsResult.rows[0];
    const tradeData = tradesResult.rows[0];
    const riskProfile = userResult.rows[0]?.risk_profile;

    if (!riskProfile) {
      return res.status(404).json({ error: 'Risk profile not found' });
    }

    const riskCalculator = new RiskCalculator(riskProfile);
    const buyingPower = riskCalculator.getBuyingPower();
    const currentExposure = parseFloat(positionData.total_exposure);
    const unrealizedPnl = parseFloat(positionData.unrealized_pnl);
    const realizedPnl = parseFloat(tradeData.realized_pnl);
    const positionsCount = parseInt(positionData.position_count);

    const dailyPnl = unrealizedPnl + realizedPnl;
    const dailyDrawdown = dailyPnl < 0 ? Math.abs(dailyPnl) : 0;
    const riskUtilization = riskCalculator.calculateRiskUtilization(currentExposure, positionsCount);

    const metrics = {
      currentExposure,
      availableMargin: buyingPower - currentExposure,
      unrealizedPnl,
      realizedPnl,
      dailyDrawdown,
      positionsCount,
      riskUtilization
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to fetch risk metrics:', error);
    res.status(500).json({ error: 'Failed to fetch risk metrics' });
  }
});

// Get current exposure
router.get('/exposure', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(`
      SELECT 
        symbol,
        quantity,
        avg_price,
        current_price,
        (quantity * current_price) as exposure,
        unrealized_pnl
      FROM positions 
      WHERE user_id = $1 AND quantity > 0
      ORDER BY exposure DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch exposure:', error);
    res.status(500).json({ error: 'Failed to fetch exposure' });
  }
});

// Get drawdown history
router.get('/drawdown', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;

    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END) as daily_loss,
        SUM(pnl) as daily_pnl,
        COUNT(*) as trades_count
      FROM trades 
      WHERE user_id = $1 AND status = 'completed'
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId]);

    // Calculate running drawdown
    let runningPnl = 0;
    let peak = 0;
    const drawdownData = result.rows.map((row: any) => {
      runningPnl += parseFloat(row.daily_pnl);
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      const drawdown = peak > 0 ? ((peak - runningPnl) / peak) * 100 : 0;

      return {
        date: row.date,
        dailyPnl: parseFloat(row.daily_pnl),
        runningPnl,
        drawdown,
        tradesCount: parseInt(row.trades_count)
      };
    });

    res.json(drawdownData);
  } catch (error) {
    logger.error('Failed to fetch drawdown data:', error);
    res.status(500).json({ error: 'Failed to fetch drawdown data' });
  }
});

// Update risk parameters
router.put('/parameters',
  [
    body('totalCapital').isFloat({ min: 10000 }),
    body('intradayAllocation').isFloat({ min: 1000 }),
    body('leverageMultiple').isFloat({ min: 1, max: 10 }),
    body('maxSimultaneousPositions').isInt({ min: 1, max: 10 }),
    body('riskPerTrade').isFloat({ min: 0.1, max: 5 }),
    body('maxDailyDrawdown').isFloat({ min: 0.1, max: 10 }),
    body('trailingStopLoss').isFloat({ min: 0.1, max: 5 })
  ],
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user?.id;
      const riskProfile = req.body;

      // Validate risk parameters
      const riskCalculator = new RiskCalculator(riskProfile);
      const validation = riskCalculator.validateRiskParameters();

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid risk parameters',
          details: validation.errors 
        });
      }

      // Additional business rule validations
      if (riskProfile.intradayAllocation > riskProfile.totalCapital) {
        return res.status(400).json({ 
          error: 'Intraday allocation cannot exceed total capital' 
        });
      }

      // Update user's risk profile
      await query(`
        UPDATE users 
        SET risk_profile = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(riskProfile), userId]);

      logger.info(`Risk parameters updated for user ${userId}`);
      res.json({ 
        message: 'Risk parameters updated successfully',
        riskProfile 
      });
    } catch (error) {
      logger.error('Risk parameters update failed:', error);
      res.status(500).json({ error: 'Failed to update risk parameters' });
    }
  }
);

// Get risk violations
router.get('/violations', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await query(`
      SELECT * FROM risk_violations 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch risk violations:', error);
    res.status(500).json({ error: 'Failed to fetch risk violations' });
  }
});

export default router;