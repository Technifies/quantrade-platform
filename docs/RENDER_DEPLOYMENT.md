# Render Deployment Guide

This guide covers deploying the QuantTrade Platform to Render.

## Why Render?

- **Easy Database Management**: Built-in PostgreSQL with web console
- **Simple Deployment**: Git-based deployments
- **Integrated Services**: Database, Redis, and web services in one platform
- **Developer Friendly**: Excellent logging and monitoring tools

## Deployment Steps

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### 2. Deploy Using Blueprint (Recommended)

#### Option A: One-Click Deploy
1. Click this button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Technifies/QuantTradingBolt-v2)
2. This will automatically create all services using the `render.yaml` blueprint

#### Option B: Manual Blueprint Deploy
1. In Render dashboard, click "New" → "Blueprint"
2. Connect your GitHub repository
3. Render will detect the `render.yaml` file and create all services

### 3. Manual Service Creation (Alternative)

If you prefer to create services manually:

#### A. PostgreSQL Database
1. **New** → **PostgreSQL**
2. **Name**: `quantrade-database`
3. **Database**: `quantrade`
4. **User**: `quantrade_user`
5. **Region**: Choose closest to you
6. **Plan**: Free tier is fine for development
7. **Create Database**

#### B. Backend API Service
1. **New** → **Web Service**
2. **Connect Repository**: Select your GitHub repo
3. **Name**: `quantrade-backend`
4. **Environment**: `Node`
5. **Region**: Same as database
6. **Branch**: `main`
7. **Root Directory**: `backend`
8. **Build Command**: `npm install && npm run build`
9. **Start Command**: `npm start`
10. **Plan**: Free tier

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Auto-filled from database]
JWT_SECRET=[Generate a secure random string]
JWT_EXPIRES_IN=7d
DHAN_BASE_URL=https://api.dhan.co
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### C. Python Backtrader Service
1. **New** → **Web Service**
2. **Connect Repository**: Same repo
3. **Name**: `quantrade-backtrader`
4. **Environment**: `Python`
5. **Root Directory**: `backend/python-services/backtrader-engine`
6. **Build Command**: `pip install -r requirements.txt`
7. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port 10000`

**Environment Variables:**
```
PORT=10000
PYTHONPATH=/opt/render/project/src
```

#### D. Redis Service
1. **New** → **Redis**
2. **Name**: `quantrade-redis`
3. **Plan**: Free tier
4. **Region**: Same as other services

### 4. Database Migration

Once your PostgreSQL database is created:

1. **Go to your database service in Render**
2. **Click "Connect"** → **"External Connection"**
3. **Copy the External Database URL**
4. **In the database dashboard, click "Console"** (this is the web-based SQL console!)
5. **Paste the migration SQL** from `supabase/migrations/20250910041550_scarlet_surf.sql`
6. **Execute the migration**

### 5. Update Environment Variables

After all services are created, update the backend service environment variables:

```
DATABASE_URL=[From your PostgreSQL service]
REDIS_URL=[From your Redis service]
BACKTRADER_SERVICE_URL=https://quantrade-backtrader.onrender.com
```

### 6. Frontend Deployment (Netlify)

Keep using Netlify for the frontend, but update the API URLs:

**Netlify Environment Variables:**
```
VITE_API_URL=https://quantrade-backend.onrender.com
VITE_WS_URL=wss://quantrade-backend.onrender.com
```

## Service URLs

After deployment, your services will be available at:

- **Backend API**: `https://quantrade-backend.onrender.com`
- **Python Service**: `https://quantrade-backtrader.onrender.com`
- **Database**: Internal connection via `DATABASE_URL`
- **Redis**: Internal connection via `REDIS_URL`
- **Frontend**: `https://your-site.netlify.app`

## Monitoring and Logs

Render provides excellent monitoring:

1. **Service Logs**: Real-time logs for each service
2. **Metrics**: CPU, memory, and request metrics
3. **Health Checks**: Automatic health monitoring
4. **Alerts**: Email notifications for service issues

## Free Tier Limitations

Render's free tier includes:
- **Web Services**: 750 hours/month (enough for 1 service)
- **PostgreSQL**: 1GB storage, 1 month retention
- **Redis**: 25MB storage
- **Bandwidth**: 100GB/month

For production, consider upgrading to paid plans.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify build commands are correct

2. **Database Connection Issues**
   - Verify DATABASE_URL is correctly set
   - Check if migration ran successfully
   - Test connection in database console

3. **Service Communication**
   - Ensure internal service URLs are correct
   - Check environment variables
   - Verify health check endpoints

### Getting Help

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Support**: Available through Render dashboard

## Security Considerations

- **Environment Variables**: Never commit secrets to Git
- **Database**: Use connection pooling for production
- **API Keys**: Store Dhan API keys securely in environment variables
- **CORS**: Configure properly for your frontend domain

This deployment setup provides a robust, scalable platform for your quantitative trading application.