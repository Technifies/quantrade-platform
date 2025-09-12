# API Documentation

## Base URL
- **Production**: `https://your-backend.railway.app/api`
- **Development**: `http://localhost:3001/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "riskProfile": { ... },
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/login`
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication).

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

**Request Body:**
```json
{
  "dhanClientId": "client_id",
  "riskProfile": {
    "totalCapital": 200000,
    "intradayAllocation": 100000,
    "leverageMultiple": 5,
    "maxSimultaneousPositions": 5,
    "riskPerTrade": 0.5,
    "maxDailyDrawdown": 1.25,
    "trailingStopLoss": 0.5
  }
}
```

### Strategies (`/api/strategies`)

#### GET `/api/strategies`
Get all strategies for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of strategies to return (default: 50)
- `offset` (optional): Number of strategies to skip (default: 0)
- `status` (optional): Filter by strategy status

#### POST `/api/strategies`
Create a new trading strategy.

**Request Body:**
```json
{
  "name": "Moving Average Strategy",
  "description": "Simple moving average crossover strategy",
  "code": "class MovingAverageStrategy(bt.Strategy): ...",
  "parameters": {
    "fast_period": 10,
    "slow_period": 30
  }
}
```

#### GET `/api/strategies/:id`
Get a specific strategy by ID.

#### PUT `/api/strategies/:id`
Update an existing strategy.

#### DELETE `/api/strategies/:id`
Delete a strategy.

#### GET `/api/strategies/templates/list`
Get available strategy templates.

#### GET `/api/strategies/templates/:templateType`
Get strategy template code.

### Backtests (`/api/backtests`)

#### GET `/api/backtests`
Get all backtests for the authenticated user.

#### POST `/api/backtests`
Run a new backtest.

**Request Body:**
```json
{
  "strategyId": "uuid",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "initialCapital": 100000,
  "symbols": ["RELIANCE", "TCS", "INFY"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "strategyId": "uuid",
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "initialCapital": 100000,
  "finalCapital": 125000,
  "totalTrades": 45,
  "winRate": 67.5,
  "maxDrawdown": 8.2,
  "sharpeRatio": 1.45,
  "totalReturn": 0.25,
  "results": {
    "trades": [...],
    "dailyReturns": [...],
    "metrics": { ... }
  }
}
```

#### GET `/api/backtests/:id`
Get a specific backtest by ID.

#### GET `/api/backtests/strategy/:strategyId`
Get all backtests for a specific strategy.

#### DELETE `/api/backtests/:id`
Delete a backtest.

### Trading (`/api/trading`)

#### GET `/api/trading/signals`
Get trading signals for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of signals to return (default: 50)
- `offset` (optional): Number of signals to skip (default: 0)

#### POST `/api/trading/signals/:signalId/execute`
Execute a trading signal.

#### GET `/api/trading/trades`
Get trades for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of trades to return (default: 50)
- `offset` (optional): Number of trades to skip (default: 0)
- `status` (optional): Filter by trade status

#### GET `/api/trading/positions`
Get current positions for the authenticated user.

#### POST `/api/trading/positions/close/:positionId`
Close a specific position.

### Risk Management (`/api/risk`)

#### GET `/api/risk/portfolio`
Get portfolio risk metrics.

**Response:**
```json
{
  "currentExposure": 450000,
  "availableMargin": 50000,
  "unrealizedPnl": 2500,
  "realizedPnl": 1200,
  "dailyDrawdown": 0,
  "positionsCount": 3,
  "riskUtilization": 75.5
}
```

#### GET `/api/risk/exposure`
Get current exposure breakdown by symbol.

#### GET `/api/risk/drawdown`
Get drawdown history.

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)

#### PUT `/api/risk/parameters`
Update risk parameters.

**Request Body:**
```json
{
  "totalCapital": 200000,
  "intradayAllocation": 100000,
  "leverageMultiple": 5,
  "maxSimultaneousPositions": 5,
  "riskPerTrade": 0.5,
  "maxDailyDrawdown": 1.25,
  "trailingStopLoss": 0.5
}
```

#### GET `/api/risk/violations`
Get risk violations history.

### Dhan Integration (`/api/dhan`)

#### GET `/api/dhan/account`
Get Dhan account information.

#### GET `/api/dhan/positions`
Get positions from Dhan API.

#### POST `/api/dhan/market-data`
Get market data for symbols.

**Request Body:**
```json
{
  "symbols": ["RELIANCE", "TCS", "INFY"]
}
```

#### POST `/api/dhan/orders`
Place an order via Dhan API.

**Request Body:**
```json
{
  "symbol": "RELIANCE",
  "quantity": 10,
  "price": 2500.00,
  "orderType": "LIMIT",
  "side": "BUY",
  "productType": "INTRADAY",
  "validity": "DAY",
  "stopLoss": 2475.00,
  "target": 2550.00
}
```

#### GET `/api/dhan/orders/:orderId`
Get order status from Dhan API.

#### DELETE `/api/dhan/orders/:orderId`
Cancel an order via Dhan API.

#### GET `/api/dhan/test-connection`
Test Dhan API connection.

## WebSocket Events

### Connection
Connect to WebSocket at: `wss://your-backend.railway.app/ws?token=<jwt_token>`

### Incoming Events

#### Market Data Update
```json
{
  "type": "MARKET_DATA",
  "payload": {
    "symbol": "RELIANCE",
    "price": 2500.00,
    "change": 25.00,
    "changePercent": 1.01,
    "volume": 1000000,
    "timestamp": "2024-01-01T10:30:00Z"
  }
}
```

#### Trading Signal
```json
{
  "type": "TRADING_SIGNAL",
  "payload": {
    "id": "uuid",
    "strategyId": "uuid",
    "symbol": "RELIANCE",
    "action": "BUY",
    "quantity": 10,
    "price": 2500.00,
    "stopLoss": 2475.00,
    "target": 2550.00,
    "confidence": 0.85,
    "timestamp": "2024-01-01T10:30:00Z",
    "status": "generated"
  }
}
```

#### Position Update
```json
{
  "type": "POSITION_UPDATE",
  "payload": {
    "id": "uuid",
    "symbol": "RELIANCE",
    "quantity": 10,
    "avgPrice": 2500.00,
    "currentPrice": 2525.00,
    "unrealizedPnl": 250.00,
    "trailingStopLoss": 2487.50,
    "highestPrice": 2525.00
  }
}
```

#### Risk Alert
```json
{
  "type": "RISK_ALERT",
  "payload": {
    "violationType": "HIGH_RISK_UTILIZATION",
    "message": "Risk utilization is above 90%. Consider reducing positions.",
    "metrics": { ... }
  }
}
```

### Outgoing Events

#### Subscribe to Symbol
```json
{
  "type": "SUBSCRIBE",
  "payload": {
    "symbol": "RELIANCE"
  }
}
```

#### Unsubscribe from Symbol
```json
{
  "type": "UNSUBSCRIBE",
  "payload": {
    "symbol": "RELIANCE"
  }
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **WebSocket**: No rate limit on connections
- **Dhan API**: Follows Dhan's rate limiting rules

## Data Types

### Strategy Status
- `draft` - Strategy is being developed
- `backtested` - Strategy has been backtested
- `live` - Strategy is active for live trading
- `paused` - Strategy is temporarily disabled

### Trade Status
- `pending` - Trade order is pending
- `executed` - Trade order has been executed
- `cancelled` - Trade order was cancelled
- `completed` - Trade has been completed (buy and sell)

### Signal Status
- `generated` - Signal has been generated
- `approved` - Signal has been approved for execution
- `rejected` - Signal has been rejected
- `executed` - Signal has been executed

This API documentation provides comprehensive information for integrating with the quantitative trading platform.