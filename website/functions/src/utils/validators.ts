import { z } from 'zod';
import * as semver from 'semver';
import { AppError } from './errors';

/**
 * Validate semver version string
 */
export function validateVersion(version: string): boolean {
  return semver.valid(version) !== null;
}

/**
 * Compare two semver versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if v1 === v2
 */
export function compareVersions(v1: string, v2: string): number {
  return semver.compare(v1, v2);
}

/**
 * Check if an update is available
 */
export function isUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(latestVersion, currentVersion) > 0;
}

/**
 * Platform validator
 */
export const platformSchema = z.enum(['ios', 'android', 'web']);

/**
 * Channel validator
 */
export const channelSchema = z.enum(['production', 'staging', 'development']);

/**
 * Release type validator
 */
export const releaseTypeSchema = z.enum(['major', 'minor', 'patch']);

/**
 * Build status validator
 */
export const buildStatusSchema = z.enum(['active', 'archived', 'deprecated']);

/**
 * User preferences validator
 */
export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  updateNotifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
});

/**
 * Channel config validator
 */
export const channelConfigSchema = z.object({
  enabled: z.boolean(),
  autoUpdate: z.boolean(),
  updateStrategy: z.enum(['immediate', 'background', 'manual']),
  requireUserConsent: z.boolean(),
  minVersion: z.string().refine(validateVersion, {
    message: 'Invalid semantic version format',
  }),
});

/**
 * Create app validator
 */
export const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  packageId: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/, 'Invalid package ID format'),
  description: z.string().max(500).optional(),
  platforms: z.array(platformSchema).min(1),
  icon: z.string().url().optional(),
});

/**
 * Update app validator
 */
export const updateAppSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().url().optional(),
  channels: z
    .object({
      production: channelConfigSchema.optional(),
      staging: channelConfigSchema.optional(),
      development: channelConfigSchema.optional(),
    })
    .optional(),
});

/**
 * Create build validator
 */
export const createBuildSchema = z.object({
  appId: z.string().min(1),
  version: z.string().refine(validateVersion, {
    message: 'Invalid semantic version format',
  }),
  buildNumber: z.number().int().positive(),
  versionCode: z.number().int().positive(),
  bundleVersion: z.string(),
  channel: channelSchema,
  platform: platformSchema,
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
  checksum: z.string().min(1),
  releaseNotes: z.string().max(1000).optional(),
  releaseType: releaseTypeSchema,
  storageFilePath: z.string().min(1),
});

/**
 * Update build validator
 */
export const updateBuildSchema = z.object({
  status: buildStatusSchema.optional(),
  releaseNotes: z.string().max(1000).optional(),
});

/**
 * Update profile validator
 */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoURL: z.string().url().optional(),
});

/**
 * Check update query validator
 */
export const checkUpdateQuerySchema = z.object({
  channel: channelSchema,
  platform: platformSchema,
  currentVersion: z.string().refine(validateVersion, {
    message: 'Invalid semantic version format',
  }),
});

/**
 * Pagination query validator
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * Validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.errors.reduce(
      (acc, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', formattedErrors);
  }

  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.errors.reduce(
      (acc, err) => {
        acc[err.path.join('.')] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters', formattedErrors);
  }

  return result.data;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    throw new AppError(
      400,
      'FILE_TOO_LARGE',
      `File size exceeds maximum allowed size of ${maxSize} bytes`
    );
  }
}

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZE = {
  FREE_PLAN: 100 * 1024 * 1024, // 100 MB
  PRO_PLAN: 500 * 1024 * 1024, // 500 MB
  ENTERPRISE_PLAN: 2 * 1024 * 1024 * 1024, // 2 GB
};
