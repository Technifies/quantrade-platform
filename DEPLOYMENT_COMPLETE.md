# 🚀 Complete Deployment Guide

## Step 1: Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Technifies/QuantTradingBolt-v2)

## Step 2: Configure Environment Variables
In Render backend service, add:
```
DATABASE_URL=[auto-filled]
JWT_SECRET=quantrade-super-secure-jwt-key-2025-production
REDIS_URL=[auto-filled]
BACKTRADER_SERVICE_URL=https://quantrade-backtrader.onrender.com
```

## Step 3: Execute Database Migration
1. Go to PostgreSQL service → Console
2. Paste SQL from `supabase/migrations/20250910041550_scarlet_surf.sql`
3. Execute

## Step 4: Update Frontend
Netlify environment variables:
```
VITE_API_URL=https://quantrade-backend.onrender.com
VITE_WS_URL=wss://quantrade-backend.onrender.com
```

## Step 5: Test Login
- **Email**: test@quantrade.com  
- **Password**: test123456

## Health Checks
- Backend: https://quantrade-backend.onrender.com/health
- Python: https://quantrade-backtrader.onrender.com/health
- Frontend: https://your-site.netlify.app

**Status**: Ready for testing once deployed