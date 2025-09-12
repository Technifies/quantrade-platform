# Render Setup Instructions

## Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)
1. Click the deploy button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Technifies/QuantTradingBolt-v2)
2. This will automatically create all services using the `render.yaml` blueprint

### Option 2: Manual Setup

#### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your repository

#### Step 2: Deploy Services
1. In Render dashboard: **New** → **Blueprint**
2. Select your GitHub repository
3. Render will detect `render.yaml` and create:
   - PostgreSQL database
   - Redis cache
   - Backend API service
   - Python Backtrader service

#### Step 3: Run Database Migration
1. Go to your PostgreSQL service in Render
2. Click **"Console"** tab
3. Copy and paste the SQL from `supabase/migrations/20250910041550_scarlet_surf.sql`
4. Execute the migration

#### Step 4: Update Frontend
Update your Netlify environment variables:
```
VITE_API_URL=https://quantrade-backend.onrender.com
VITE_WS_URL=wss://quantrade-backend.onrender.com
```

## Service URLs After Deployment
- **Backend API**: `https://quantrade-backend.onrender.com`
- **Python Service**: `https://quantrade-backtrader.onrender.com`
- **Database**: Internal connection
- **Redis**: Internal connection

## Environment Variables
The following will be automatically configured:
- `DATABASE_URL` - From PostgreSQL service
- `REDIS_URL` - From Redis service
- `JWT_SECRET` - Auto-generated secure key
- `BACKTRADER_SERVICE_URL` - From Python service

## Health Checks
Both services include health check endpoints:
- Backend: `/health`
- Python: `/health`

## Monitoring
Access logs and metrics through Render dashboard for each service.

## Free Tier Limits
- 750 hours/month web services
- 1GB PostgreSQL storage
- 25MB Redis storage
- 100GB bandwidth/month

For production workloads, consider upgrading to paid plans.