import { Response } from 'express';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Send error response with consistent format
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle errors in route handlers
 */
export function handleError(error: unknown, res: Response): void {
  console.error('Error:', error);

  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof Error) {
    sendError(res, 500, 'INTERNAL_ERROR', error.message);
    return;
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

/**
 * Validation helper
 */
export function validateRequired(
  fields: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !fields[field]);

  if (missing.length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Missing required fields',
      { missingFields: missing }
    );
  }
}

/**
 * Validate string field
 */
export function validateString(
  value: unknown,
  fieldName: string,
  minLength = 1,
  maxLength = 1000
): asserts value is string {
  if (typeof value !== 'string') {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be a string`
    );
  }

  if (value.length < minLength) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must be at least ${minLength} characters`
    );
  }

  if (value.length > maxLength) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${fieldName} must not exceed ${maxLength} characters`
    );
  }
}

/**
 * Validate app ID format
 */
export function validateAppId(appId: string): void {
  const appIdRegex = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  if (!appIdRegex.test(appId)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'App ID must be lowercase alphanumeric with hyphens, 2-63 characters'
    );
  }
}

/**
 * Validate version format (semver)
 */
export function validateVersion(version: string): void {
  const versionRegex = /^\d+\.\d+\.\d+$/;

  if (!versionRegex.test(version)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Version must follow semantic versioning (e.g., 1.0.0)'
    );
  }
}

/**
 * Validate platform
 */
export function validatePlatform(platform: string): void {
  const validPlatforms = ['ios', 'android'];

  if (!validPlatforms.includes(platform)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `Platform must be one of: ${validPlatforms.join(', ')}`
    );
  }
}
