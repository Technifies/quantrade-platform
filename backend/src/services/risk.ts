import { query } from '../config/database';
import { WebSocketService } from './websocket';
import { RiskCalculator, RiskParameters } from '../utils/riskCalculator';
import { logger } from '../utils/logger';
import * as cron from 'node-cron';

export interface RiskMetrics {
  currentExposure: number;
  availableMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyDrawdown: number;
  positionsCount: number;
  riskUtilization: number;
}

export class RiskService {
  private wsService: WebSocketService;
  private userRiskCalculators: Map<string, RiskCalculator> = new Map();

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  async initialize(): Promise<void> {
    // Load user risk profiles
    await this.loadUserRiskProfiles();
    
    // Start risk monitoring
    this.startRiskMonitoring();
    
    logger.info('Risk service initialized');
  }

  private async loadUserRiskProfiles(): Promise<void> {
    try {
      const result = await query(`
        SELECT id, risk_profile FROM users 
        WHERE risk_profile IS NOT NULL
      `);

      for (const user of result.rows) {
        const riskCalculator = new RiskCalculator(user.risk_profile);
        this.userRiskCalculators.set(user.id, riskCalculator);
      }

      logger.info(`Loaded ${this.userRiskCalculators.size} user risk profiles`);
    } catch (error) {
      logger.error('Failed to load user risk profiles:', error);
    }
  }

  private startRiskMonitoring(): void {
    // Monitor risk metrics every minute
    cron.schedule('* * * * *', async () => {
      await this.updateRiskMetrics();
    });

    // Daily risk reset at market open (9:15 AM IST)
    cron.schedule('15 9 * * 1-5', async () => {
      await this.resetDailyRisk();
    }, {
      timezone: 'Asia/Kolkata'
    });
  }

  private async updateRiskMetrics(): Promise<void> {
    try {
      const users = await query('SELECT id FROM users');
      
      for (const user of users.rows) {
        const metrics = await this.calculateRiskMetrics(user.id);
        
        // Broadcast updated metrics to user
        this.wsService.broadcastToUser(user.id, {
          type: 'RISK_UPDATE',
          payload: metrics
        });

        // Check for risk violations
        await this.checkRiskViolations(user.id, metrics);
      }
    } catch (error) {
      logger.error('Risk metrics update failed:', error);
    }
  }

  async calculateRiskMetrics(userId: string): Promise<RiskMetrics> {
    try {
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
        throw new Error(`Risk profile not found for user ${userId}`);
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

      return {
        currentExposure,
        availableMargin: buyingPower - currentExposure,
        unrealizedPnl,
        realizedPnl,
        dailyDrawdown,
        positionsCount,
        riskUtilization
      };
    } catch (error) {
      logger.error(`Risk metrics calculation failed for user ${userId}:`, error);
      throw error;
    }
  }

  private async checkRiskViolations(userId: string, metrics: RiskMetrics): Promise<void> {
    const riskCalculator = this.userRiskCalculators.get(userId);
    if (!riskCalculator) return;

    const violations: string[] = [];

    // Check daily drawdown limit
    if (riskCalculator.isDrawdownLimitExceeded(metrics.dailyDrawdown)) {
      violations.push('Daily drawdown limit exceeded');
      await this.triggerRiskAction(userId, 'DAILY_DRAWDOWN_EXCEEDED', metrics);
    }

    // Check risk utilization
    if (metrics.riskUtilization > 90) {
      violations.push('Risk utilization above 90%');
      await this.triggerRiskAction(userId, 'HIGH_RISK_UTILIZATION', metrics);
    }

    // Check margin availability
    if (metrics.availableMargin < 0) {
      violations.push('Negative available margin');
      await this.triggerRiskAction(userId, 'MARGIN_DEFICIT', metrics);
    }

    if (violations.length > 0) {
      logger.warn(`Risk violations for user ${userId}:`, violations);
    }
  }

  private async triggerRiskAction(userId: string, violationType: string, metrics: RiskMetrics): Promise<void> {
    try {
      // Log the violation
      await query(`
        INSERT INTO risk_violations (id, user_id, violation_type, metrics, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      `, [userId, violationType, JSON.stringify(metrics)]);

      // Send alert to user
      this.wsService.broadcastToUser(userId, {
        type: 'RISK_ALERT',
        payload: {
          violationType,
          message: this.getRiskAlertMessage(violationType),
          metrics
        }
      });

      // For severe violations, auto-close positions
      if (violationType === 'DAILY_DRAWDOWN_EXCEEDED' || violationType === 'MARGIN_DEFICIT') {
        await this.autoClosePositions(userId);
      }
    } catch (error) {
      logger.error(`Risk action trigger failed for user ${userId}:`, error);
    }
  }

  private getRiskAlertMessage(violationType: string): string {
    const messages: Record<string, string> = {
      'DAILY_DRAWDOWN_EXCEEDED': 'Daily drawdown limit exceeded. All positions will be closed.',
      'HIGH_RISK_UTILIZATION': 'Risk utilization is above 90%. Consider reducing positions.',
      'MARGIN_DEFICIT': 'Margin deficit detected. Positions will be auto-closed.'
    };
    return messages[violationType] || 'Risk violation detected';
  }

  private async autoClosePositions(userId: string): Promise<void> {
    try {
      // Get all open positions for the user
      const positions = await query(`
        SELECT * FROM positions 
        WHERE user_id = $1 AND quantity > 0
      `, [userId]);

      for (const position of positions.rows) {
        // Mark position for closure
        await query(`
          UPDATE positions 
          SET status = 'closing', updated_at = NOW()
          WHERE id = $1
        `, [position.id]);

        logger.info(`Auto-closing position ${position.id} for user ${userId} due to risk violation`);
      }

      // Notify user
      this.wsService.broadcastToUser(userId, {
        type: 'POSITIONS_AUTO_CLOSED',
        payload: {
          message: 'All positions have been marked for closure due to risk violation',
          positionCount: positions.rows.length
        }
      });
    } catch (error) {
      logger.error(`Auto-close positions failed for user ${userId}:`, error);
    }
  }

  private async resetDailyRisk(): Promise<void> {
    try {
      logger.info('Resetting daily risk metrics');
      
      // Reset daily P&L tracking
      await query(`
        UPDATE users 
        SET daily_pnl = 0, daily_trades = 0, updated_at = NOW()
      `);

      // Clean up old risk violations (keep last 30 days)
      await query(`
        DELETE FROM risk_violations 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);

      logger.info('Daily risk reset completed');
    } catch (error) {
      logger.error('Daily risk reset failed:', error);
    }
  }

  public async updateUserRiskProfile(userId: string, riskProfile: RiskParameters): Promise<void> {
    try {
      // Validate risk parameters
      const riskCalculator = new RiskCalculator(riskProfile);
      const validation = riskCalculator.validateRiskParameters();

      if (!validation.isValid) {
        throw new Error(`Invalid risk parameters: ${validation.errors.join(', ')}`);
      }

      // Update in database
      await query(`
        UPDATE users 
        SET risk_profile = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(riskProfile), userId]);

      // Update in memory
      this.userRiskCalculators.set(userId, riskCalculator);

      logger.info(`Risk profile updated for user ${userId}`);
    } catch (error) {
      logger.error(`Risk profile update failed for user ${userId}:`, error);
      throw error;
    }
  }

  public getRiskCalculator(userId: string): RiskCalculator | undefined {
    return this.userRiskCalculators.get(userId);
  }
}