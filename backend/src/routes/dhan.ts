import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDhanService } from '../services/dhan';
import { logger } from '../utils/logger';

const router = express.Router();

// Get account info
router.get('/account', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    // Get user's Dhan credentials
    const userResult = await query(`
      SELECT dhan_client_id, dhan_access_token 
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
      return res.status(400).json({ error: 'Dhan credentials not configured' });
    }

    const { dhan_client_id, dhan_access_token } = userResult.rows[0];
    const dhanService = getDhanService(dhan_client_id, dhan_access_token);

    const accountInfo = await dhanService.getAccountInfo();
    res.json(accountInfo);
  } catch (error) {
    logger.error('Failed to fetch Dhan account info:', error);
    res.status(500).json({ error: 'Failed to fetch account info' });
  }
});

// Get positions from Dhan
router.get('/positions', async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const userId = req.user?.id;

    const userResult = await query(`
      SELECT dhan_client_id, dhan_access_token 
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
      return res.status(400).json({ error: 'Dhan credentials not configured' });
    }

    const { dhan_client_id, dhan_access_token } = userResult.rows[0];
    const dhanService = getDhanService(dhan_client_id, dhan_access_token);

    const positions = await dhanService.getPositions();
    res.json(positions);
  } catch (error) {
    logger.error('Failed to fetch Dhan positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get market data
router.post('/market-data',
  [
    body('symbols').isArray({ min: 1 }),
    body('symbols.*').isString().trim()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user?.id;
      const { symbols } = req.body;

      const userResult = await query(`
        SELECT dhan_client_id, dhan_access_token 
        FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
        return res.status(400).json({ error: 'Dhan credentials not configured' });
      }

      const { dhan_client_id, dhan_access_token } = userResult.rows[0];
      const dhanService = getDhanService(dhan_client_id, dhan_access_token);

      const marketData = await dhanService.getMarketData(symbols);
      res.json(marketData);
    } catch (error) {
      logger.error('Failed to fetch market data:', error);
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  }
);

// Place order
router.post('/orders',
  [
    body('symbol').isString().trim(),
    body('quantity').isInt({ min: 1 }),
    body('price').isFloat({ min: 0.01 }),
    body('orderType').isIn(['MARKET', 'LIMIT', 'SL', 'SLM']),
    body('side').isIn(['BUY', 'SELL']),
    body('productType').isIn(['INTRADAY', 'DELIVERY']),
    body('validity').isIn(['DAY', 'IOC']),
    body('stopLoss').optional().isFloat({ min: 0.01 }),
    body('target').optional().isFloat({ min: 0.01 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user?.id;
      const orderRequest = req.body;

      const userResult = await query(`
        SELECT dhan_client_id, dhan_access_token 
        FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
        return res.status(400).json({ error: 'Dhan credentials not configured' });
      }

      const { dhan_client_id, dhan_access_token } = userResult.rows[0];
      const dhanService = getDhanService(dhan_client_id, dhan_access_token);

      const orderResponse = await dhanService.placeOrder(orderRequest);

      // Log the order
      await query(`
        INSERT INTO order_logs (id, user_id, dhan_order_id, order_request, order_response, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
      `, [
        userId,
        orderResponse.orderId,
        JSON.stringify(orderRequest),
        JSON.stringify(orderResponse)
      ]);

      logger.info(`Order placed for user ${userId}: ${orderResponse.orderId}`);
      res.json(orderResponse);
    } catch (error) {
      logger.error('Order placement failed:', error);
      res.status(500).json({ error: 'Order placement failed' });
    }
  }
);

// Get order status
router.get('/orders/:orderId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const userResult = await query(`
      SELECT dhan_client_id, dhan_access_token 
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
      return res.status(400).json({ error: 'Dhan credentials not configured' });
    }

    const { dhan_client_id, dhan_access_token } = userResult.rows[0];
    const dhanService = getDhanService(dhan_client_id, dhan_access_token);

    const orderStatus = await dhanService.getOrderStatus(orderId);
    res.json(orderStatus);
  } catch (error) {
    logger.error('Failed to fetch order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// Cancel order
router.delete('/orders/:orderId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    const userResult = await query(`
      SELECT dhan_client_id, dhan_access_token 
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
      return res.status(400).json({ error: 'Dhan credentials not configured' });
    }

    const { dhan_client_id, dhan_access_token } = userResult.rows[0];
    const dhanService = getDhanService(dhan_client_id, dhan_access_token);

    const success = await dhanService.cancelOrder(orderId);
    
    if (success) {
      logger.info(`Order cancelled for user ${userId}: ${orderId}`);
      res.json({ message: 'Order cancelled successfully' });
    } else {
      res.status(400).json({ error: 'Failed to cancel order' });
    }
  } catch (error) {
    logger.error('Order cancellation failed:', error);
    res.status(500).json({ error: 'Order cancellation failed' });
  }
});

// Test Dhan connection
router.get('/test-connection', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    const userResult = await query(`
      SELECT dhan_client_id, dhan_access_token 
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].dhan_client_id) {
      return res.status(400).json({ error: 'Dhan credentials not configured' });
    }

    const { dhan_client_id, dhan_access_token } = userResult.rows[0];
    const dhanService = getDhanService(dhan_client_id, dhan_access_token);

    const isConnected = await dhanService.validateConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    logger.error('Dhan connection test failed:', error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

export default router;