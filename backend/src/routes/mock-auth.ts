import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Mock user data for testing
const mockUsers = [
  {
    id: 1,
    email: 'test@quantrade.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // hash of 'test123456'
    firstName: 'Test',
    lastName: 'User',
    role: 'trader',
    riskProfile: {
      maxPositionSize: 10000,
      maxDrawdown: 0.1,
      maxLeverage: 2
    }
  },
  {
    id: 2,
    email: 'demo@quantrade.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // hash of 'demo123'
    firstName: 'Demo',
    lastName: 'Trader',
    role: 'trader',
    riskProfile: {
      maxPositionSize: 5000,
      maxDrawdown: 0.05,
      maxLeverage: 1.5
    }
  }
];

// Mock authentication login
router.post('/login', async (req, res) => {
  try {
    console.log('Mock auth login attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in mock data
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For testing, allow both hashed and plain text passwords
    const isValidPassword = await bcrypt.compare(password, user.password) || password === 'test123456' || password === 'demo123';
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('Mock login successful for:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Mock authentication register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'trader',
      riskProfile: {
        maxPositionSize: 10000,
        maxDrawdown: 0.1,
        maxLeverage: 2
      }
    };

    mockUsers.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    console.log('Mock registration successful for:', email);

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Mock registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        riskProfile: user.riskProfile
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;