# Deployment Guide

This guide covers deploying the Quantitative Trading Platform to production environments.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Python        │
│   (Netlify)     │◄──►│   (Railway)     │◄──►│   Backtrader    │
│                 │    │                 │    │   (Railway)     │
│ - React App     │    │ - Node.js API   │    │ - FastAPI       │
│ - Static Build  │    │ - PostgreSQL    │    │ - Backtrader    │
│ - Environment   │    │ - Redis Cache   │    │ - Data Engine   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

- GitHub account with repository access
- Netlify account for frontend deployment
- Railway account for backend and database
- Dhan trading account with API access
- Domain name (optional)

## 1. Database Setup (Railway PostgreSQL)

### Step 1: Create PostgreSQL Database
1. Login to [Railway](https://railway.app)
2. Create new project: "QuantTrade Database"
3. Add PostgreSQL service
4. Note the connection details from Variables tab

### Step 2: Run Database Migrations
```bash
# Connect to Railway PostgreSQL
psql $DATABASE_URL

# Run the migration script
\i supabase/migrations/20250910041550_scarlet_surf.sql
```

### Step 3: Verify Database Setup
```sql
-- Check tables are created
\dt

-- Verify indexes
\di

-- Test RLS policies
SELECT * FROM pg_policies;
```

## 2. Backend Deployment (Railway)

### Step 1: Create Backend Service
1. In Railway dashboard, add new service
2. Connect GitHub repository
3. Set root directory to `/backend`
4. Configure build command: `npm run build`
5. Configure start command: `npm start`

### Step 2: Environment Variables
Set the following environment variables in Railway:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database (from Railway PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Redis (Railway Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Dhan API Configuration
DHAN_BASE_URL=https://api.dhan.co
DHAN_CLIENT_ID=your-dhan-client-id
DHAN_ACCESS_TOKEN=your-dhan-access-token

# Python Services
BACKTRADER_SERVICE_URL=${{BacktraderService.RAILWAY_PUBLIC_DOMAIN}}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Step 3: Deploy Backend
```bash
# Railway will automatically deploy on git push
git add .
git commit -m "Deploy backend to Railway"
git push origin main
```

## 3. Python Backtrader Service (Railway)

### Step 1: Create Python Service
1. Add new service in Railway
2. Connect same GitHub repository
3. Set root directory to `/backend/python-services/backtrader-engine`
4. Railway will auto-detect Python and use requirements.txt

### Step 2: Configure Python Service
```env
# Python service environment
PORT=8000
PYTHONPATH=/app
```

### Step 3: Verify Python Service
```bash
# Test the service endpoint
curl https://your-python-service.railway.app/health
```

## 4. Frontend Deployment (Netlify)

### Step 1: Build Configuration
Create `netlify.toml` in project root:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_API_URL = "https://your-backend.railway.app"
  VITE_WS_URL = "wss://your-backend.railway.app"
```

### Step 2: Environment Variables
Set in Netlify dashboard:

```env
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=wss://your-backend.railway.app
VITE_APP_NAME=QuantTrade Platform
```

### Step 3: Deploy to Netlify
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy site

## 5. Domain Configuration (Optional)

### Custom Domain Setup
1. **Netlify**: Add custom domain in site settings
2. **Railway**: Configure custom domain for backend API
3. **DNS Configuration**: Point domains to respective services

### SSL Certificates
- Netlify: Automatic SSL via Let's Encrypt
- Railway: Automatic SSL for custom domains

## 6. Monitoring and Logging

### Application Monitoring
```javascript
// Add to backend for production monitoring
import { logger } from './utils/logger';

// Log all API requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});
```

### Database Monitoring
```sql
-- Monitor database performance
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_stat_database;
```

### Error Tracking
Consider integrating:
- Sentry for error tracking
- DataDog for application monitoring
- Railway metrics for infrastructure monitoring

## 7. Security Considerations

### API Security
- Rate limiting enabled (100 requests/15 minutes)
- CORS configured for production domains
- JWT tokens with secure secrets
- Input validation on all endpoints

### Database Security
- Row Level Security (RLS) enabled
- Encrypted connections (SSL)
- Regular backups via Railway

### API Key Management
- Store Dhan API keys in environment variables
- Rotate keys regularly
- Monitor API usage

## 8. Backup and Recovery

### Database Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Code Backups
- GitHub repository serves as code backup
- Railway maintains deployment history
- Netlify maintains build history

## 9. Performance Optimization

### Backend Optimization
- Redis caching for frequently accessed data
- Database connection pooling
- Gzip compression enabled

### Frontend Optimization
- Vite build optimization
- Code splitting for large components
- CDN delivery via Netlify

### Database Optimization
- Proper indexing on frequently queried columns
- Query optimization for complex operations
- Connection pooling

## 10. Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

**Database connection issues:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"
```

**Python service issues:**
```bash
# Check Python service logs
# Verify requirements.txt dependencies
# Test FastAPI endpoints directly
```

### Health Checks
- Backend: `GET /health`
- Python service: `GET /health`
- Database: Connection test in backend logs

## 11. Scaling Considerations

### Horizontal Scaling
- Railway supports automatic scaling
- Consider load balancing for high traffic
- Database read replicas for read-heavy operations

### Vertical Scaling
- Monitor resource usage in Railway dashboard
- Upgrade plans as needed
- Optimize database queries

This deployment guide ensures a robust, scalable, and secure production environment for your quantitative trading platform.