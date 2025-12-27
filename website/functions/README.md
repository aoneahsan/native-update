# Firebase Functions Backend for Native Update Website

Complete Firebase Functions backend providing RESTful API for the Native Update website dashboard.

## Directory Structure

```
functions/
├── src/
│   ├── index.ts              # Main entry, exports all functions
│   ├── middleware/
│   │   ├── auth.ts           # Firebase auth middleware
│   │   └── validation.ts     # Request validation middleware
│   ├── routes/
│   │   ├── apps.ts           # App CRUD endpoints
│   │   ├── builds.ts         # Build CRUD endpoints
│   │   └── users.ts          # User management endpoints
│   ├── utils/
│   │   ├── errors.ts         # Error handling utilities
│   │   └── validators.ts     # Zod validation schemas
│   ├── config/
│   │   └── firebase.ts       # Firebase Admin SDK initialization
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── package.json
├── tsconfig.json
└── .eslintrc.cjs
```

## API Endpoints

### Apps (`/apps`)
- `POST /apps` - Create new app
- `GET /apps` - List user's apps
- `GET /apps/:appId` - Get specific app
- `PUT /apps/:appId` - Update app
- `DELETE /apps/:appId` - Delete app + all builds

### Builds (`/builds`)
- `POST /builds` - Create build record
- `GET /builds` - List builds with filters (appId, platform, channel, limit)
- `GET /builds/:buildId` - Get specific build
- `DELETE /builds/:buildId` - Delete build

### Users (`/users`)
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `DELETE /users/account` - Delete account + all data

### Health
- `GET /health` - Health check endpoint

## Features

### Authentication
- Firebase ID token verification via `Authorization: Bearer <token>` header
- Automatic user extraction and attachment to request object
- Proper error handling for expired/invalid tokens

### Error Handling
- Custom `AppError` class for consistent error responses
- Comprehensive error codes (400, 401, 403, 404, 500)
- Detailed validation error messages
- Stack trace capture for debugging

### Validation
- Zod schemas for request validation
- Input sanitization
- Type-safe validation with TypeScript
- Semantic version validation
- Platform and channel validation

### Security
- Resource ownership checks (users can only access their own data)
- Input validation on all endpoints
- CORS configuration for allowed origins
- Firebase Admin SDK for secure authentication

### Data Management
- Cascading deletes (app deletion removes all builds)
- Account deletion removes all user data
- Batch operations for efficiency
- Proper timestamp handling

## Environment Configuration

### Required Environment Variables
No environment variables required - uses Firebase default credentials in Cloud Functions environment.

### CORS Allowed Origins
- `http://localhost:5900` (development)
- `https://native-update.web.app` (production)
- `https://native-update.firebaseapp.com` (production)

## Development Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Watch mode for development
pnpm run watch

# Run local emulator
pnpm run serve

# Deploy to Firebase
pnpm deploy

# View logs
pnpm logs

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## Firebase Collections

### `apps`
```typescript
{
  appId: string;          // Unique app identifier
  name: string;           // App display name
  description?: string;   // App description
  bundleId: string;       // Bundle/package identifier
  platforms: string[];    // ['ios', 'android']
  userId: string;         // Owner user ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `builds`
```typescript
{
  buildId: string;        // Auto-generated ID
  appId: string;          // Parent app ID
  version: string;        // Semver version (e.g., "1.0.0")
  buildNumber: number;    // Incremental build number
  platform: string;       // 'ios' or 'android'
  bundleUrl: string;      // Download URL
  checksumSha256: string; // SHA-256 checksum (64 chars)
  size: number;           // File size in bytes
  userId: string;         // Owner user ID
  channel?: string;       // Update channel (default: 'production')
  releaseNotes?: string;  // Release notes
  createdAt: Timestamp;
}
```

### `users`
```typescript
{
  uid: string;            // Firebase user ID
  email?: string;         // User email
  displayName?: string;   // Display name
  photoURL?: string;      // Profile photo URL
  organization?: string;  // Organization name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid auth token
- `FORBIDDEN` (403) - User doesn't have access to resource
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid input data
- `INTERNAL_ERROR` (500) - Server error

## Request/Response Examples

### Create App
```bash
POST /apps
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "appId": "my-app",
  "name": "My App",
  "description": "My awesome app",
  "bundleId": "com.example.myapp",
  "platforms": ["ios", "android"]
}

Response (201):
{
  "success": true,
  "app": {
    "appId": "my-app",
    "name": "My App",
    "description": "My awesome app",
    "bundleId": "com.example.myapp",
    "platforms": ["ios", "android"],
    "userId": "user123",
    "createdAt": "2025-12-27T10:00:00.000Z",
    "updatedAt": "2025-12-27T10:00:00.000Z"
  }
}
```

### Create Build
```bash
POST /builds
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "appId": "my-app",
  "version": "1.0.0",
  "buildNumber": 1,
  "platform": "ios",
  "bundleUrl": "https://storage.example.com/bundle.zip",
  "checksumSha256": "abc123...",
  "size": 5242880,
  "channel": "production",
  "releaseNotes": "Initial release"
}

Response (201):
{
  "success": true,
  "build": {
    "buildId": "build123",
    "appId": "my-app",
    "version": "1.0.0",
    "buildNumber": 1,
    "platform": "ios",
    "bundleUrl": "https://storage.example.com/bundle.zip",
    "checksumSha256": "abc123...",
    "size": 5242880,
    "userId": "user123",
    "channel": "production",
    "releaseNotes": "Initial release",
    "createdAt": "2025-12-27T10:00:00.000Z"
  }
}
```

## Deployment

1. Ensure Firebase CLI is installed: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Build the functions: `pnpm build`
4. Deploy: `pnpm deploy`

## Testing

Use the local Firebase emulator for testing:

```bash
pnpm run serve
```

This will start the functions emulator at `http://localhost:5001`

## Production Considerations

- Functions are configured with:
  - Region: `us-central1`
  - Max instances: 10
  - Timeout: 60 seconds
  - Memory: 256MB
  - CORS: enabled

- All timestamps use server timestamps for consistency
- Batch operations for deleting multiple documents
- Proper error logging with console.error

## Author

Ahsan Mahmood <aoneahsan@gmail.com>
