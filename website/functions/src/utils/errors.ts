import { Response } from 'express';
import { ErrorCode, ErrorResponse } from '../types';

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): void {
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    ...(details && { details }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle API error
 */
export function handleError(res: Response, error: unknown): void {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof Error) {
    sendError(res, 500, ErrorCode.INTERNAL_ERROR, error.message);
    return;
  }

  sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
}

/**
 * Common error factories
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    new ApiError(401, ErrorCode.UNAUTHORIZED, message),

  emailNotVerified: (message = 'Email not verified') =>
    new ApiError(403, ErrorCode.EMAIL_NOT_VERIFIED, message),

  notFound: (resource: string, id?: string) =>
    new ApiError(
      404,
      ErrorCode.NOT_FOUND,
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`
    ),

  forbidden: (message = 'Forbidden') =>
    new ApiError(403, ErrorCode.FORBIDDEN, message),

  validation: (message: string, details?: Record<string, unknown>) =>
    new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details),

  driveNotConnected: (message = 'Google Drive not connected') =>
    new ApiError(400, ErrorCode.DRIVE_NOT_CONNECTED, message),

  uploadFailed: (message = 'Upload failed') =>
    new ApiError(500, ErrorCode.UPLOAD_FAILED, message),

  duplicate: (resource: string, field: string, value: string) =>
    new ApiError(
      409,
      resource === 'app' ? ErrorCode.DUPLICATE_APP : ErrorCode.DUPLICATE_BUILD,
      `${resource} with ${field} '${value}' already exists`
    ),

  rateLimitExceeded: (message = 'Rate limit exceeded') =>
    new ApiError(429, ErrorCode.RATE_LIMIT_EXCEEDED, message),

  fileTooLarge: (maxSize: number) =>
    new ApiError(
      400,
      ErrorCode.FILE_TOO_LARGE,
      `File size exceeds maximum allowed size of ${maxSize} bytes`
    ),

  invalidVersion: (message = 'Invalid version format') =>
    new ApiError(400, ErrorCode.INVALID_VERSION, message),
};
