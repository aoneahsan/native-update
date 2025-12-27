# Task 2: Database Schema Design

**Created:** 2025-12-27
**Status:** 📝 Planning
**Database:** Firebase Firestore

---

## 🎯 Objectives

Design a complete, scalable Firestore database schema that supports:
- User management and authentication
- Multi-app management per user
- Build versioning and distribution
- Google Drive token storage (encrypted)
- Analytics tracking (future)

---

## 📊 Collections Overview

```
firestore/
├── users/                    # User profiles
├── apps/                     # User's applications
├── builds/                   # Build versions
├── drive_tokens/             # Encrypted Drive credentials
└── analytics/                # Usage analytics (future)
```

---

## 📁 Collection 1: `users`

### Purpose
Store user profile information and preferences

### Document ID
`{userId}` - Firebase Auth UID

### Schema

```typescript
interface UserDocument {
  // Identity
  uid: string;                        // Firebase Auth UID (redundant but helpful)
  email: string;                      // User email
  displayName: string | null;         // Full name
  photoURL: string | null;            // Profile picture URL

  // Authentication
  provider: 'email' | 'google.com';   // Auth provider
  emailVerified: boolean;             // Email verification status
  createdAt: Timestamp;               // Account creation
  lastLogin: Timestamp;               // Last login time

  // Google Drive Integration
  driveConnected: boolean;            // Drive connected?
  driveEmail: string | null;          // Drive account email
  driveConnectedAt: Timestamp | null; // When connected

  // Subscription (future)
  plan: 'free' | 'pro' | 'enterprise';
  planStartDate: Timestamp | null;
  planEndDate: Timestamp | null;

  // Usage Stats
  appsCount: number;                  // Total apps created
  buildsCount: number;                // Total builds uploaded
  storageUsed: number;                // Bytes used (in Drive)

  // Preferences
  preferences: {
    emailNotifications: boolean;      // Send email notifications
    updateNotifications: boolean;     // Notify on updates
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'es' | 'fr';    // i18n support
  };

  // Metadata
  updatedAt: Timestamp;               // Last profile update
}
```

### Example Document

```json
{
  "uid": "abc123xyz789",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://lh3.googleusercontent.com/...",

  "provider": "google.com",
  "emailVerified": true,
  "createdAt": {"seconds": 1703721600, "nanoseconds": 0},
  "lastLogin": {"seconds": 1703808000, "nanoseconds": 0},

  "driveConnected": true,
  "driveEmail": "user@gmail.com",
  "driveConnectedAt": {"seconds": 1703722000, "nanoseconds": 0},

  "plan": "free",
  "planStartDate": null,
  "planEndDate": null,

  "appsCount": 2,
  "buildsCount": 5,
  "storageUsed": 157286400,

  "preferences": {
    "emailNotifications": true,
    "updateNotifications": true,
    "theme": "auto",
    "language": "en"
  },

  "updatedAt": {"seconds": 1703808000, "nanoseconds": 0}
}
```

### Indexes Required

```javascript
// Composite indexes
users: {
  fields: ['email', 'createdAt'],
  fields: ['plan', 'createdAt']
}
```

### Security Rules

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['uid', 'email', 'createdAt', 'provider']);
  allow delete: if request.auth.uid == userId;
}
```

---

## 📁 Collection 2: `apps`

### Purpose
Store user's application configurations

### Document ID
Auto-generated

### Schema

```typescript
interface AppDocument {
  // Identity
  id: string;                         // Auto-generated doc ID
  userId: string;                     // Owner (Firebase Auth UID)

  // App Info
  name: string;                       // App display name
  packageId: string;                  // com.example.app
  icon: string | null;                // App icon URL
  description: string;                // App description

  // Platform Support
  platforms: ('ios' | 'android' | 'web')[];

  // Update Channels
  channels: {
    production: ChannelConfig;
    staging: ChannelConfig;
    development: ChannelConfig;
  };

  // Stats
  totalBuilds: number;                // Total builds uploaded
  activeUsers: number;                // Active installs (future)
  lastBuildDate: Timestamp | null;    // Last build upload

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ChannelConfig {
  enabled: boolean;                   // Channel active?
  autoUpdate: boolean;                // Auto-update enabled?
  updateStrategy: 'immediate' | 'background' | 'manual';
  requireUserConsent: boolean;        // Ask before update?
  minVersion: string | null;          // Minimum app version (semver)
}
```

### Example Document

```json
{
  "id": "app_abc123",
  "userId": "abc123xyz789",

  "name": "My Awesome App",
  "packageId": "com.example.awesome",
  "icon": "https://storage.googleapis.com/.../icon.png",
  "description": "A great mobile application",

  "platforms": ["ios", "android"],

  "channels": {
    "production": {
      "enabled": true,
      "autoUpdate": true,
      "updateStrategy": "background",
      "requireUserConsent": false,
      "minVersion": "1.0.0"
    },
    "staging": {
      "enabled": true,
      "autoUpdate": false,
      "updateStrategy": "manual",
      "requireUserConsent": true,
      "minVersion": null
    },
    "development": {
      "enabled": true,
      "autoUpdate": true,
      "updateStrategy": "immediate",
      "requireUserConsent": false,
      "minVersion": null
    }
  },

  "totalBuilds": 5,
  "activeUsers": 1234,
  "lastBuildDate": {"seconds": 1703808000, "nanoseconds": 0},

  "createdAt": {"seconds": 1703721600, "nanoseconds": 0},
  "updatedAt": {"seconds": 1703808000, "nanoseconds": 0}
}
```

### Indexes Required

```javascript
// Composite indexes
apps: {
  fields: ['userId', 'createdAt'],
  fields: ['userId', 'platforms', 'createdAt']
}
```

### Security Rules

```javascript
match /apps/{appId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId
    && request.resource.data.keys().hasAll(['name', 'packageId', 'userId']);
  allow update: if request.auth.uid == resource.data.userId;
  allow delete: if request.auth.uid == resource.data.userId;
}
```

---

## 📁 Collection 3: `builds`

### Purpose
Store build metadata and distribution info

### Document ID
Auto-generated

### Schema

```typescript
interface BuildDocument {
  // Identity
  id: string;                         // Auto-generated doc ID
  userId: string;                     // Owner
  appId: string;                      // Parent app

  // Version Info
  version: string;                    // Semantic version (1.0.0)
  buildNumber: number;                // Integer build number
  versionCode: number;                // Android version code
  bundleVersion: string;              // iOS bundle version

  // Distribution
  channel: 'production' | 'staging' | 'development';
  platform: 'ios' | 'android' | 'web';

  // File Info
  fileName: string;                   // Original filename
  fileSize: number;                   // Size in bytes
  fileType: 'zip' | 'apk' | 'ipa';
  mimeType: string;                   // MIME type

  // Security
  checksum: string;                   // SHA-256 hash
  signature: string | null;           // Digital signature (future)

  // Google Drive
  driveFileId: string;                // Google Drive file ID
  driveFileUrl: string;               // Direct download URL (expiring)
  driveFolderId: string;              // Parent folder ID

  // Release Info
  releaseNotes: string;               // What's new
  releaseType: 'major' | 'minor' | 'patch' | 'hotfix';
  isPreRelease: boolean;              // Beta/alpha?

  // Upload Info
  uploadedAt: Timestamp;              // Upload timestamp
  uploadedBy: string;                 // User email
  uploadDuration: number;             // Upload time (ms)

  // Status
  status: 'uploading' | 'processing' | 'active' | 'archived' | 'failed';
  error: string | null;               // Error message if failed

  // Analytics (aggregated)
  downloads: number;                  // Total downloads
  installs: number;                   // Successful installs
  rollbacks: number;                  // Rollback count
  errors: number;                     // Installation errors

  // Metadata
  updatedAt: Timestamp;
}
```

### Example Document

```json
{
  "id": "build_xyz456",
  "userId": "abc123xyz789",
  "appId": "app_abc123",

  "version": "1.0.1",
  "buildNumber": 2,
  "versionCode": 101,
  "bundleVersion": "1.0.1",

  "channel": "production",
  "platform": "android",

  "fileName": "app-release-1.0.1.zip",
  "fileSize": 31457280,
  "fileType": "zip",
  "mimeType": "application/zip",

  "checksum": "sha256:a1b2c3d4e5f6...",
  "signature": null,

  "driveFileId": "1a2b3c4d5e6f7g8h9i0j",
  "driveFileUrl": "https://drive.google.com/uc?export=download&id=...",
  "driveFolderId": "folder123abc",

  "releaseNotes": "Bug fixes and performance improvements",
  "releaseType": "patch",
  "isPreRelease": false,

  "uploadedAt": {"seconds": 1703808000, "nanoseconds": 0},
  "uploadedBy": "user@example.com",
  "uploadDuration": 12500,

  "status": "active",
  "error": null,

  "downloads": 523,
  "installs": 498,
  "rollbacks": 2,
  "errors": 1,

  "updatedAt": {"seconds": 1703808000, "nanoseconds": 0}
}
```

### Indexes Required

```javascript
// Composite indexes
builds: {
  fields: ['userId', 'uploadedAt'],
  fields: ['appId', 'channel', 'uploadedAt'],
  fields: ['userId', 'status', 'uploadedAt'],
  fields: ['appId', 'platform', 'channel', 'version']
}
```

### Security Rules

```javascript
match /builds/{buildId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId
    && exists(/databases/$(database)/documents/apps/$(request.resource.data.appId))
    && get(/databases/$(database)/documents/apps/$(request.resource.data.appId)).data.userId == request.auth.uid;
  allow update: if request.auth.uid == resource.data.userId;
  allow delete: if request.auth.uid == resource.data.userId;
}
```

---

## 📁 Collection 4: `drive_tokens`

### Purpose
Store encrypted Google Drive OAuth tokens

### Document ID
`{userId}` - Firebase Auth UID

### Schema

```typescript
interface DriveTokenDocument {
  // Identity
  userId: string;                     // Firebase Auth UID

  // OAuth Tokens (ENCRYPTED)
  accessToken: string;                // Encrypted access token
  refreshToken: string;               // Encrypted refresh token

  // Token Metadata
  tokenType: string;                  // Usually "Bearer"
  scope: string[];                    // Granted scopes
  expiresAt: Timestamp;               // Token expiration

  // Encryption Info
  encryptionMethod: 'AES-256-GCM';
  iv: string;                         // Initialization vector (base64)
  authTag: string;                    // Authentication tag (base64)

  // Metadata
  createdAt: Timestamp;               // First connection
  updatedAt: Timestamp;               // Last token refresh
}
```

### Example Document (Encrypted)

```json
{
  "userId": "abc123xyz789",

  "accessToken": "encrypted:gAAAAABl...",
  "refreshToken": "encrypted:gAAAAABl...",

  "tokenType": "Bearer",
  "scope": [
    "https://www.googleapis.com/auth/drive.file"
  ],
  "expiresAt": {"seconds": 1703811600, "nanoseconds": 0},

  "encryptionMethod": "AES-256-GCM",
  "iv": "base64_encoded_iv_here",
  "authTag": "base64_encoded_tag_here",

  "createdAt": {"seconds": 1703722000, "nanoseconds": 0},
  "updatedAt": {"seconds": 1703808000, "nanoseconds": 0}
}
```

### Security Rules (VERY RESTRICTIVE)

```javascript
match /drive_tokens/{userId} {
  // Only backend functions can write
  allow read, write: if false;

  // Exception: Cloud Functions have admin access
  // Client-side code should NEVER access this collection directly
}
```

### Encryption Implementation

```typescript
// Backend only - NEVER expose to client
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DRIVE_TOKEN_ENCRYPTION_KEY; // 32 bytes

function encryptToken(token: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encrypted: `encrypted:${encrypted}`,
    iv: iv.toString('base64'),
    authTag
  };
}

function decryptToken(encrypted: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encrypted.replace('encrypted:', ''), 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## 📁 Collection 5: `analytics` (Future)

### Purpose
Track build downloads, installations, and errors

### Document ID
Auto-generated

### Schema

```typescript
interface AnalyticsDocument {
  // Identity
  userId: string;
  appId: string;
  buildId: string;

  // Event Info
  eventType: 'download' | 'install' | 'rollback' | 'error' | 'check';
  eventData: Record<string, any>;    // Event-specific data

  // Device Info
  deviceId: string;                   // Hashed device ID
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;

  // Location (optional)
  country: string | null;
  region: string | null;

  // Timestamp
  timestamp: Timestamp;
}
```

---

## 🔐 Firestore Security Rules (Complete)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function emailVerified() {
      return request.auth.token.email_verified == true;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId) && emailVerified();
      allow update: if isOwner(userId)
        && !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['uid', 'email', 'createdAt', 'provider']);
      allow delete: if isOwner(userId);
    }

    // Apps collection
    match /apps/{appId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && emailVerified()
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Builds collection
    match /builds/{buildId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && emailVerified()
        && request.resource.data.userId == request.auth.uid
        && exists(/databases/$(database)/documents/apps/$(request.resource.data.appId))
        && get(/databases/$(database)/documents/apps/$(request.resource.data.appId)).data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Drive tokens (backend only)
    match /drive_tokens/{userId} {
      allow read, write: if false;  // Client can NEVER access
    }

    // Analytics (write only for authenticated users)
    match /analytics/{eventId} {
      allow read: if false;  // No client reads
      allow create: if isAuthenticated();
    }
  }
}
```

---

## 📊 Firestore Indexes

### Required Composite Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "apps",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "builds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "builds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "appId", "order": "ASCENDING" },
        { "fieldPath": "channel", "order": "ASCENDING" },
        { "fieldPath": "uploadedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "builds",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "appId", "order": "ASCENDING" },
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "channel", "order": "ASCENDING" },
        { "fieldPath": "version", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## ✅ Implementation Checklist

- [ ] Create Firestore database
- [ ] Define all collections and schemas
- [ ] Implement security rules
- [ ] Deploy security rules: `firebase deploy --only firestore:rules`
- [ ] Create composite indexes
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Test read/write permissions
- [ ] Setup encryption for drive_tokens
- [ ] Document all collections
- [ ] Create TypeScript interfaces

---

**Plan Status:** ✅ Complete and ready for implementation
**Database Type:** Firestore (NoSQL)
**Total Collections:** 5 (4 active + 1 future)
