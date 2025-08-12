import express from 'express';
import { generateToken, verifyPassword } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Admin login
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // In production, you'd check against a database
    // For now, we use environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
    
    // Simple comparison for demo - use bcrypt in production
    if (password !== adminPassword) {
      logger.warn('Failed login attempt');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      role: 'admin',
      timestamp: Date.now(),
    });

    res.json({
      token,
      expiresIn: '24h',
    });

    logger.info('Admin login successful');
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In a real implementation, you'd validate the old token
    // and possibly check a refresh token
    
    const newToken = generateToken({
      role: 'admin',
      timestamp: Date.now(),
    });

    res.json({
      token: newToken,
      expiresIn: '24h',
    });
  } catch (error) {
    next(error);
  }
});

export default router;