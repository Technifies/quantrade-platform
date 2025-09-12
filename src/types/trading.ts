// Core Trading Types
export interface Strategy {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  status: 'draft' | 'backtested' | 'live' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface BacktestResult {
  id: string;
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
  createdAt: string;
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

// Live Trading Types
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

export interface Position {
  id: string;
  userId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  trailingStopLoss: number;
  highestPrice: number;
  updatedAt: string;
}

// Risk Management Types
export interface RiskParameters {
  totalCapital: number;
  intradayAllocation: number;
  leverageMultiple: number;
  maxSimultaneousPositions: number;
  riskPerTrade: number; // as percentage
  maxDailyDrawdown: number; // as percentage
  trailingStopLoss: number; // as percentage
}

export interface RiskMetrics {
  currentExposure: number;
  availableMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyDrawdown: number;
  positionsCount: number;
  riskUtilization: number; // as percentage
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  leverageMultiple: number;
  createdAt: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  dhanClientId?: string;
  riskProfile: RiskParameters;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dhan API Types
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