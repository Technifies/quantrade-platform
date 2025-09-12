import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface DhanOrderRequest {
  symbol: string;
  quantity: number;
  price: number;
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SLM';
  side: 'BUY' | 'SELL';
  productType: 'INTRADAY' | 'DELIVERY';
  validity: 'DAY' | 'IOC';
  stopLoss?: number;
  target?: number;
}

export interface DhanOrderResponse {
  orderId: string;
  status: string;
  message: string;
}

export interface DhanPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  productType: string;
}

export interface DhanMarketData {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export class DhanAPIService {
  private client: AxiosInstance;
  private clientId: string;
  private accessToken: string;

  constructor(clientId: string, accessToken: string) {
    this.clientId = clientId;
    this.accessToken = accessToken;
    
    this.client = axios.create({
      baseURL: process.env.DHAN_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Dhan API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Dhan API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Dhan API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Dhan API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Place a new order
   */
  async placeOrder(orderRequest: DhanOrderRequest): Promise<DhanOrderResponse> {
    try {
      const response = await this.client.post('/orders', {
        ...orderRequest,
        clientId: this.clientId
      });

      return {
        orderId: response.data.orderId,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error: any) {
      logger.error('Failed to place order:', error);
      throw new Error(`Order placement failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get order status:', error);
      throw new Error(`Order status fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await this.client.delete(`/orders/${orderId}`);
      return response.data.success;
    } catch (error: any) {
      logger.error('Failed to cancel order:', error);
      throw new Error(`Order cancellation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<DhanPosition[]> {
    try {
      const response = await this.client.get('/positions');
      return response.data.positions || [];
    } catch (error: any) {
      logger.error('Failed to get positions:', error);
      throw new Error(`Positions fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get account balance and margins
   */
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.client.get('/account');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get account info:', error);
      throw new Error(`Account info fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get market data for symbols
   */
  async getMarketData(symbols: string[]): Promise<DhanMarketData[]> {
    try {
      const response = await this.client.post('/market-data', {
        symbols: symbols
      });
      return response.data.marketData || [];
    } catch (error: any) {
      logger.error('Failed to get market data:', error);
      throw new Error(`Market data fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get historical data for backtesting
   */
  async getHistoricalData(
    symbol: string,
    fromDate: string,
    toDate: string,
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d'
  ): Promise<any[]> {
    try {
      const response = await this.client.get('/historical-data', {
        params: {
          symbol,
          from: fromDate,
          to: toDate,
          interval
        }
      });
      return response.data.data || [];
    } catch (error: any) {
      logger.error('Failed to get historical data:', error);
      throw new Error(`Historical data fetch failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Subscribe to real-time market data
   */
  async subscribeToMarketData(symbols: string[]): Promise<void> {
    try {
      await this.client.post('/market-data/subscribe', {
        symbols: symbols
      });
      logger.info(`Subscribed to market data for symbols: ${symbols.join(', ')}`);
    } catch (error: any) {
      logger.error('Failed to subscribe to market data:', error);
      throw new Error(`Market data subscription failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/ping');
      return response.status === 200;
    } catch (error) {
      logger.error('Dhan API connection validation failed:', error);
      return false;
    }
  }
}

// Singleton instance
let dhanService: DhanAPIService | null = null;

export const getDhanService = (clientId?: string, accessToken?: string): DhanAPIService => {
  if (!dhanService) {
    if (!clientId || !accessToken) {
      throw new Error('Dhan API credentials not provided');
    }
    dhanService = new DhanAPIService(clientId, accessToken);
  }
  return dhanService;
};