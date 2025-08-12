import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../database/init.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

/**
 * Authenticate requests using JWT or API key
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  // Check for Bearer token (JWT)
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      logger.warn('Invalid JWT token', { error: error.message });
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  // Check for API key
  else if (authHeader.startsWith('ApiKey ')) {
    const apiKey = authHeader.substring(7);
    
    // Look up API key in database
    const keyData = db.prepare(
      'SELECT * FROM api_keys WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > datetime("now"))'
    ).get(hashApiKey(apiKey));
    
    if (!keyData) {
      logger.warn('Invalid API key attempted');
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Update last used timestamp
    db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(keyData.id);
    
    req.user = {
      type: 'api_key',
      keyId: keyData.id,
      permissions: keyData.permissions.split(','),
    };
    next();
  } else {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
}

/**
 * Authorize based on required permissions
 */
export function authorize(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Admin users have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check API key permissions
    if (req.user.type === 'api_key') {
      const hasPermission = req.user.permissions.includes(requiredPermission) || 
                           req.user.permissions.includes('admin');
      
      if (!hasPermission) {
        logger.warn('Insufficient permissions', { 
          keyId: req.user.keyId, 
          required: requiredPermission,
          permissions: req.user.permissions 
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Hash API key for storage
 */
function hashApiKey(apiKey) {
  return bcrypt.hashSync(apiKey, 10);
}