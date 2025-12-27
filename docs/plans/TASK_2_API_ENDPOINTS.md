# Task 2: API Endpoints Plan

**Created:** 2025-12-27
**Status:** 📝 Planning
**Backend:** Firebase Cloud Functions (Node.js 22)

---

## 🎯 Objectives

Design and implement a complete REST API for:
- User management
- App CRUD operations
- Build upload and management
- Google Drive integration
- Configuration generation
- Public endpoints for app update checks

---

## 🏗️ Backend Architecture

### Technology Stack
- **Runtime:** Node.js 22 (Firebase Functions)
- **Language:** TypeScript
- **Database:** Firestore
- **Storage:** Firebase Storage (temp) + Google Drive (permanent)
- **Authentication:** Firebase Auth (verify ID tokens)
- **Encryption:** crypto (AES-256-GCM for Drive tokens)

### Project Structure
```
functions/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── middleware/
│   │   ├── auth.ts                 # Auth verification
│   │   ├── validation.ts           # Request validation
│   │   └── error-handler.ts        # Error handling
│   ├── services/
│   │   ├── drive-service.ts        # Google Drive operations
│   │   ├── build-service.ts        # Build management
│   │   ├── config-service.ts       # Config generation
│   │   └── analytics-service.ts    # Analytics tracking
│   ├── routes/
│   │   ├── auth.ts                 # Auth endpoints
│   │   ├── users.ts                # User endpoints
│   │   ├── apps.ts                 # App endpoints
│   │   ├── builds.ts               # Build endpoints
│   │   ├── drive.ts                # Drive endpoints
│   │   ├── config.ts               # Config endpoints
│   │   └── public.ts               # Public endpoints
│   ├── utils/
│   │   ├── validation.ts           # Input validators
│   │   ├── encryption.ts           # Token encryption
│   │   └── helpers.ts              # Helper functions
│   └── types/
│       └── index.ts                # TypeScript types
├── package.json
└── tsconfig.json
```

---

## 🔐 Authentication Middleware

All protected endpoints require Firebase Auth token verification.

```typescript
// src/middleware/auth.ts
import { auth } from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ error: 'Email not verified' });
  }
  next();
};
```

---

## 📡 API Endpoints

### Base URL
- **Development:** `http://localhost:5001/native-update-dev/us-central1/api`
- **Production:** `https://us-central1-native-update-prod.cloudfunctions.net/api`

---

## 1. Authentication Endpoints

### POST `/api/auth/signup`

**Purpose:** Create new user (handled by Firebase Auth client SDK, backend creates Firestore doc)

**Protected:** No

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "abc123xyz789",
  "message": "User created successfully. Please verify your email."
}
```

**Implementation:**
```typescript
// Triggered by Firebase Auth onCreate
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    provider: user.providerData[0]?.providerId || 'email',
    emailVerified: user.emailVerified,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    driveConnected: false,
    driveEmail: null,
    driveConnectedAt: null,
    plan: 'free',
    planStartDate: null,
    planEndDate: null,
    appsCount: 0,
    buildsCount: 0,
    storageUsed: 0,
    preferences: {
      emailNotifications: true,
      updateNotifications: true,
      theme: 'auto',
      language: 'en'
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

---

## 2. User Endpoints

### GET `/api/user/profile`

**Purpose:** Get user profile

**Protected:** Yes

**Request:** None (user from auth token)

**Response:**
```json
{
  "uid": "abc123xyz789",
  "email": "user@example.com",
  "displayName": "John Doe",
  "photoURL": "https://...",
  "provider": "google.com",
  "emailVerified": true,
  "driveConnected": true,
  "driveEmail": "user@gmail.com",
  "plan": "free",
  "appsCount": 5,
  "buildsCount": 23,
  "storageUsed": 1258291200,
  "preferences": {
    "emailNotifications": true,
    "updateNotifications": true,
    "theme": "dark",
    "language": "en"
  },
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### PUT `/api/user/profile`

**Purpose:** Update user profile

**Protected:** Yes

**Request:**
```json
{
  "displayName": "Jane Doe",
  "photoURL": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### PUT `/api/user/preferences`

**Purpose:** Update user preferences

**Protected:** Yes

**Request:**
```json
{
  "emailNotifications": false,
  "updateNotifications": true,
  "theme": "dark",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

### DELETE `/api/user/account`

**Purpose:** Delete user account and all data

**Protected:** Yes

**Request:** None

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Implementation Notes:**
- Delete all user's apps
- Delete all user's builds
- Delete Drive tokens
- Delete all Firestore documents
- Delete Firebase Auth user
- Optionally delete files from Google Drive

---

## 3. App Endpoints

### GET `/api/apps`

**Purpose:** List user's apps

**Protected:** Yes

**Query Params:**
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "apps": [
    {
      "id": "app_abc123",
      "userId": "abc123xyz789",
      "name": "My Awesome App",
      "packageId": "com.example.awesome",
      "icon": "https://...",
      "description": "A great mobile app",
      "platforms": ["ios", "android"],
      "totalBuilds": 5,
      "activeUsers": 1234,
      "lastBuildDate": "2025-01-20T14:30:00Z",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

### GET `/api/apps/:appId`

**Purpose:** Get app details

**Protected:** Yes (must be owner)

**Response:**
```json
{
  "id": "app_abc123",
  "userId": "abc123xyz789",
  "name": "My Awesome App",
  "packageId": "com.example.awesome",
  "icon": "https://...",
  "description": "A great mobile app",
  "platforms": ["ios", "android"],
  "channels": {
    "production": {
      "enabled": true,
      "autoUpdate": true,
      "updateStrategy": "background",
      "requireUserConsent": false,
      "minVersion": "1.0.0"
    },
    "staging": { /* ... */ },
    "development": { /* ... */ }
  },
  "totalBuilds": 5,
  "activeUsers": 1234,
  "lastBuildDate": "2025-01-20T14:30:00Z",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### POST `/api/apps`

**Purpose:** Create new app

**Protected:** Yes

**Request:**
```json
{
  "name": "My Awesome App",
  "packageId": "com.example.awesome",
  "description": "A great mobile app",
  "platforms": ["ios", "android"],
  "icon": "https://..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "appId": "app_abc123",
  "message": "App created successfully"
}
```

### PUT `/api/apps/:appId`

**Purpose:** Update app details

**Protected:** Yes (must be owner)

**Request:**
```json
{
  "name": "Updated App Name",
  "description": "Updated description",
  "channels": {
    "production": {
      "enabled": true,
      "autoUpdate": false,
      "updateStrategy": "manual",
      "requireUserConsent": true,
      "minVersion": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "App updated successfully"
}
```

### DELETE `/api/apps/:appId`

**Purpose:** Delete app and all builds

**Protected:** Yes (must be owner)

**Response:**
```json
{
  "success": true,
  "message": "App and all builds deleted successfully"
}
```

---

## 4. Build Endpoints

### GET `/api/builds`

**Purpose:** List user's builds (across all apps)

**Protected:** Yes

**Query Params:**
- `appId` (optional) - Filter by app
- `channel` (optional) - Filter by channel
- `platform` (optional) - Filter by platform
- `limit` (optional, default: 20)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "builds": [
    {
      "id": "build_xyz456",
      "userId": "abc123xyz789",
      "appId": "app_abc123",
      "appName": "My Awesome App",
      "version": "1.0.1",
      "buildNumber": 2,
      "channel": "production",
      "platform": "android",
      "fileName": "app-v1.0.1.zip",
      "fileSize": 31457280,
      "fileType": "zip",
      "checksum": "sha256:a1b2c3d4...",
      "driveFileId": "1a2b3c4d5e6f",
      "driveFileUrl": "https://drive.google.com/...",
      "releaseNotes": "Bug fixes and improvements",
      "status": "active",
      "downloads": 523,
      "uploadedAt": "2025-01-20T14:30:00Z"
    }
  ],
  "total": 23,
  "limit": 20,
  "offset": 0
}
```

### GET `/api/builds/:buildId`

**Purpose:** Get build details

**Protected:** Yes (must be owner)

**Response:**
```json
{
  "id": "build_xyz456",
  "userId": "abc123xyz789",
  "appId": "app_abc123",
  "version": "1.0.1",
  "buildNumber": 2,
  "channel": "production",
  "platform": "android",
  "fileName": "app-v1.0.1.zip",
  "fileSize": 31457280,
  "fileType": "zip",
  "checksum": "sha256:a1b2c3d4e5f6...",
  "driveFileId": "1a2b3c4d5e6f7g8h9i0j",
  "driveFileUrl": "https://drive.google.com/uc?export=download&id=...",
  "releaseNotes": "Bug fixes and performance improvements",
  "releaseType": "patch",
  "status": "active",
  "downloads": 523,
  "installs": 498,
  "uploadedAt": "2025-01-20T14:30:00Z",
  "uploadedBy": "user@example.com"
}
```

### POST `/api/builds/upload`

**Purpose:** Upload new build (metadata only, file already in Storage)

**Protected:** Yes

**Request:**
```json
{
  "appId": "app_abc123",
  "version": "1.0.1",
  "buildNumber": 2,
  "versionCode": 101,
  "bundleVersion": "1.0.1",
  "channel": "production",
  "platform": "android",
  "fileName": "app-v1.0.1.zip",
  "fileSize": 31457280,
  "fileType": "zip",
  "checksum": "sha256:a1b2c3d4e5f6...",
  "releaseNotes": "Bug fixes and improvements",
  "releaseType": "patch",
  "storageFilePath": "temp/uploads/abc123xyz789/file123.zip"
}
```

**Response:**
```json
{
  "success": true,
  "buildId": "build_xyz456",
  "message": "Build uploaded successfully",
  "driveFileId": "1a2b3c4d5e6f",
  "downloadUrl": "https://drive.google.com/..."
}
```

**Implementation Flow:**
1. Verify user owns the app
2. Download file from Firebase Storage (temp path)
3. Upload to user's Google Drive
4. Create build document in Firestore
5. Delete temp file from Storage
6. Return build ID and Drive URL

### DELETE `/api/builds/:buildId`

**Purpose:** Delete build

**Protected:** Yes (must be owner)

**Response:**
```json
{
  "success": true,
  "message": "Build deleted successfully"
}
```

**Implementation Notes:**
- Delete from Google Drive
- Delete Firestore document
- Update app's totalBuilds count

---

## 5. Google Drive Endpoints

### POST `/api/drive/connect`

**Purpose:** Connect Google Drive (OAuth callback)

**Protected:** Yes

**Request:**
```json
{
  "code": "4/0AfJohXm...",
  "userId": "abc123xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google Drive connected successfully"
}
```

**Implementation:**
- Exchange code for tokens
- Encrypt tokens
- Store in drive_tokens collection
- Update user document

### GET `/api/drive/status`

**Purpose:** Check Drive connection status

**Protected:** Yes

**Response:**
```json
{
  "connected": true,
  "email": "user@gmail.com",
  "connectedAt": "2025-01-15T11:00:00Z",
  "storageUsed": 1258291200
}
```

### POST `/api/drive/disconnect`

**Purpose:** Disconnect Google Drive

**Protected:** Yes

**Response:**
```json
{
  "success": true,
  "message": "Google Drive disconnected successfully"
}
```

**Implementation:**
- Revoke OAuth tokens (optional)
- Delete drive_tokens document
- Update user document

---

## 6. Configuration Endpoints

### GET `/api/config/:appId`

**Purpose:** Generate plugin configuration for app

**Protected:** Yes (must be owner)

**Response:**
```json
{
  "capacitorConfig": {
    "plugins": {
      "NativeUpdate": {
        "serverUrl": "https://api.nativeupdate.com",
        "userId": "abc123xyz789",
        "appId": "app_abc123",
        "autoCheck": true,
        "channel": "production"
      }
    }
  },
  "apiEndpoints": {
    "checkUpdate": "https://api.nativeupdate.com/public/updates/app_abc123",
    "downloadBuild": "https://api.nativeupdate.com/public/download/:buildId"
  }
}
```

### GET `/api/config/:appId/download`

**Purpose:** Download configuration as JSON file

**Protected:** Yes (must be owner)

**Response:** File download (application/json)

---

## 7. Public Endpoints (For End Users' Apps)

### GET `/api/public/updates/:appId`

**Purpose:** Check for updates (called by user's app)

**Protected:** No (public, but requires valid appId)

**Query Params:**
- `channel` (required) - production/staging/development
- `platform` (required) - ios/android/web
- `currentVersion` (required) - Current app version

**Response:**
```json
{
  "updateAvailable": true,
  "latestVersion": "1.0.1",
  "buildNumber": 2,
  "downloadUrl": "https://drive.google.com/uc?export=download&id=...",
  "fileSize": 31457280,
  "checksum": "sha256:a1b2c3d4e5f6...",
  "releaseNotes": "Bug fixes and improvements",
  "releaseType": "patch",
  "mandatory": false
}
```

**Response (No Update):**
```json
{
  "updateAvailable": false,
  "currentVersion": "1.0.1"
}
```

**Implementation:**
1. Find app by appId
2. Query builds for channel + platform
3. Get latest version
4. Compare with currentVersion (semver)
5. Return update info if available

### GET `/api/public/download/:buildId`

**Purpose:** Download build (proxy to Google Drive)

**Protected:** No (public)

**Response:** Redirect to Google Drive download URL or proxy download

**Implementation:**
1. Find build by buildId
2. Get driveFileUrl
3. Increment downloads count
4. Redirect to Drive URL or stream file

---

## 🛡️ Error Handling

### Standard Error Response

```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional info"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Codes

```typescript
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DRIVE_NOT_CONNECTED = 'DRIVE_NOT_CONNECTED',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  DUPLICATE_APP = 'DUPLICATE_APP',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

---

## 📊 Rate Limiting

### Limits
- **Public endpoints:** 100 requests/minute per IP
- **Authenticated endpoints:** 1000 requests/minute per user
- **Upload endpoint:** 10 uploads/hour per user

### Implementation
```typescript
import rateLimit from 'express-rate-limit';

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP'
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.user?.uid || req.ip
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?.uid
});
```

---

## ✅ Implementation Checklist

### Setup
- [ ] Initialize Firebase Functions project
- [ ] Install dependencies (express, firebase-admin, googleapis, etc.)
- [ ] Configure TypeScript
- [ ] Setup environment variables
- [ ] Configure CORS

### Middleware
- [ ] Create auth middleware
- [ ] Create validation middleware
- [ ] Create error handler
- [ ] Create rate limiters

### Services
- [ ] Implement DriveService
- [ ] Implement BuildService
- [ ] Implement ConfigService
- [ ] Implement AnalyticsService

### Endpoints
- [ ] Implement user endpoints (3)
- [ ] Implement app endpoints (5)
- [ ] Implement build endpoints (4)
- [ ] Implement drive endpoints (3)
- [ ] Implement config endpoints (2)
- [ ] Implement public endpoints (2)

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Test with Postman/Insomnia

### Deployment
- [ ] Deploy to Firebase (dev environment)
- [ ] Test in dev
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Setup alerts

---

**Plan Status:** ✅ Complete and ready for implementation
**Total Endpoints:** 19 endpoints
**Estimated Time:** 15-20 hours
