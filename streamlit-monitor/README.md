# 📊 QuantTrade Streamlit Monitor

A comprehensive monitoring dashboard for the QuantTrade platform built with Streamlit.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd streamlit-monitor
python start_monitor.py
```

### Option 2: Manual Setup
```bash
# Create virtual environment
python -m venv streamlit-env

# Activate virtual environment
# Windows:
streamlit-env\Scripts\activate
# Linux/Mac:
source streamlit-env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Then start Streamlit
streamlit run app.py
```

## 🎯 Features

### 🏠 System Overview
- **Service Status**: Real-time health monitoring of all services
- **Performance Metrics**: Response times and system health indicators
- **Health Gauge**: Visual system health percentage
- **Alert System**: Notifications for service issues

### 📊 API Monitoring
- **Health Checks**: Automated endpoint health monitoring
- **Endpoint Testing**: Interactive API testing tool
- **Performance Tracking**: Response time analysis
- **Request History**: Track and review API calls

### 💾 Database Monitoring
- **PostgreSQL**: Connection status, table statistics, query performance
- **Redis**: Memory usage, hit rates, connection metrics
- **Query Tool**: Execute custom SQL queries with results visualization
- **Analytics**: Database health analysis and maintenance recommendations

### 📈 Trading Analytics
- **Backtesting**: Interactive strategy testing interface
- **Strategy Templates**: Pre-built trading strategies
- **Performance Analysis**: Comprehensive trading metrics
- **Results Dashboard**: Historical backtest comparison

## 🛠️ Configuration

### Environment Variables (.env)
```bash
# Service URLs
BACKEND_URL=http://localhost:3001
PYTHON_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Production URLs
PROD_BACKEND_URL=https://quantrade-backend.onrender.com
PROD_PYTHON_URL=https://quantrade-backtrader.onrender.com
PROD_FRONTEND_URL=https://quanttrade-platform.netlify.app

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quantrade
REDIS_URL=redis://localhost:6379

# Environment
ENVIRONMENT=development  # or production
```

## 📱 Dashboard Pages

### 🏠 Overview Dashboard
- Service status grid
- Performance metrics visualization
- System health monitoring
- Real-time alerts

### 📊 API Monitor
- Health check automation
- Endpoint testing interface
- Performance metrics
- Request logging

### 💾 Database Monitor
- PostgreSQL connection monitoring
- Redis performance tracking
- Query execution tool
- Database analytics

### 📈 Trading Analytics
- Strategy backtesting
- Performance analysis
- Results comparison
- Trading insights

## 🎛️ Controls

### Auto-Refresh
- Enable/disable automatic page refresh
- Configurable refresh intervals (1-300 seconds)
- Real-time monitoring capabilities

### Environment Switching
- Development/Production mode toggle
- Automatic URL switching based on environment
- Service configuration management

### Manual Refresh
- Force refresh button for immediate updates
- Individual component refresh options

## 🔧 Usage Examples

### Running a Backtest
1. Navigate to **📈 Trading** tab
2. Select or write a trading strategy
3. Configure backtest parameters
4. Click "🚀 Run Backtest"
5. View results in the dashboard

### Testing API Endpoints
1. Go to **📊 API Monitor** tab
2. Select endpoint testing
3. Choose HTTP method and endpoint
4. Add headers and request data
5. Execute and view response

### Database Queries
1. Open **💾 Database** tab
2. Use the query tool
3. Write SQL query or select predefined
4. Execute and view results
5. Download results as CSV

## 🚨 Troubleshooting

### Common Issues

#### Service Connection Errors
- **Check URLs**: Verify service URLs in .env file
- **Service Status**: Ensure backend services are running
- **Network**: Check network connectivity to services

#### Database Connection Failed
- **Database URL**: Verify DATABASE_URL format
- **Credentials**: Check username/password
- **Network**: Ensure database is accessible

#### Redis Connection Issues
- **Redis Server**: Check if Redis is running
- **URL Format**: Verify REDIS_URL format
- **Port**: Ensure Redis port (6379) is open

### Debug Steps
1. Check service logs for errors
2. Test connections manually
3. Verify environment variables
4. Check firewall/security settings

## 🔄 Integration with Development Workflow

### Multi-Service Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Python Service
cd backend/python-services/backtrader-engine && uvicorn app:app --reload

# Terminal 4: Streamlit Monitor
cd streamlit-monitor && streamlit run app.py
```

### Service URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Python Service**: http://localhost:8000
- **Streamlit Monitor**: http://localhost:8501

## 📦 Dependencies

### Core Dependencies
- `streamlit` - Dashboard framework
- `pandas` - Data manipulation
- `plotly` - Interactive visualizations
- `requests` - HTTP client for API calls

### Database Dependencies
- `psycopg2-binary` - PostgreSQL adapter
- `redis` - Redis client

### Utility Dependencies
- `python-dotenv` - Environment variable loading
- `websocket-client` - WebSocket support

## 🚀 Deployment Options

### Local Development
- Run alongside your development services
- Real-time monitoring during development
- Testing and debugging interface

### Production Monitoring
- Deploy to Streamlit Cloud
- Monitor production services
- Alert and notification system

### Docker Deployment
```dockerfile
FROM python:3.9-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the QuantTrade platform.

## 📞 Support

For issues and questions:
- Check troubleshooting section
- Review service logs
- Verify configuration settings
- Test individual components

---

**Happy Monitoring! 📊🚀**