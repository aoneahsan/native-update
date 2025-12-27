# Task 2: Google Drive Integration Plan

**Created:** 2025-12-27
**Status:** 📝 Planning
**API:** Google Drive API v3

---

## 🎯 Objectives

Integrate Google Drive to:
1. Allow users to connect their personal Google Drive
2. Upload app builds to user's Drive (not shared storage)
3. Organize builds in structured folders
4. Generate shareable download links
5. Manage Drive permissions and tokens securely

---

## 🔑 Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Native Update Platform"
3. Note the Project ID

### Step 2: Enable Google Drive API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public users)
3. Fill in app information:
   - App name: "Native Update"
   - User support email: aoneahsan@gmail.com
   - Developer contact: aoneahsan@gmail.com
4. Add logo (upload Native Update logo)
5. Add scopes:
   - `https://www.googleapis.com/auth/drive.file` (Create and manage files)
6. Add test users (during development)
7. Save and continue

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name: "Native Update Web Client"
5. Authorized JavaScript origins:
   - `http://localhost:5173` (dev)
   - `https://nativeupdate.com` (production)
6. Authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (dev)
   - `https://nativeupdate.com/auth/google/callback` (production)
7. Click **Create**
8. Save **Client ID** and **Client Secret**

### Step 5: Environment Variables

```bash
# .env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret  # Backend only, never expose to client
DRIVE_TOKEN_ENCRYPTION_KEY=generate-32-byte-hex-key  # For encrypting tokens
```

---

## 🏗️ Architecture

### OAuth Flow

```
User clicks "Connect Google Drive"
         ↓
Frontend redirects to Google OAuth
         ↓
User authorizes app (grants Drive access)
         ↓
Google redirects back with auth code
         ↓
Frontend sends code to backend
         ↓
Backend exchanges code for tokens
         ↓
Backend encrypts and stores tokens in Firestore
         ↓
Backend confirms connection
         ↓
User's Drive is now connected
```

### File Upload Flow

```
User uploads build file
         ↓
Frontend uploads to Firebase Storage (temp)
         ↓
Frontend calls backend function
         ↓
Backend retrieves file from Storage
         ↓
Backend decrypts Drive tokens
         ↓
Backend uploads to user's Google Drive
         ↓
Backend creates folder structure if needed
         ↓
Backend gets shareable link
         ↓
Backend saves metadata to Firestore
         ↓
Backend deletes temp file from Storage
         ↓
Upload complete
```

### Folder Structure in User's Drive

```
Google Drive (root)
└── NativeUpdate/
    ├── app-name-1/
    │   ├── production/
    │   │   ├── v1.0.0-build.zip
    │   │   └── v1.0.1-build.zip
    │   ├── staging/
    │   │   └── v1.1.0-beta-build.zip
    │   └── development/
    │       └── v1.2.0-dev-build.zip
    └── app-name-2/
        └── production/
            └── v2.0.0-build.zip
```

---

## 🔌 Backend Implementation (Firebase Functions)

### Drive Service

```typescript
// functions/src/services/drive-service.ts
import { google } from 'googleapis';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.DRIVE_TOKEN_ENCRYPTION_KEY!;

export class DriveService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Encrypt token before storing
  private encryptToken(token: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

    let encrypted = cipher.update(token, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return {
      encrypted: `encrypted:${encrypted}`,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64')
    };
  }

  // Decrypt token when retrieving
  private decryptToken(encrypted: string, iv: string, authTag: string): string {
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

  // Exchange auth code for tokens
  async exchangeCodeForTokens(code: string, userId: string) {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    // Encrypt tokens
    const encryptedAccess = this.encryptToken(tokens.access_token);
    const encryptedRefresh = this.encryptToken(tokens.refresh_token);

    // Store in Firestore
    const db = getFirestore();
    await db.collection('drive_tokens').doc(userId).set({
      userId,
      accessToken: encryptedAccess.encrypted,
      refreshToken: encryptedRefresh.encrypted,
      tokenType: 'Bearer',
      scope: tokens.scope?.split(' ') || [],
      expiresAt: new Date(Date.now() + (tokens.expiry_date || 3600) * 1000),
      encryptionMethod: 'AES-256-GCM',
      iv: encryptedAccess.iv,
      authTag: encryptedAccess.authTag,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update user document
    await db.collection('users').doc(userId).update({
      driveConnected: true,
      driveEmail: tokens.email || null,
      driveConnectedAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true };
  }

  // Get user's Drive tokens (decrypted)
  async getTokens(userId: string) {
    const db = getFirestore();
    const tokenDoc = await db.collection('drive_tokens').doc(userId).get();

    if (!tokenDoc.exists) {
      throw new Error('Drive not connected');
    }

    const data = tokenDoc.data()!;

    // Decrypt tokens
    const accessToken = this.decryptToken(data.accessToken, data.iv, data.authTag);
    const refreshToken = this.decryptToken(data.refreshToken, data.iv, data.authTag);

    // Check if expired and refresh if needed
    if (new Date() >= data.expiresAt.toDate()) {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update with new access token
      const encryptedAccess = this.encryptToken(credentials.access_token!);
      await db.collection('drive_tokens').doc(userId).update({
        accessToken: encryptedAccess.encrypted,
        iv: encryptedAccess.iv,
        authTag: encryptedAccess.authTag,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        updatedAt: new Date()
      });

      return {
        accessToken: credentials.access_token!,
        refreshToken
      };
    }

    return { accessToken, refreshToken };
  }

  // Create folder in Drive
  async createFolder(userId: string, folderName: string, parentFolderId?: string) {
    const { accessToken } = await this.getTokens(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name'
    });

    return response.data;
  }

  // Upload file to Drive
  async uploadFile(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    folderId: string
  ) {
    const { accessToken } = await this.getTokens(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType,
        body: fileBuffer
      },
      fields: 'id, name, webViewLink, webContentLink'
    });

    // Make file accessible via link (anyone with link can view)
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Get shareable download link
    const file = await drive.files.get({
      fileId: response.data.id!,
      fields: 'id, name, webContentLink, size, md5Checksum'
    });

    return {
      fileId: file.data.id!,
      fileName: file.data.name!,
      downloadUrl: file.data.webContentLink!,
      fileSize: file.data.size,
      checksum: file.data.md5Checksum
    };
  }

  // Delete file from Drive
  async deleteFile(userId: string, fileId: string) {
    const { accessToken } = await this.getTokens(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    await drive.files.delete({ fileId });
  }

  // Get or create folder structure
  async ensureFolderStructure(userId: string, appName: string, channel: string) {
    const { accessToken } = await this.getTokens(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    // Find or create NativeUpdate root folder
    let rootFolder = await this.findFolder(drive, 'NativeUpdate');
    if (!rootFolder) {
      rootFolder = await this.createFolder(userId, 'NativeUpdate');
    }

    // Find or create app folder
    let appFolder = await this.findFolder(drive, appName, rootFolder.id!);
    if (!appFolder) {
      appFolder = await this.createFolder(userId, appName, rootFolder.id!);
    }

    // Find or create channel folder
    let channelFolder = await this.findFolder(drive, channel, appFolder.id!);
    if (!channelFolder) {
      channelFolder = await this.createFolder(userId, channel, appFolder.id!);
    }

    return channelFolder.id!;
  }

  // Find folder by name
  private async findFolder(drive: any, name: string, parentId?: string) {
    const query = [
      `name='${name}'`,
      `mimeType='application/vnd.google-apps.folder'`,
      'trashed=false',
      parentId ? `'${parentId}' in parents` : ''
    ].filter(Boolean).join(' and ');

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    return response.data.files[0] || null;
  }

  // Disconnect Drive (revoke tokens)
  async disconnect(userId: string) {
    const db = getFirestore();

    // Delete tokens
    await db.collection('drive_tokens').doc(userId).delete();

    // Update user document
    await db.collection('users').doc(userId).update({
      driveConnected: false,
      driveEmail: null,
      driveConnectedAt: null,
      updatedAt: new Date()
    });
  }
}
```

---

## 💻 Frontend Implementation

### Drive Connection Page

```typescript
// src/pages/dashboard/GoogleDrivePage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function GoogleDrivePage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    // Check if Drive is connected
    const response = await fetch(`/api/drive/status?userId=${user?.uid}`);
    const data = await response.json();
    setConnected(data.connected);
    setDriveEmail(data.email);
  };

  const handleConnect = () => {
    setLoading(true);

    // Build OAuth URL
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/drive.file';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${user?.uid}`;  // Pass userId in state

    // Redirect to Google OAuth
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive?')) return;

    setLoading(true);
    try {
      await fetch('/api/drive/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid })
      });

      setConnected(false);
      setDriveEmail(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Google Drive</h1>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {connected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">✅ Connected</p>
                  <p className="text-sm text-gray-600">Account: {driveEmail}</p>
                </div>
                <Button variant="danger" onClick={handleDisconnect} loading={loading}>
                  Disconnect
                </Button>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  Your builds will be uploaded to your personal Google Drive in the NativeUpdate folder.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Google Drive to store app builds. Your builds will be stored in your personal Drive,
                giving you full control over your data.
              </p>

              <Button onClick={handleConnect} loading={loading}>
                🔵 Connect Google Drive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### OAuth Callback Handler

```typescript
// src/pages/auth/GoogleDriveCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleDriveCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      setStatus('Authorization failed');
      setTimeout(() => navigate('/dashboard/google-drive'), 2000);
      return;
    }

    if (!code || !state) {
      setStatus('Invalid callback');
      setTimeout(() => navigate('/dashboard/google-drive'), 2000);
      return;
    }

    try {
      // Send code to backend
      const response = await fetch('/api/drive/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: state })
      });

      if (response.ok) {
        setStatus('✅ Connected successfully!');
        setTimeout(() => navigate('/dashboard/google-drive'), 1500);
      } else {
        setStatus('❌ Connection failed');
        setTimeout(() => navigate('/dashboard/google-drive'), 2000);
      }
    } catch (err) {
      setStatus('❌ Connection failed');
      setTimeout(() => navigate('/dashboard/google-drive'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{status}</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}
```

---

## ✅ Implementation Checklist

### Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable Google Drive API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials
- [ ] Add authorized redirect URIs
- [ ] Add environment variables

### Backend (Firebase Functions)
- [ ] Install googleapis npm package
- [ ] Create DriveService class
- [ ] Implement token encryption/decryption
- [ ] Implement OAuth code exchange
- [ ] Implement folder creation
- [ ] Implement file upload
- [ ] Implement file deletion
- [ ] Create API endpoints
- [ ] Test with Drive API

### Frontend
- [ ] Create GoogleDrivePage
- [ ] Create OAuth callback page
- [ ] Add "Connect Drive" button
- [ ] Handle OAuth redirect
- [ ] Display connection status
- [ ] Add disconnect functionality
- [ ] Update upload flow to use Drive

### Testing
- [ ] Test OAuth flow
- [ ] Test token encryption/decryption
- [ ] Test folder creation
- [ ] Test file upload to Drive
- [ ] Test shareable link generation
- [ ] Test token refresh
- [ ] Test disconnect flow
- [ ] Test error scenarios

---

**Plan Status:** ✅ Complete and ready for implementation
**Dependencies:** Google Cloud project, Firebase Functions
**Estimated Time:** 12-16 hours
