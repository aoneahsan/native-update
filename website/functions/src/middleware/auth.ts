import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { AppError } from '../utils/errors';

/**
 * Extend Express Request to include user info
 */
export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
    emailVerified: boolean;
  };
}

/**
 * Middleware to verify Firebase authentication token
 * Extracts token from Authorization header and verifies it
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
    }

    const decodedToken = await getAuth().verifyIdToken(token);

    (req as AuthenticatedRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}
