import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Default risk profile
const DEFAULT_RISK_PROFILE = {
  totalCapital: 200000,
  intradayAllocation: 100000,
  leverageMultiple: 5,
  maxSimultaneousPositions: 5,
  riskPerTrade: 0.5,
  maxDailyDrawdown: 1.25,
  trailingStopLoss: 0.5
};

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await query(`
        INSERT INTO users (id, email, password_hash, risk_profile, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
        RETURNING id, email, created_at
      `, [email, passwordHash, JSON.stringify(DEFAULT_RISK_PROFILE)]);

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          riskProfile: DEFAULT_RISK_PROFILE,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const result = await query(`
        SELECT id, email, password_hash, risk_profile, created_at 
        FROM users WHERE email = $1
      `, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          riskProfile: user.risk_profile,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Get profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    const result = await query(`
      SELECT id, email, dhan_client_id, risk_profile, created_at, updated_at
      FROM users WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      dhanClientId: user.dhan_client_id,
      riskProfile: user.risk_profile,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    logger.error('Profile fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', 
  authMiddleware,
  [
    body('dhanClientId').optional().isString().trim(),
    body('riskProfile').optional().isObject()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.user?.id;
      const { dhanClientId, riskProfile } = req.body;

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (dhanClientId !== undefined) {
        updateFields.push(`dhan_client_id = $${paramIndex}`);
        updateValues.push(dhanClientId);
        paramIndex++;
      }

      if (riskProfile) {
        updateFields.push(`risk_profile = $${paramIndex}`);
        updateValues.push(JSON.stringify(riskProfile));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const result = await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, dhan_client_id, risk_profile, updated_at
      `, updateValues);

      const user = result.rows[0];
      logger.info(`Profile updated for user: ${user.email}`);

      res.json({
        id: user.id,
        email: user.email,
        dhanClientId: user.dhan_client_id,
        riskProfile: user.risk_profile,
        updatedAt: user.updated_at
      });
    } catch (error) {
      logger.error('Profile update failed:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Logout (optional - mainly for logging)
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;