import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { DriveToken } from '@/types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string | null;
  webContentLink: string | null;
  parents?: string[];
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  driveFileUrl: string;
  downloadUrl: string;
  size: number;
  mimeType: string;
  checksum: string;
  folderId: string;
}

export interface DriveAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
  email: string | null;
}

export interface DriveFolderStructure {
  rootFolderId: string;
  appFolderId: string;
  channelFolderId: string;
}

export interface DriveConnectionStatus {
  connected: boolean;
  email: string | null;
  connectedAt: Date | null;
  expiresAt: Date | null;
}

interface GapiAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

interface GapiFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  md5Checksum?: string;
}

interface GapiFileListResponse {
  files: GapiFile[];
  nextPageToken?: string;
}

interface GapiFileResponse {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
  md5Checksum: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Scopes: drive.file for Drive access, userinfo.email for getting user's email
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const ROOT_FOLDER_NAME = 'Native Update Builds';

class GoogleDriveService {
  private gapiLoaded = false;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;

  async initializeGoogleDrive(): Promise<void> {
    if (this.gapiLoaded) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID not configured in environment variables');
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.gapiLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
      };

      document.body.appendChild(script);
    });
  }

  async connectDrive(userId: string): Promise<DriveAuthResult> {
    await this.initializeGoogleDrive();

    return new Promise((resolve, reject) => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        prompt: 'consent',
        callback: async (response: GapiAuthResponse) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          try {
            const expiresAt = new Date(Date.now() + response.expires_in * 1000);
            const scopes = response.scope.split(' ');

            const userInfo = await this.getUserInfo(response.access_token);

            // Store comprehensive drive token and user info in Firestore
            await setDoc(doc(db, 'drive_tokens', userId), {
              userId,
              accessToken: response.access_token,
              refreshToken: '', // Implicit flow doesn't provide refresh token
              tokenType: response.token_type,
              scope: scopes,
              expiresAt,
              // Google account info from the connected Drive account
              googleAccountEmail: userInfo.email,
              googleAccountName: userInfo.name,
              googleAccountPicture: userInfo.picture,
              googleAccountId: userInfo.googleId,
              googleAccountLocale: userInfo.locale,
              // Security metadata
              encryptionMethod: 'client-side-implicit-flow',
              iv: '',
              authTag: '',
              // Timestamps
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            // Update user document with Drive connection status
            await updateDoc(doc(db, 'users', userId), {
              driveConnected: true,
              driveEmail: userInfo.email,
              driveName: userInfo.name,
              drivePicture: userInfo.picture,
              driveGoogleId: userInfo.googleId,
              driveConnectedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            resolve({
              accessToken: response.access_token,
              refreshToken: '',
              expiresAt,
              scope: scopes,
              email: userInfo.email,
            });
          } catch (error) {
            reject(error);
          }
        },
      });

      this.tokenClient.requestAccessToken();
    });
  }

  async disconnectDrive(userId: string): Promise<void> {
    const tokenDoc = await getDoc(doc(db, 'drive_tokens', userId));

    if (tokenDoc.exists()) {
      const tokenData = tokenDoc.data() as DriveToken;

      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.accessToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (error) {
        console.warn('Failed to revoke token with Google:', error);
      }

      await deleteDoc(doc(db, 'drive_tokens', userId));
    }

    await updateDoc(doc(db, 'users', userId), {
      driveConnected: false,
      driveEmail: null,
      driveName: null,
      drivePicture: null,
      driveGoogleId: null,
      driveConnectedAt: null,
      updatedAt: serverTimestamp(),
    });
  }

  async refreshTokens(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPES,
          prompt: '',
          callback: async (response: GapiAuthResponse) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }

            try {
              const expiresAt = new Date(Date.now() + response.expires_in * 1000);

              await updateDoc(doc(db, 'drive_tokens', userId), {
                accessToken: response.access_token,
                expiresAt,
                updatedAt: serverTimestamp(),
              });

              resolve(response.access_token);
            } catch (error) {
              reject(error);
            }
          },
        });
      }

      this.tokenClient.requestAccessToken();
    });
  }

  async getConnectionStatus(userId: string): Promise<DriveConnectionStatus> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const tokenDoc = await getDoc(doc(db, 'drive_tokens', userId));

    if (!userDoc.exists() || !tokenDoc.exists()) {
      return {
        connected: false,
        email: null,
        connectedAt: null,
        expiresAt: null,
      };
    }

    const userData = userDoc.data();
    const tokenData = tokenDoc.data() as DriveToken;

    return {
      connected: userData.driveConnected || false,
      email: userData.driveEmail || null,
      connectedAt: userData.driveConnectedAt?.toDate() || null,
      expiresAt: tokenData.expiresAt?.toDate() || null,
    };
  }

  async uploadFile(
    userId: string,
    file: File,
    appId: string,
    channel: 'production' | 'staging' | 'development',
    metadata: {
      version: string;
      buildNumber: number;
      releaseNotes?: string;
    }
  ): Promise<DriveUploadResult> {
    const accessToken = await this.getValidAccessToken(userId);
    const folderStructure = await this.ensureFolderStructure(userId, appId, channel, accessToken);

    const fileName = `${metadata.version}-build-${metadata.buildNumber}.zip`;
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileMetadata = {
      name: fileName,
      mimeType: file.type || 'application/zip',
      parents: [folderStructure.channelFolderId],
      description: metadata.releaseNotes || `Build ${metadata.version} (${metadata.buildNumber})`,
    };

    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type || 'application/zip' });

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(fileMetadata) +
      delimiter +
      `Content-Type: ${file.type || 'application/zip'}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      (await this.blobToBase64(fileBlob)) +
      closeDelimiter;

    const response = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,md5Checksum`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Drive upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const uploadedFile = (await response.json()) as GapiFileResponse;

    await this.makeFilePublic(uploadedFile.id, accessToken);

    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${uploadedFile.id}`;

    return {
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      driveFileUrl: uploadedFile.webViewLink,
      downloadUrl: directDownloadUrl,
      size: parseInt(uploadedFile.size, 10),
      mimeType: file.type || 'application/zip',
      checksum: uploadedFile.md5Checksum,
      folderId: folderStructure.channelFolderId,
    };
  }

  async createFolder(userId: string, name: string, parentId?: string): Promise<DriveFile> {
    const accessToken = await this.getValidAccessToken(userId);

    const folderMetadata = {
      name,
      mimeType: FOLDER_MIME_TYPE,
      ...(parentId && { parents: [parentId] }),
    };

    const response = await fetch(`${DRIVE_API_BASE}/files?fields=id,name,mimeType,createdTime,modifiedTime,webViewLink`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create folder: ${errorData.error?.message || response.statusText}`);
    }

    const folder = (await response.json()) as GapiFile;

    return {
      id: folder.id,
      name: folder.name,
      mimeType: folder.mimeType,
      size: 0,
      createdTime: folder.createdTime,
      modifiedTime: folder.modifiedTime,
      webViewLink: folder.webViewLink || null,
      webContentLink: null,
      parents: folder.parents,
    };
  }

  async listFiles(userId: string, folderId?: string): Promise<DriveFile[]> {
    const accessToken = await this.getValidAccessToken(userId);

    let query = 'trashed=false';
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to list files: ${errorData.error?.message || response.statusText}`);
    }

    const data = (await response.json()) as GapiFileListResponse;

    return data.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || '0', 10),
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || null,
      webContentLink: file.webContentLink || null,
      parents: file.parents,
    }));
  }

  async deleteFile(userId: string, fileId: string): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json();
      throw new Error(`Failed to delete file: ${errorData.error?.message || response.statusText}`);
    }
  }

  async getFileMetadata(userId: string, fileId: string): Promise<DriveFile> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get file metadata: ${errorData.error?.message || response.statusText}`);
    }

    const file = (await response.json()) as GapiFile;

    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: parseInt(file.size || '0', 10),
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || null,
      webContentLink: file.webContentLink || null,
      parents: file.parents,
    };
  }

  async generateShareLink(userId: string, fileId: string): Promise<string> {
    const accessToken = await this.getValidAccessToken(userId);

    await this.makeFilePublic(fileId, accessToken);

    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  private async ensureFolderStructure(
    userId: string,
    appId: string,
    channel: string,
    accessToken: string
  ): Promise<DriveFolderStructure> {
    let rootFolder = await this.findFolder(ROOT_FOLDER_NAME, undefined, accessToken);
    if (!rootFolder) {
      const createdRoot = await this.createFolder(userId, ROOT_FOLDER_NAME);
      rootFolder = { id: createdRoot.id, name: createdRoot.name };
    }

    let appFolder = await this.findFolder(appId, rootFolder.id, accessToken);
    if (!appFolder) {
      const createdApp = await this.createFolder(userId, appId, rootFolder.id);
      appFolder = { id: createdApp.id, name: createdApp.name };
    }

    let channelFolder = await this.findFolder(channel, appFolder.id, accessToken);
    if (!channelFolder) {
      const createdChannel = await this.createFolder(userId, channel, appFolder.id);
      channelFolder = { id: createdChannel.id, name: createdChannel.name };
    }

    return {
      rootFolderId: rootFolder.id,
      appFolderId: appFolder.id,
      channelFolderId: channelFolder.id,
    };
  }

  private async findFolder(name: string, parentId: string | undefined, accessToken: string): Promise<{ id: string; name: string } | null> {
    const query = [
      `name='${name}'`,
      `mimeType='${FOLDER_MIME_TYPE}'`,
      'trashed=false',
      parentId ? `'${parentId}' in parents` : '',
    ]
      .filter(Boolean)
      .join(' and ');

    const response = await fetch(`${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GapiFileListResponse;

    return data.files.length > 0 ? { id: data.files[0].id, name: data.files[0].name } : null;
  }

  private async makeFilePublic(fileId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to make file public: ${errorData.error?.message || response.statusText}`);
    }
  }

  private async getValidAccessToken(userId: string): Promise<string> {
    const tokenDoc = await getDoc(doc(db, 'drive_tokens', userId));

    if (!tokenDoc.exists()) {
      throw new Error('Google Drive not connected. Please connect your Drive account first.');
    }

    const tokenData = tokenDoc.data() as DriveToken;
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();

    if (now >= expiresAt) {
      return await this.refreshTokens(userId);
    }

    return tokenData.accessToken;
  }

  private async getUserInfo(accessToken: string): Promise<{
    email: string;
    name: string | null;
    picture: string | null;
    googleId: string;
    locale: string | null;
  }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to get user info:', response.status, errorText);
      throw new Error(`Failed to get user info from Google: ${response.status}`);
    }

    const data = await response.json();
    return {
      email: data.email || '',
      name: data.name || null,
      picture: data.picture || null,
      googleId: data.id || '',
      locale: data.locale || null,
    };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const googleDriveService = new GoogleDriveService();
