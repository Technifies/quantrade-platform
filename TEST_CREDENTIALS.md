# Test Login Credentials

## For GUI Testing and Development

### Test User Account
- **Email**: `test@quantrade.com`
- **Password**: `test123456`

### Default Risk Profile
The test user comes with a pre-configured risk profile:
- **Total Capital**: ₹2,00,000
- **Intraday Allocation**: ₹1,00,000
- **Leverage Multiple**: 5x
- **Max Simultaneous Positions**: 5
- **Risk Per Trade**: 0.5%
- **Max Daily Drawdown**: 1.25%
- **Trailing Stop Loss**: 0.5%

### Usage Instructions
1. **Local Development**: The test user is automatically created when the backend starts in development mode
2. **Production Testing**: You'll need to manually create the test user or register a new account
3. **Database Reset**: If you reset the database, the test user will be recreated on next server start

### Features Available for Testing
- ✅ User authentication (login/logout)
- ✅ Dashboard with risk metrics
- ✅ Strategy management interface
- ✅ Backtesting results display
- ✅ Live trading panel
- ✅ Risk management controls
- ✅ Portfolio tracking
- ✅ Settings configuration

### Note
This test user is created automatically in development mode only. In production, you should register your own account or create users through the registration process.