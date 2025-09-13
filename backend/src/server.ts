import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables first
dotenv.config();

// Set PORT early for Render
const PORT = process.env.PORT || 3001;

// Import logger after dotenv config
import { logger } from './utils/logger';

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Some features may not work properly');
}

import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import mockAuthRoutes from './routes/mock-auth';
import strategyRoutes from './routes/strategies';
import backtestRoutes from './routes/backtests';
import tradingRoutes from './routes/trading';
import riskRoutes from './routes/risk';
import dhanRoutes from './routes/dhan';

// Services
import { WebSocketService } from './services/websocket';
import { TradingService } from './services/trading';
import { RiskService } from './services/risk';
import { createTestUser } from './utils/testUser';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://quantrade-platform.netlify.app',
        'https://quanttrade-platform.netlify.app',
        /\.netlify\.app$/,
        /\.onrender\.com$/
      ]
    : ['http://localhost:5173'],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected',
      redis: process.env.REDIS_URL ? 'connected' : 'disabled'
    }
  });
});

// API Routes
// Use mock auth in development if MOCK_AUTH_MODE is enabled
if (process.env.MOCK_AUTH_MODE === 'true') {
  console.log('🧪 Mock authentication mode enabled for testing');
  app.use('/api/auth', mockAuthRoutes);
} else {
  app.use('/api/auth', authRoutes);
}

app.use('/api/strategies', authMiddleware, strategyRoutes);
app.use('/api/backtests', authMiddleware, backtestRoutes);
app.use('/api/trading', authMiddleware, tradingRoutes);
app.use('/api/risk', authMiddleware, riskRoutes);
app.use('/api/dhan', authMiddleware, dhanRoutes);

// Error handling
app.use(errorHandler);

// Initialize services
const wsService = new WebSocketService(wss);
const tradingService = new TradingService(wsService);
const riskService = new RiskService(wsService);

async function startServer() {
  try {
    // Start server first to bind to port for Render
    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Connect to databases after server starts
    try {
      await connectDatabase();
      logger.info('Database connected successfully');
      
      // Create test user for development/testing
      if (process.env.NODE_ENV !== 'production') {
        await createTestUser();
      }
    } catch (error) {
      logger.error('Database connection failed:', error);
      // Continue without database for now
    }

    try {
      await connectRedis();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Continue without Redis for now
    }

    // Initialize services after connections
    try {
      await tradingService.initialize();
      await riskService.initialize();
      logger.info('Services initialized successfully');
    } catch (error) {
      logger.error('Service initialization failed:', error);
      // Continue without services for now
    }

  } catch (error) {
    logger.error('Failed to start server:', error);
    // Don't exit - let server run for debugging
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();