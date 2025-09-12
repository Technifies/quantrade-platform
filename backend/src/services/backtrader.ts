import axios from 'axios';
import { logger } from '../utils/logger';

export interface BacktestRequest {
  strategyId: string;
  strategyCode: string;
  parameters: Record<string, any>;
  startDate: string;
  endDate: string;
  initialCapital: number;
  symbols: string[];
  dataSource: 'dhan' | 'yahoo';
}

export interface BacktestResult {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalReturn: number;
  results: {
    trades: BacktestTrade[];
    dailyReturns: DailyReturn[];
    metrics: PerformanceMetrics;
  };
}

export interface BacktestTrade {
  symbol: string;
  entryDate: string;
  exitDate: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  commission: number;
}

export interface DailyReturn {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
}

export class BacktraderService {
  private baseUrl: string;

  constructor() {
    // Use the full URL if provided, otherwise construct from host/port
    if (process.env.BACKTRADER_SERVICE_URL) {
      this.baseUrl = process.env.BACKTRADER_SERVICE_URL;
    } else {
      const host = process.env.BACKTRADER_SERVICE_HOST || 'localhost';
      const port = process.env.BACKTRADER_SERVICE_PORT || '8000';
      this.baseUrl = `http://${host}:${port}`;
    }
  }

  /**
   * Run a backtest using the Python Backtrader service
   */
  async runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    try {
      logger.info(`Starting backtest for strategy ${request.strategyId}`);
      
      const response = await axios.post(`${this.baseUrl}/backtest`, request, {
        timeout: 300000, // 5 minutes timeout for backtests
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Backtest completed for strategy ${request.strategyId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Backtest failed:', error);
      throw new Error(`Backtest failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate strategy code syntax
   */
  async validateStrategy(strategyCode: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await axios.post(`${this.baseUrl}/validate`, {
        strategyCode
      });

      return response.data;
    } catch (error: any) {
      logger.error('Strategy validation failed:', error);
      return {
        valid: false,
        errors: [error.response?.data?.message || error.message]
      };
    }
  }

  /**
   * Get available indicators and functions
   */
  async getAvailableIndicators(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/indicators`);
      return response.data.indicators || [];
    } catch (error: any) {
      logger.error('Failed to get indicators:', error);
      return [];
    }
  }

  /**
   * Generate strategy template
   */
  async generateStrategyTemplate(templateType: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/template/${templateType}`);
      return response.data.template;
    } catch (error: any) {
      logger.error('Failed to generate template:', error);
      throw new Error(`Template generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check if Backtrader service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Backtrader service health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const backtraderService = new BacktraderService();