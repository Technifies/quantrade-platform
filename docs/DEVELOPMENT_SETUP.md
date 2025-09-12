# Development Setup Guide

This guide will help you set up the development environment for the Quantitative Trading Platform.

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher)
- **Git**
- **VS Code** (recommended)

## Project Structure

```
quanttrade-platform/
├── frontend/                 # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   ├── python-services/      # Python microservices
│   │   └── backtrader-engine/
│   └── package.json
├── supabase/                 # Database migrations
│   └── migrations/
├── docs/                     # Documentation
└── README.md
```

## 1. Clone Repository

```bash
git clone https://github.com/Technifies/QuantTradingBolt-v2.git
cd QuantTradingBolt-v2
```

## 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Configure Environment Variables

Edit `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/quantrade

# JWT
JWT_SECRET=your-super-secret-jwt-key-development
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Dhan API (get from Dhan developer portal)
DHAN_BASE_URL=https://api.dhan.co
DHAN_CLIENT_ID=your-dhan-client-id
DHAN_ACCESS_TOKEN=your-dhan-access-token

# Python Services
BACKTRADER_SERVICE_URL=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
```

## 4. Database Setup

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE quantrade;
CREATE USER quantrade_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE quantrade TO quantrade_user;
\q
```

### Run Migrations

```bash
# From project root
psql postgresql://quantrade_user:your_password@localhost:5432/quantrade -f supabase/migrations/20250910041550_scarlet_surf.sql
```

## 5. Redis Setup

### Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**Windows:**
Download from [Redis official website](https://redis.io/download) or use WSL

### Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

## 6. Python Backtrader Service Setup

```bash
# Navigate to Python service directory
cd backend/python-services/backtrader-engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI service
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The Python service will be available at `http://localhost:8000`

## 7. Start Development Servers

### Terminal 1: Frontend
```bash
npm run dev
```

### Terminal 2: Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Python Service
```bash
cd backend/python-services/backtrader-engine
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 4: Redis (if not running as service)
```bash
redis-server
```

## 8. Verify Setup

### Check Services

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:3001/health
3. **Python Service**: http://localhost:8000/health
4. **Database**: Connect via psql or database client

### Test API Endpoints

```bash
# Test backend health
curl http://localhost:3001/health

# Test Python service health
curl http://localhost:8000/health

# Test database connection (should be logged in backend console)
```

## 9. Development Tools

### VS Code Extensions

Install these recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.flake8",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./backend/python-services/backtrader-engine/venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true
}
```

## 10. Testing Setup

### Frontend Testing

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

### Backend Testing

```bash
cd backend

# Install testing dependencies
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# Run tests
npm run test
```

### Python Testing

```bash
cd backend/python-services/backtrader-engine

# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## 11. Debugging

### Backend Debugging

Add to `backend/src/server.ts`:

```typescript
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

### Python Debugging

Add to `backend/python-services/backtrader-engine/app.py`:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Database Debugging

Enable query logging in PostgreSQL:

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

## 12. Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :5173
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Check database exists
psql -l | grep quantrade
```

### Python Virtual Environment Issues

```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Redis Connection Issues

```bash
# Check Redis status
redis-cli ping

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis-server  # Linux
```

## 13. Development Workflow

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request on GitHub
```

### Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Database Changes

```bash
# Create new migration
# Add SQL file to supabase/migrations/

# Apply migration
psql $DATABASE_URL -f supabase/migrations/new_migration.sql
```

This development setup guide provides everything needed to get the quantitative trading platform running locally for development.