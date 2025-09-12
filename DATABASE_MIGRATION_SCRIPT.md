# Database Migration for Render PostgreSQL

## Step-by-Step Migration Process

### 1. Access Render Database Console
1. Go to your Render dashboard
2. Click on `quantrade-database` service
3. Click **"Console"** tab
4. This opens a web-based PostgreSQL console

### 2. Execute Migration SQL
Copy and paste the following SQL commands in the console:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dhan_client_id VARCHAR(100),
  dhan_access_token TEXT,
  risk_profile JSONB DEFAULT '{}',
  daily_pnl DECIMAL(15,2) DEFAULT 0,
  daily_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  symbols TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backtests table
CREATE TABLE IF NOT EXISTS backtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_capital DECIMAL(15,2) NOT NULL,
  final_capital DECIMAL(15,2),
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  max_drawdown DECIMAL(5,2) DEFAULT 0,
  sharpe_ratio DECIMAL(8,4) DEFAULT 0,
  total_return DECIMAL(8,4) DEFAULT 0,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stop_loss DECIMAL(10,2),
  target DECIMAL(10,2),
  confidence DECIMAL(3,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'approved', 'rejected', 'executed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL,
  entry_price DECIMAL(10,2),
  exit_price DECIMAL(10,2),
  stop_loss DECIMAL(10,2),
  target_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'completed')),
  dhan_order_id VARCHAR(100),
  pnl DECIMAL(10,2),
  commission DECIMAL(8,2) DEFAULT 0,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2),
  unrealized_pnl DECIMAL(10,2) DEFAULT 0,
  trailing_sl DECIMAL(10,2),
  highest_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Risk violations table
CREATE TABLE IF NOT EXISTS risk_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order logs table
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dhan_order_id VARCHAR(100),
  order_request JSONB,
  order_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_status ON strategies(status);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy_id ON backtests(strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at ON backtests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy_id ON trading_signals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_risk_violations_user_id ON risk_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_violations_created_at ON risk_violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_logs_user_id ON order_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_dhan_order_id ON order_logs(dhan_order_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_signals_updated_at BEFORE UPDATE ON trading_signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Verify Migration
After executing the SQL, verify the tables were created:

```sql
-- List all tables
\dt

-- Check table structure
\d users
\d strategies
\d backtests
```

### 4. Test Connection
Create a test user to verify everything works:

```sql
-- Test insert (optional)
INSERT INTO users (email, password_hash, risk_profile) 
VALUES ('test@example.com', 'test_hash', '{"totalCapital": 100000}');

-- Verify insert
SELECT id, email, created_at FROM users WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM users WHERE email = 'test@example.com';
```

## Migration Complete ✅
Your database is now ready for the QuantTrade Platform!