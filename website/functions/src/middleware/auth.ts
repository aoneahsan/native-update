import { Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { AuthRequest } from '../types';
import { errors } from '../utils/errors';

/**
 * Verify Firebase ID token
 */
export async function verifyAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw errors.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      throw errors.unauthorized('Missing token');
    }

    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const firebaseError = error as { code: string };
      if (
        firebaseError.code === 'auth/id-token-expired' ||
        firebaseError.code === 'auth/argument-error'
      ) {
        throw errors.unauthorized('Token expired or invalid');
      }
    }
    throw error;
  }
}

/**
 * Require email verification
 */
export function requireEmailVerified(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.emailVerified) {
    throw errors.emailNotVerified(
      'Email verification required. Please verify your email to continue.'
    );
  }

  next();
}

/**
 * Optional authentication (doesn't throw if no token)
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];

      if (token) {
        const decodedToken = await auth.verifyIdToken(token);

        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
        };
      }
    }

    next();
  } catch (_error) {
    next();
  }
}
