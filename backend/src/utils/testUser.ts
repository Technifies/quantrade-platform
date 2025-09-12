import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { logger } from './logger';

export const createTestUser = async (): Promise<void> => {
  try {
    const testEmail = 'test@quantrade.com';
    const testPassword = 'test123456';
    
    // Check if test user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [testEmail]);
    if (existingUser.rows.length > 0) {
      logger.info('Test user already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(testPassword, saltRounds);

    // Default risk profile for testing
    const defaultRiskProfile = {
      totalCapital: 200000,
      intradayAllocation: 100000,
      leverageMultiple: 5,
      maxSimultaneousPositions: 5,
      riskPerTrade: 0.5,
      maxDailyDrawdown: 1.25,
      trailingStopLoss: 0.5
    };

    // Create test user
    await query(`
      INSERT INTO users (id, email, password_hash, risk_profile, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
    `, [testEmail, passwordHash, JSON.stringify(defaultRiskProfile)]);

    logger.info(`Test user created: ${testEmail}`);
  } catch (error) {
    logger.error('Failed to create test user:', error);
  }
};