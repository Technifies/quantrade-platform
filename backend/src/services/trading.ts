import { query } from '../config/database';
import { getDhanService } from './dhan';
import { WebSocketService } from './websocket';
import { RiskCalculator } from '../utils/riskCalculator';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';

export interface TradingSignal {
  id: string;
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopLoss: number;
  target: number;
  confidence: number;
  timestamp: string;
  status: 'generated' | 'approved' | 'rejected' | 'executed';
}

export interface Trade {
  id: string;
  userId: string;
  strategyId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss: number;
  targetPrice: number;
  status: 'pending' | 'executed' | 'cancelled' | 'completed';
  dhanOrderId?: string;
  pnl?: number;
  executedAt?: string;
  createdAt: string;
}

export class TradingService {
  private wsService: WebSocketService;
  private activeStrategies: Map<string, any> = new Map();

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  async initialize(): Promise<void> {
    // Load active strategies from database
    await this.loadActiveStrategies();
    
    // Start signal generation cron job (every minute during market hours)
    this.startSignalGeneration();
    
    // Start position monitoring
    this.startPositionMonitoring();
    
    logger.info('Trading service initialized');
  }

  private async loadActiveStrategies(): Promise<void> {
    try {
      const result = await query(`
        SELECT s.*, u.dhan_client_id, u.dhan_access_token, u.risk_profile
        FROM strategies s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'live'
      `);

      for (const strategy of result.rows) {
        this.activeStrategies.set(strategy.id, {
          ...strategy,
          riskCalculator: new RiskCalculator(strategy.risk_profile)
        });
      }

      logger.info(`Loaded ${this.activeStrategies.size} active strategies`);
    } catch (error) {
      logger.error('Failed to load active strategies:', error);
    }
  }

  private startSignalGeneration(): void {
    // Run every minute during market hours (9:15 AM to 3:30 PM IST)
    cron.schedule('* 9-15 * * 1-5', async () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // Market hours: 9:15 AM to 3:30 PM
      if ((hour === 9 && minute >= 15) || (hour >= 10 && hour <= 14) || (hour === 15 && minute <= 30)) {
        await this.generateSignals();
      }
    }, {
      timezone: 'Asia/Kolkata'
    });
  }

  private async generateSignals(): Promise<void> {
    try {
      for (const [strategyId, strategy] of this.activeStrategies) {
        await this.processStrategy(strategyId, strategy);
      }
    } catch (error) {
      logger.error('Signal generation failed:', error);
    }
  }

  private async processStrategy(strategyId: string, strategy: any): Promise<void> {
    try {
      // Get market data for strategy symbols
      const dhanService = getDhanService(strategy.dhan_client_id, strategy.dhan_access_token);
      const marketData = await dhanService.getMarketData(strategy.symbols || []);

      // Execute strategy logic (this would be more complex in reality)
      const signals = await this.executeStrategyLogic(strategy, marketData);

      // Process each signal
      for (const signal of signals) {
        await this.processSignal(signal, strategy);
      }
    } catch (error) {
      logger.error(`Strategy processing failed for ${strategyId}:`, error);
    }
  }

  private async executeStrategyLogic(strategy: any, marketData: any[]): Promise<TradingSignal[]> {
    // This is a simplified example - in reality, you'd execute the actual strategy code
    const signals: TradingSignal[] = [];

    for (const data of marketData) {
      // Example: Simple moving average crossover strategy
      if (this.shouldGenerateSignal(data, strategy)) {
        const signal: TradingSignal = {
          id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          strategyId: strategy.id,
          symbol: data.symbol,
          action: data.changePercent > 0 ? 'BUY' : 'SELL',
          quantity: strategy.riskCalculator.calculatePositionSize(data.ltp),
          price: data.ltp,
          stopLoss: strategy.riskCalculator.calculateInitialStopLoss(data.ltp),
          target: strategy.riskCalculator.calculateTargetPrice(
            data.ltp,
            strategy.riskCalculator.calculateInitialStopLoss(data.ltp)
          ),
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          timestamp: new Date().toISOString(),
          status: 'generated'
        };

        signals.push(signal);
      }
    }

    return signals;
  }

  private shouldGenerateSignal(marketData: any, strategy: any): boolean {
    // Implement your signal generation logic here
    // This is a placeholder that generates signals randomly for demo
    return Math.random() > 0.95; // 5% chance of generating a signal
  }

  private async processSignal(signal: TradingSignal, strategy: any): Promise<void> {
    try {
      // Save signal to database
      await query(`
        INSERT INTO trading_signals (id, strategy_id, symbol, action, quantity, price, stop_loss, target, confidence, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        signal.id,
        signal.strategyId,
        signal.symbol,
        signal.action,
        signal.quantity,
        signal.price,
        signal.stopLoss,
        signal.target,
        signal.confidence,
        signal.status
      ]);

      // Broadcast signal to connected clients
      this.wsService.broadcastToUser(strategy.user_id, {
        type: 'TRADING_SIGNAL',
        payload: signal
      });

      logger.info(`Generated signal: ${signal.action} ${signal.symbol} @ ${signal.price}`);
    } catch (error) {
      logger.error('Failed to process signal:', error);
    }
  }

  async executeSignal(signalId: string, userId: string): Promise<boolean> {
    try {
      // Get signal details
      const signalResult = await query(`
        SELECT ts.*, s.user_id, u.dhan_client_id, u.dhan_access_token, u.risk_profile
        FROM trading_signals ts
        JOIN strategies s ON ts.strategy_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE ts.id = $1 AND u.id = $2
      `, [signalId, userId]);

      if (signalResult.rows.length === 0) {
        throw new Error('Signal not found');
      }

      const signal = signalResult.rows[0];
      const riskCalculator = new RiskCalculator(signal.risk_profile);

      // Check risk constraints
      const canOpen = await this.checkRiskConstraints(userId, signal, riskCalculator);
      if (!canOpen.allowed) {
        throw new Error(canOpen.reason);
      }

      // Place order via Dhan API
      const dhanService = getDhanService(signal.dhan_client_id, signal.dhan_access_token);
      const orderResponse = await dhanService.placeOrder({
        symbol: signal.symbol,
        quantity: signal.quantity,
        price: signal.price,
        orderType: 'LIMIT',
        side: signal.action,
        productType: 'INTRADAY',
        validity: 'DAY',
        stopLoss: signal.stop_loss,
        target: signal.target
      });

      // Create trade record
      await query(`
        INSERT INTO trades (id, user_id, strategy_id, symbol, side, quantity, entry_price, stop_loss, target_price, status, dhan_order_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, NOW())
      `, [
        `trade_${Date.now()}`,
        userId,
        signal.strategy_id,
        signal.symbol,
        signal.action,
        signal.quantity,
        signal.price,
        signal.stop_loss,
        signal.target,
        orderResponse.orderId
      ]);

      // Update signal status
      await query(`
        UPDATE trading_signals SET status = 'executed', updated_at = NOW()
        WHERE id = $1
      `, [signalId]);

      logger.info(`Signal executed: ${signalId}, Order ID: ${orderResponse.orderId}`);
      return true;
    } catch (error) {
      logger.error('Signal execution failed:', error);
      throw error;
    }
  }

  private async checkRiskConstraints(
    userId: string,
    signal: any,
    riskCalculator: RiskCalculator
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get current positions and exposure
      const positionsResult = await query(`
        SELECT COUNT(*) as position_count, COALESCE(SUM(quantity * current_price), 0) as total_exposure
        FROM positions
        WHERE user_id = $1 AND quantity > 0
      `, [userId]);

      const { position_count, total_exposure } = positionsResult.rows[0];

      // Check position limits and risk
      const canOpen = riskCalculator.canOpenPosition(
        signal.price,
        parseFloat(total_exposure),
        parseInt(position_count)
      );

      return {
        allowed: canOpen.canOpen,
        reason: canOpen.reason
      };
    } catch (error) {
      logger.error('Risk constraint check failed:', error);
      return {
        allowed: false,
        reason: 'Risk validation failed'
      };
    }
  }

  private startPositionMonitoring(): void {
    // Monitor positions every 30 seconds during market hours
    cron.schedule('*/30 * * * * *', async () => {
      await this.monitorPositions();
    });
  }

  private async monitorPositions(): Promise<void> {
    try {
      // Get all active positions
      const positionsResult = await query(`
        SELECT p.*, u.dhan_client_id, u.dhan_access_token, u.risk_profile
        FROM positions p
        JOIN users u ON p.user_id = u.id
        WHERE p.quantity > 0
      `);

      for (const position of positionsResult.rows) {
        await this.updatePosition(position);
      }
    } catch (error) {
      logger.error('Position monitoring failed:', error);
    }
  }

  private async updatePosition(position: any): Promise<void> {
    try {
      const dhanService = getDhanService(position.dhan_client_id, position.dhan_access_token);
      const marketData = await dhanService.getMarketData([position.symbol]);
      
      if (marketData.length === 0) return;

      const currentPrice = marketData[0].ltp;
      const riskCalculator = new RiskCalculator(position.risk_profile);

      // Update highest price and trailing stop-loss
      const newHighestPrice = Math.max(position.highest_price, currentPrice);
      const newTrailingStopLoss = riskCalculator.updateTrailingStopLoss(
        position.avg_price,
        currentPrice,
        newHighestPrice
      );

      // Calculate unrealized P&L
      const unrealizedPnl = (currentPrice - position.avg_price) * position.quantity;

      // Update position in database
      await query(`
        UPDATE positions 
        SET current_price = $1, unrealized_pnl = $2, trailing_sl = $3, highest_price = $4, updated_at = NOW()
        WHERE id = $5
      `, [currentPrice, unrealizedPnl, newTrailingStopLoss, newHighestPrice, position.id]);

      // Check if stop-loss should be triggered
      if (currentPrice <= newTrailingStopLoss) {
        await this.triggerStopLoss(position, currentPrice);
      }

      // Broadcast position update
      this.wsService.broadcastToUser(position.user_id, {
        type: 'POSITION_UPDATE',
        payload: {
          ...position,
          currentPrice,
          unrealizedPnl,
          trailingStopLoss: newTrailingStopLoss,
          highestPrice: newHighestPrice
        }
      });
    } catch (error) {
      logger.error(`Position update failed for ${position.symbol}:`, error);
    }
  }

  private async triggerStopLoss(position: any, currentPrice: number): Promise<void> {
    try {
      const dhanService = getDhanService(position.dhan_client_id, position.dhan_access_token);
      
      // Place market sell order
      const orderResponse = await dhanService.placeOrder({
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentPrice,
        orderType: 'MARKET',
        side: 'SELL',
        productType: 'INTRADAY',
        validity: 'DAY'
      });

      logger.info(`Stop-loss triggered for ${position.symbol}, Order ID: ${orderResponse.orderId}`);
    } catch (error) {
      logger.error(`Stop-loss execution failed for ${position.symbol}:`, error);
    }
  }
}