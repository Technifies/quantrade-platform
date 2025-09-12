# Render Deployment Steps - Complete Guide

## 🚀 Step-by-Step Deployment Process

### Step 1: Prepare Repository
✅ **COMPLETED** - All configuration files are ready:
- `render.yaml` - Blueprint configuration
- Backend server configured for production
- Database connection with SSL
- Environment variables properly set

### Step 2: Deploy to Render

#### Option A: One-Click Deploy (Recommended)
1. **Click Deploy Button**: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Technifies/QuantTradingBolt-v2)

#### Option B: Manual Blueprint Deploy
1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository: `QuantTradingBolt-v2`
5. Render will detect `render.yaml` and show preview of services
6. Click **"Apply"** to create all services

### Step 3: Monitor Deployment Progress
After clicking deploy, Render will create:

1. **PostgreSQL Database** (`quantrade-database`)
   - Status: Creating → Available
   - Database: `quantrade`
   - User: `quantrade_user`

2. **Redis Cache** (`quantrade-redis`)
   - Status: Creating → Available
   - Memory: 25MB (free tier)

3. **Backend API** (`quantrade-backend`)
   - Status: Building → Deploying → Live
   - Build time: ~3-5 minutes
   - Health check: `/health`

4. **Python Service** (`quantrade-backtrader`)
   - Status: Building → Deploying → Live
   - Build time: ~2-3 minutes
   - Health check: `/health`

### Step 4: Database Migration
**⚠️ ACTION REQUIRED**: Once PostgreSQL is ready:

1. Go to your `quantrade-database` service in Render
2. Click **"Console"** tab (web-based SQL console)
3. Copy the entire SQL content from `supabase/migrations/20250910041550_scarlet_surf.sql`
4. Paste and execute in the console
5. Verify tables are created: `\dt`

### Step 5: Configure Environment Variables
**⚠️ ACTION REQUIRED**: Add your Dhan API credentials:

1. Go to `quantrade-backend` service
2. Click **"Environment"** tab
3. Add these variables:
   ```
   DHAN_CLIENT_ID=your-dhan-client-id
   DHAN_ACCESS_TOKEN=your-dhan-access-token
   ```
4. Click **"Save Changes"**
5. Service will automatically redeploy

### Step 6: Update Frontend (Netlify)
**⚠️ ACTION REQUIRED**: Update Netlify environment variables:

1. Go to your Netlify site dashboard
2. Go to **Site settings** → **Environment variables**
3. Update/Add:
   ```
   VITE_API_URL=https://quantrade-backend.onrender.com
   VITE_WS_URL=wss://quantrade-backend.onrender.com
   ```
4. Trigger a new deploy

### Step 7: Verify Deployment
Test all services:

1. **Backend Health**: https://quantrade-backend.onrender.com/health
2. **Python Service**: https://quantrade-backtrader.onrender.com/health
3. **Frontend**: Your Netlify URL
4. **Database**: Test login/register on frontend

## 📊 Service URLs After Deployment

- **Backend API**: `https://quantrade-backend.onrender.com`
- **Python Service**: `https://quantrade-backtrader.onrender.com`
- **Database**: Internal connection (not public)
- **Redis**: Internal connection (not public)
- **Frontend**: `https://your-site.netlify.app`

## 🔧 Troubleshooting

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check if migration completed successfully
- Test connection in database console

### Service Communication
- Ensure BACKTRADER_SERVICE_URL is correct
- Check health endpoints
- Verify environment variables

## 💰 Free Tier Limits
- **Web Services**: 750 hours/month
- **PostgreSQL**: 1GB storage
- **Redis**: 25MB storage
- **Bandwidth**: 100GB/month

## 🎯 Next Steps After Deployment
1. Test user registration and login
2. Create a test strategy
3. Run a backtest
4. Configure Dhan API for live trading
5. Set up monitoring and alerts

## 📞 Support
- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **GitHub Issues**: Create issues in your repository