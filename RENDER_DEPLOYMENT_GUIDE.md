# 🚀 Render Deployment Guide - Step by Step

## Current Status: Ready to Deploy ✅

Your `render.yaml` blueprint is perfectly configured! Here's the complete deployment process:

## **Step 1: Deploy to Render** 
**⚠️ ACTION REQUIRED NOW:**

### Option A: One-Click Deploy (Recommended)
Click this button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Technifies/QuantTradingBolt-v2)

### Option B: Manual Blueprint Deploy
1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository: `QuantTradingBolt-v2`
4. Render will detect your `render.yaml` file
5. Click **"Apply"** to create all services

## **Step 2: Monitor Service Creation**
Render will create these services (takes 5-10 minutes):

1. **quantrade-database** (PostgreSQL)
   - Status: Creating → Available
   - Database: `quantrade`
   - User: `quantrade_user`

2. **quantrade-redis** (Redis Cache)
   - Status: Creating → Available
   - Memory: 25MB (free tier)

3. **quantrade-backend** (Node.js API)
   - Status: Building → Deploying → Live
   - Build time: ~3-5 minutes
   - URL: `https://quantrade-backend.onrender.com`

4. **quantrade-backtrader** (Python Service)
   - Status: Building → Deploying → Live
   - Build time: ~2-3 minutes
   - URL: `https://quantrade-backtrader.onrender.com`

## **Step 3: Database Migration** 
**⚠️ CRITICAL - Do this after PostgreSQL is "Available":**

1. Go to your `quantrade-database` service in Render
2. Click **"Console"** tab (web-based SQL console)
3. Copy the entire SQL from `supabase/migrations/20250910041550_scarlet_surf.sql`
4. Paste and execute in the console
5. Verify tables: Run `\dt` to list tables

## **Step 4: Configure Dhan API**
**⚠️ ACTION REQUIRED:**

1. Go to `quantrade-backend` service in Render
2. Click **"Environment"** tab
3. Add these variables:
   ```
   DHAN_CLIENT_ID=your-dhan-client-id
   DHAN_ACCESS_TOKEN=your-dhan-access-token
   ```
4. Click **"Save Changes"** (service will redeploy)

## **Step 5: Update Frontend (Netlify)**
**⚠️ ACTION REQUIRED:**

1. Go to your Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Update/Add:
   ```
   VITE_API_URL=https://quantrade-backend.onrender.com
   VITE_WS_URL=wss://quantrade-backend.onrender.com
   ```
4. Trigger new deploy

## **Step 6: Test Deployment**
Verify all services:

1. **Backend Health**: https://quantrade-backend.onrender.com/health
2. **Python Service**: https://quantrade-backtrader.onrender.com/health
3. **Frontend**: Your Netlify URL
4. **Full Test**: Register/login on frontend

## **Service URLs After Deployment**
- **Backend API**: `https://quantrade-backend.onrender.com`
- **Python Service**: `https://quantrade-backtrader.onrender.com`
- **Database**: Internal connection (not public)
- **Redis**: Internal connection (not public)
- **Frontend**: `https://your-site.netlify.app`

## **Free Tier Limits**
- Web Services: 750 hours/month
- PostgreSQL: 1GB storage
- Redis: 25MB storage
- Bandwidth: 100GB/month

## **Next Steps After Successful Deployment**
1. Test user registration and login
2. Create a test strategy
3. Run a backtest
4. Configure live trading with Dhan API
5. Monitor logs and performance

---

## **🆘 Need Help?**
If you encounter any issues during deployment:
1. Check service logs in Render dashboard
2. Verify environment variables are set correctly
3. Ensure database migration completed successfully
4. Test health endpoints individually

**Ready to deploy? Click the deploy button above to start!** 🚀