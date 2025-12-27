import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { z } from 'zod';
import { validateBody, validateQuery } from '../utils/validators';

/**
 * Validate request body middleware
 */
export function validateBodyMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.body = validateBody(schema, req.body);
    next();
  };
}

/**
 * Validate query parameters middleware
 */
export function validateQueryMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.query = validateQuery(schema, req.query) as typeof req.query;
    next();
  };
}
