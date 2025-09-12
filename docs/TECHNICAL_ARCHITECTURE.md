# Technical Architecture Document

## System Overview
The Quantitative Trading Platform is a microservices-based architecture designed for scalability, reliability, and real-time performance.

## Architecture Patterns
- **Microservices**: Separate services for different concerns
- **Event-Driven**: Real-time updates using WebSocket and events
- **CQRS**: Command Query Responsibility Segregation for trading operations
- **Circuit Breaker**: Fault tolerance for external API calls

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dhan_client_id VARCHAR(100),
  dhan_access_token TEXT,
  risk_profile JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Strategies Table
```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Backtests Table
```sql
CREATE TABLE backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_capital DECIMAL(15,2),
  final_capital DECIMAL(15,2),
  total_trades INTEGER,
  win_rate DECIMAL(5,2),
  max_drawdown DECIMAL(5,2),
  sharpe_ratio DECIMAL(5,2),
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Trades Table
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  strategy_id UUID REFERENCES strategies(id),
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'BUY' or 'SELL'
  quantity INTEGER NOT NULL,
  entry_price DECIMAL(10,2),
  exit_price DECIMAL(10,2),
  stop_loss DECIMAL(10,2),
  target_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  dhan_order_id VARCHAR(100),
  pnl DECIMAL(10,2),
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Positions Table
```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  symbol VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  avg_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  unrealized_pnl DECIMAL(10,2),
  trailing_sl DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/profile
PUT  /api/auth/profile
```

### Strategies
```
GET    /api/strategies
POST   /api/strategies
GET    /api/strategies/:id
PUT    /api/strategies/:id
DELETE /api/strategies/:id
POST   /api/strategies/:id/backtest
GET    /api/strategies/:id/backtests
```

### Trading
```
GET  /api/trades
POST /api/trades
GET  /api/trades/:id
PUT  /api/trades/:id
GET  /api/positions
POST /api/positions/close/:id
```

### Risk Management
```
GET /api/risk/portfolio
GET /api/risk/exposure
GET /api/risk/drawdown
PUT /api/risk/parameters
```

## Security Considerations

### API Security
- JWT tokens for authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

### Data Protection
- Encrypted storage of API keys
- PCI DSS compliance for financial data
- Audit logging for all trading operations
- Secure WebSocket connections (WSS)

### Risk Controls
- Position size limits
- Daily loss limits
- Maximum number of trades per day
- Real-time risk monitoring

## Integration Specifications

### Dhan API Integration
```typescript
interface DhanConfig {
  baseUrl: string;
  clientId: string;
  accessToken: string;
  rateLimit: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

class DhanAPIClient {
  async placeOrder(order: OrderRequest): Promise<OrderResponse>;
  async getPositions(): Promise<Position[]>;
  async getOrderStatus(orderId: string): Promise<OrderStatus>;
  async cancelOrder(orderId: string): Promise<CancelResponse>;
}
```

### Real-time Data Flow
```typescript
interface MarketDataEvent {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

interface TradingSignal {
  strategyId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopLoss: number;
  target: number;
  confidence: number;
}
```

## Performance Requirements
- Real-time data processing: < 100ms latency
- Order execution: < 500ms end-to-end
- Concurrent users: 100+ simultaneous
- Data retention: 5 years of trading history
- System uptime: 99.9% during market hours