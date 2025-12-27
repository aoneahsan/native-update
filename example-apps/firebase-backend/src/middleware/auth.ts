import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export async function authMiddleware(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function adminOnly(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  if (!req.user?.admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}