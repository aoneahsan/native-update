import { Request } from 'express';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

/**
 * User profile stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  lastLogin: FirebaseFirestore.Timestamp;
  driveConnected: boolean;
  driveEmail: string | null;
  driveConnectedAt: FirebaseFirestore.Timestamp | null;
  plan: 'free' | 'pro' | 'enterprise';
  planStartDate: FirebaseFirestore.Timestamp | null;
  planEndDate: FirebaseFirestore.Timestamp | null;
  appsCount: number;
  buildsCount: number;
  storageUsed: number;
  preferences: UserPreferences;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * User preferences
 */
export interface UserPreferences {
  emailNotifications: boolean;
  updateNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * App platform
 */
export type Platform = 'ios' | 'android' | 'web';

/**
 * Update channel
 */
export type Channel = 'production' | 'staging' | 'development';

/**
 * Release type
 */
export type ReleaseType = 'major' | 'minor' | 'patch';

/**
 * Build status
 */
export type BuildStatus = 'active' | 'archived' | 'deprecated';

/**
 * Channel configuration
 */
export interface ChannelConfig {
  enabled: boolean;
  autoUpdate: boolean;
  updateStrategy: 'immediate' | 'background' | 'manual';
  requireUserConsent: boolean;
  minVersion: string;
}

/**
 * App stored in Firestore
 */
export interface App {
  id: string;
  userId: string;
  name: string;
  packageId: string;
  icon: string | null;
  description: string | null;
  platforms: Platform[];
  channels: {
    production: ChannelConfig;
    staging: ChannelConfig;
    development: ChannelConfig;
  };
  totalBuilds: number;
  activeUsers: number;
  lastBuildDate: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Build stored in Firestore
 */
export interface Build {
  id: string;
  userId: string;
  appId: string;
  version: string;
  buildNumber: number;
  versionCode: number;
  bundleVersion: string;
  channel: Channel;
  platform: Platform;
  fileName: string;
  fileSize: number;
  fileType: string;
  checksum: string;
  driveFileId: string;
  driveFileUrl: string;
  releaseNotes: string | null;
  releaseType: ReleaseType;
  status: BuildStatus;
  downloads: number;
  installs: number;
  uploadedAt: FirebaseFirestore.Timestamp;
  uploadedBy: string;
}

/**
 * Drive tokens stored in Firestore (encrypted)
 */
export interface DriveTokens {
  userId: string;
  accessToken: string; // encrypted
  refreshToken: string; // encrypted
  expiryDate: number;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * Success response
 */
export interface SuccessResponse {
  success: true;
  message: string;
  [key: string]: unknown;
}

/**
 * Error codes
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DRIVE_NOT_CONNECTED = 'DRIVE_NOT_CONNECTED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DUPLICATE_APP = 'DUPLICATE_APP',
  DUPLICATE_BUILD = 'DUPLICATE_BUILD',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_VERSION = 'INVALID_VERSION',
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
