import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  driveConnected: boolean;
  driveEmail: string | null;
  driveConnectedAt: Timestamp | null;
  plan: 'free' | 'pro' | 'enterprise';
  planStartDate: Timestamp | null;
  planEndDate: Timestamp | null;
  appsCount: number;
  buildsCount: number;
  storageUsed: number;
  preferences: {
    emailNotifications: boolean;
    updateNotifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  updatedAt: Timestamp;
}

export interface App {
  id: string;
  userId: string;
  name: string;
  packageId: string;
  icon: string | null;
  description: string;
  platforms: ('ios' | 'android' | 'web')[];
  channels: {
    production: ChannelConfig;
    staging: ChannelConfig;
    development: ChannelConfig;
  };
  totalBuilds: number;
  activeUsers: number;
  lastBuildDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChannelConfig {
  enabled: boolean;
  autoUpdate: boolean;
  updateStrategy: 'immediate' | 'background' | 'manual';
  requireUserConsent: boolean;
  minVersion: string | null;
}

export interface Build {
  id: string;
  userId: string;
  appId: string;
  version: string;
  buildNumber: number;
  versionCode: number;
  bundleVersion: string;
  channel: 'production' | 'staging' | 'development';
  platform: 'ios' | 'android' | 'web';
  fileName: string;
  fileSize: number;
  fileType: 'zip' | 'apk' | 'ipa';
  mimeType: string;
  checksum: string;
  signature: string | null;
  driveFileId: string;
  driveFileUrl: string;
  driveFolderId: string;
  releaseNotes: string;
  releaseType: 'major' | 'minor' | 'patch' | 'hotfix';
  isPreRelease: boolean;
  uploadedAt: Timestamp;
  uploadedBy: string;
  uploadDuration: number;
  status: 'uploading' | 'processing' | 'active' | 'archived' | 'failed';
  error: string | null;
  downloads: number;
  installs: number;
  rollbacks: number;
  errors: number;
  updatedAt: Timestamp;
}

export interface DriveToken {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  scope: string[];
  expiresAt: Timestamp;
  encryptionMethod: string;
  iv: string;
  authTag: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
