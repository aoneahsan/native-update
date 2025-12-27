# Task 2: SaaS Platform Architecture

**Created:** 2025-12-27
**Status:** 📝 Planning
**Estimated Time:** 40-60 hours (full transformation)

---

## 🎯 Vision

Transform the native-update marketing website from a static information site into a **full SaaS platform** where users can:

1. **Sign up and log in** to manage their update infrastructure
2. **Connect their Google Drive** account for build storage
3. **Upload app builds** (APK, IPA, web bundles) from the dashboard
4. **Generate configuration** to integrate updates into their app
5. **Manage multiple apps** and update channels from one dashboard

**End Goal:** Users get a complete OTA update backend without setting up their own infrastructure.

---

## 🏗️ High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Marketing Website                       │
│  (React 19 + RadixUI + Tailwind + Firebase + Router)       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Public    │  │     Auth     │  │    Dashboard    │  │
│  │   Pages     │  │    Pages     │  │     Pages       │  │
│  │             │  │              │  │  (Protected)    │  │
│  │ - Home      │  │ - Login      │  │ - Overview      │  │
│  │ - Features  │  │ - Signup     │  │ - Builds        │  │
│  │ - Pricing   │  │ - Reset PW   │  │ - Upload        │  │
│  │ - Docs      │  │              │  │ - Config        │  │
│  │ - About     │  │              │  │ - Settings      │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐                │
│  │   Authentication │  │    Firestore    │                │
│  │                  │  │                 │                │
│  │ - Email/Password │  │ - users         │                │
│  │ - Google OAuth   │  │ - builds        │                │
│  │ - Email Verify   │  │ - apps          │                │
│  │ - Password Reset │  │ - drive_tokens  │                │
│  └──────────────────┘  └─────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐                │
│  │ Cloud Functions  │  │   Storage       │                │
│  │                  │  │                 │                │
│  │ - API Endpoints  │  │ - Temp files    │                │
│  │ - Drive Upload   │  │ - User uploads  │                │
│  │ - Config Gen     │  │                 │                │
│  └──────────────────┘  └─────────────────┘                │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Drive API                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User's Personal Google Drive                               │
│  ├── NativeUpdate/                                         │
│  │   ├── app-1/                                           │
│  │   │   ├── production/                                  │
│  │   │   │   ├── build-1.0.0.zip                         │
│  │   │   │   └── build-1.0.1.zip                         │
│  │   │   └── staging/                                     │
│  │   └── app-2/                                           │
│  │       └── production/                                  │
│  │           └── build-2.0.0.zip                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

### User Journey

1. **Landing Page** → Click "Get Started" or "Dashboard"
2. **Login/Signup Choice** → Email/password or Google OAuth
3. **Email Verification** (if email/password) → Confirm email
4. **Dashboard** → Access protected features

### Authentication States

```typescript
type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'loading' }
  | { status: 'authenticated', user: User }
  | { status: 'email-not-verified', user: User };
```

### Protected Routes

```typescript
const routes = [
  // Public
  { path: '/', public: true },
  { path: '/features', public: true },
  { path: '/pricing', public: true },

  // Auth
  { path: '/login', public: true, authOnly: false },
  { path: '/signup', public: true, authOnly: false },

  // Protected
  { path: '/dashboard', protected: true },
  { path: '/dashboard/builds', protected: true },
  { path: '/dashboard/upload', protected: true },
  { path: '/dashboard/config', protected: true },
  { path: '/dashboard/settings', protected: true },
];
```

---

## 💾 Data Architecture

### Firestore Collections

**1. `users` Collection**
```typescript
interface User {
  uid: string;                      // Firebase Auth UID
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;

  // Google Drive
  driveConnected: boolean;
  driveEmail: string | null;

  // Subscription (future)
  plan: 'free' | 'pro' | 'enterprise';

  // Settings
  preferences: {
    emailNotifications: boolean;
    updateNotifications: boolean;
  };
}
```

**2. `apps` Collection**
```typescript
interface App {
  id: string;                       // Auto-generated
  userId: string;                   // Owner
  name: string;                     // App name
  packageId: string;                // com.example.app
  platform: 'ios' | 'android' | 'web' | 'all';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Update channels
  channels: {
    production: ChannelConfig;
    staging: ChannelConfig;
    development: ChannelConfig;
  };
}

interface ChannelConfig {
  enabled: boolean;
  autoUpdate: boolean;
  requireUserConsent: boolean;
}
```

**3. `builds` Collection**
```typescript
interface Build {
  id: string;                       // Auto-generated
  userId: string;
  appId: string;

  // Build info
  version: string;                  // Semantic version
  buildNumber: number;
  channel: 'production' | 'staging' | 'development';
  platform: 'ios' | 'android' | 'web';

  // File info
  fileName: string;
  fileSize: number;                 // Bytes
  fileType: string;                 // .zip, .apk, .ipa
  checksum: string;                 // SHA-256

  // Google Drive
  driveFileId: string;              // Google Drive file ID
  driveFileUrl: string;             // Direct download URL

  // Metadata
  releaseNotes: string;
  uploadedAt: Timestamp;
  uploadedBy: string;               // User email

  // Status
  status: 'uploading' | 'active' | 'archived' | 'failed';
}
```

**4. `drive_tokens` Collection** (Encrypted)
```typescript
interface DriveToken {
  userId: string;                   // Document ID
  accessToken: string;              // Encrypted
  refreshToken: string;             // Encrypted
  expiresAt: Timestamp;
  scope: string[];
  updatedAt: Timestamp;
}
```

**5. `analytics` Collection** (Future)
```typescript
interface AnalyticsEvent {
  userId: string;
  appId: string;
  buildId: string;
  eventType: 'download' | 'install' | 'rollback' | 'error';
  timestamp: Timestamp;
  metadata: Record<string, any>;
}
```

### Security Rules

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

    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }

    // Apps collection
    match /apps/{appId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Builds collection
    match /builds/{buildId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update, delete: if isOwner(resource.data.userId);
    }

    // Drive tokens (encrypted, very restricted)
    match /drive_tokens/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

---

## 🔌 API Endpoints (Firebase Functions)

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/reset-password` - Send reset email
- `POST /api/auth/verify-email` - Send verification email

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `DELETE /api/user/account` - Delete account

### App Endpoints
- `GET /api/apps` - List user's apps
- `POST /api/apps` - Create new app
- `GET /api/apps/:appId` - Get app details
- `PUT /api/apps/:appId` - Update app
- `DELETE /api/apps/:appId` - Delete app

### Build Endpoints
- `GET /api/builds` - List user's builds
- `GET /api/builds/:buildId` - Get build details
- `POST /api/builds/upload` - Upload new build
- `DELETE /api/builds/:buildId` - Delete build

### Google Drive Endpoints
- `POST /api/drive/connect` - Initiate OAuth flow
- `POST /api/drive/callback` - Handle OAuth callback
- `GET /api/drive/status` - Check connection status
- `POST /api/drive/upload` - Upload file to Drive
- `DELETE /api/drive/disconnect` - Revoke Drive access

### Configuration Endpoints
- `GET /api/config/:appId` - Generate app configuration
- `GET /api/config/:appId/download` - Download config JSON

### Public Endpoints (For End Users' Apps)
- `GET /api/public/check-update/:appId/:channel` - Check for updates
- `GET /api/public/download/:buildId` - Download build (proxy from Drive)

---

## 🎨 UI/UX Flow

### Page Structure

```
Website Root
├── Public Pages (/)
│   ├── Home
│   ├── Features
│   ├── Pricing
│   ├── Examples
│   ├── Docs
│   ├── About
│   └── Contact
│
├── Auth Pages (/auth/)
│   ├── Login
│   ├── Signup
│   ├── Reset Password
│   └── Verify Email
│
└── Dashboard (/dashboard/)
    ├── Overview (default)
    ├── Apps
    │   ├── List all apps
    │   ├── Create new app
    │   └── App details/:appId
    │       ├── Builds list
    │       ├── Configuration
    │       └── Settings
    ├── Builds
    │   ├── All builds (across all apps)
    │   └── Upload new build
    ├── Google Drive
    │   ├── Connection status
    │   └── Connect/disconnect
    ├── Configuration
    │   └── Generate config for each app
    └── Settings
        ├── Profile
        ├── Preferences
        └── Account deletion
```

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  Header (sticky)                                           │
│  Logo | Dashboard | [User Profile ▼] | [Logout]           │
└────────────────────────────────────────────────────────────┘
┌──────────────┬─────────────────────────────────────────────┐
│              │                                             │
│  Sidebar     │           Main Content Area                │
│  (nav)       │                                             │
│              │  ┌─────────────────────────────────────┐   │
│ ○ Overview   │  │                                     │   │
│ ○ Apps       │  │       Page-specific content         │   │
│ ○ Builds     │  │                                     │   │
│ ○ Upload     │  │                                     │   │
│ ○ Drive      │  │                                     │   │
│ ○ Config     │  └─────────────────────────────────────┘   │
│ ○ Settings   │                                             │
│              │                                             │
│              │                                             │
│              │                                             │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

---

## 🔄 User Workflows

### Workflow 1: New User Onboarding

1. **Visit website** → See marketing pages
2. **Click "Get Started"** → Redirect to /signup
3. **Fill signup form** → Email + password
4. **Receive verification email** → Click link
5. **Email verified** → Redirect to /dashboard
6. **See onboarding guide** → "Connect Google Drive first"
7. **Connect Google Drive** → OAuth flow
8. **Create first app** → Fill app details
9. **Upload first build** → Upload file
10. **Get configuration** → Copy config to use in app

### Workflow 2: Upload New Build

1. **Login to dashboard** → /dashboard
2. **Navigate to Upload** → /dashboard/upload
3. **Select app** → Dropdown with user's apps
4. **Choose channel** → Production/Staging/Development
5. **Fill build details** → Version, release notes
6. **Select file** → Drag & drop or file picker
7. **Upload** → Progress bar shows upload status
8. **Upload to Drive** → Backend uploads to user's Drive
9. **Save metadata** → Firestore stores build info
10. **Confirmation** → Build ready for distribution

### Workflow 3: Configure App for Updates

1. **Navigate to Configuration** → /dashboard/config
2. **Select app** → Choose from list
3. **View generated config** → Display JSON with syntax highlighting
4. **Copy config** → One-click copy button
5. **Follow integration guide** → Step-by-step instructions
6. **Test in app** → User integrates into their app
7. **Verify update works** → App checks for updates successfully

---

## 🔒 Security Considerations

### Data Protection
- **Firebase Auth** handles password security (bcrypt)
- **Google Drive tokens** encrypted before storing in Firestore
- **HTTPS only** for all communications
- **CORS** properly configured for frontend
- **Rate limiting** on API endpoints

### Access Control
- **User can only access their own data** (Firestore rules enforce)
- **Google Drive files** stored in user's personal Drive (full control)
- **No shared storage** between users
- **Token refresh** handled automatically

### Privacy
- **No access to user's Drive** beyond NativeUpdate folder
- **User can disconnect Drive** anytime (revokes tokens)
- **Account deletion** removes all data (GDPR compliant)
- **Privacy policy** updated to reflect Drive usage

---

## 📊 Scalability & Performance

### Expected Load
- **Free tier**: 100-1000 users (MVP)
- **Average file size**: 10-50 MB per build
- **Uploads per user**: 5-20 per month
- **API requests**: 100-500 per user per month

### Optimization Strategies
- **Chunked uploads** for large files (>10MB)
- **Firebase Storage** for temporary staging (before Drive upload)
- **Lazy loading** in dashboard (paginate builds list)
- **Caching** of configuration (CDN distribution)
- **Firestore indexes** for efficient queries

### Cost Estimates (Firebase Free Tier)
- **Authentication**: 10k/month free ✅
- **Firestore**: 50k reads/20k writes/day free ✅
- **Storage**: 5GB free ✅
- **Cloud Functions**: 2M invocations/month free ✅
- **Google Drive API**: Free (user's quota) ✅

**Expected to stay within free tier for MVP**

---

## 🧪 Testing Strategy

### Unit Tests
- Firebase Functions (API endpoints)
- React components (UI)
- Utility functions (config generation)

### Integration Tests
- Auth flow (signup → login → logout)
- Drive integration (connect → upload → disconnect)
- Build upload (file → metadata → Drive)

### E2E Tests
- Complete user journey (signup → create app → upload → configure)
- Error scenarios (network failures, invalid files)
- Cross-browser testing (Chrome, Safari, Firefox)

### Manual Testing
- Mobile responsiveness
- File upload with various sizes
- Google Drive folder structure
- Configuration accuracy

---

## 📅 Implementation Timeline

### Phase 1: Foundation (Week 1)
- Setup Firebase project
- Configure authentication
- Create database schema
- Implement security rules

### Phase 2: Authentication (Week 2)
- Build login/signup pages
- Implement auth context
- Add protected routes
- Email verification

### Phase 3: Dashboard (Week 3)
- Create dashboard layout
- Build overview page
- Build apps management
- Navigation components

### Phase 4: Google Drive (Week 4)
- Setup Google Cloud project
- Implement OAuth flow
- Build Drive service
- Test file uploads

### Phase 5: Build Upload (Week 5)
- Create upload UI
- Implement chunked upload
- Save to Drive
- Store metadata

### Phase 6: Configuration (Week 6)
- Build config generator
- Create config UI
- Add download option
- Integration guide

### Phase 7: Testing & Polish (Week 7)
- Bug fixes
- UI polish
- Documentation
- Deployment

**Total: ~7 weeks for full implementation**

---

## ✅ Success Criteria

- [ ] Users can sign up and log in
- [ ] Email verification works
- [ ] Google Drive connects successfully
- [ ] Files upload to user's Drive (not shared storage)
- [ ] Builds metadata stored in Firestore
- [ ] Configuration generates correctly
- [ ] Dashboard is fully functional
- [ ] Mobile responsive
- [ ] Zero security vulnerabilities
- [ ] Privacy policy updated
- [ ] Documentation complete

---

**Plan Status:** ✅ Complete and ready for detailed sub-plans
**Next Steps:** Create detailed plans for each subsystem
