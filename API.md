# Capacitor Native Update - API Reference

This document provides a complete API reference for the Capacitor Native Update plugin.

## Table of Contents

- [Configuration](#configuration)
- [Live Update API](#live-update-api)
- [App Update API](#app-update-api)
- [App Review API](#app-review-api)
- [Security API](#security-api)
- [Types and Interfaces](#types-and-interfaces)
- [Error Codes](#error-codes)
- [Security Best Practices](#security-best-practices)

## Configuration

### configure(config: UpdateConfig): Promise<void>

Configure the plugin with your settings.

```typescript
await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://your-update-server.com', // HTTPS required
    channel: 'production',
    autoUpdate: true,
    publicKey: 'your-public-key', // For signature verification
    requireSignature: true, // Enforce signature verification
    maxBundleSize: 50 * 1024 * 1024, // 50MB limit
    checksumAlgorithm: 'SHA-256', // Required checksum validation
  },
  appUpdate: {
    minimumVersion: '1.0.0',
    updatePriority: 3,
    allowDowngrade: false, // Prevent version downgrade attacks
  },
  appReview: {
    minimumDaysSinceInstall: 7,
    minimumLaunchCount: 3,
  },
  security: {
    enforceHttps: true,
    certificatePinning: {
      enabled: true,
      certificates: ['sha256/...'], // Pin update server certificates
    },
  },
});
```

## Live Update API

### sync(options?: SyncOptions): Promise<SyncResult>

Synchronize with the update server and apply updates if available.

```typescript
const result = await CapacitorNativeUpdate.sync({
  channel: 'production',
  updateMode: 'background',
});

console.log(result.status); // 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'UPDATE_INSTALLED' | 'ERROR'
```

### download(options: DownloadOptions): Promise<BundleInfo>

Download a specific bundle version.

```typescript
const bundle = await CapacitorNativeUpdate.download({
  url: 'https://updates.example.com/bundle-v2.0.0.zip', // HTTPS enforced
  version: '2.0.0',
  checksum: 'sha256:...', // Required for integrity verification
  signature: 'base64...', // Required if signature verification enabled
  maxRetries: 3,
  timeout: 30000, // 30 second timeout
});
```

### set(bundle: BundleInfo): Promise<void>

Set the active bundle to a specific downloaded version.

```typescript
await CapacitorNativeUpdate.set({
  bundleId: 'bundle-123',
  version: '2.0.0',
  path: '/path/to/bundle',
});
```

### reload(): Promise<void>

Reload the app with the currently active bundle.

```typescript
await CapacitorNativeUpdate.reload();
```

### reset(): Promise<void>

Reset to the original bundle shipped with the app.

```typescript
await CapacitorNativeUpdate.reset();
```

### current(): Promise<BundleInfo>

Get information about the currently active bundle.

```typescript
const currentBundle = await CapacitorNativeUpdate.current();
console.log(currentBundle.version);
```

### list(): Promise<BundleInfo[]>

List all downloaded bundles.

```typescript
const bundles = await CapacitorNativeUpdate.list();
bundles.forEach((bundle) => {
  console.log(`${bundle.version} - ${bundle.downloadTime}`);
});
```

### delete(options: DeleteOptions): Promise<void>

Delete a specific bundle or clean up old bundles.

```typescript
// Delete specific bundle
await CapacitorNativeUpdate.delete({ bundleId: 'bundle-123' });

// Clean up old bundles
await CapacitorNativeUpdate.delete({
  keepVersions: 2,
  olderThan: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### notifyAppReady(): Promise<void>

Notify that the app has successfully started with the new bundle.

```typescript
// Call this after your app has successfully initialized
await CapacitorNativeUpdate.notifyAppReady();
```

### getLatest(): Promise<LatestVersion>

Check for the latest available version without downloading.

```typescript
const latest = await CapacitorNativeUpdate.getLatest();
if (latest.available) {
  console.log(`New version ${latest.version} available`);
}
```

### setChannel(channel: string): Promise<void>

Switch to a different update channel.

```typescript
await CapacitorNativeUpdate.setChannel('beta');
```

### setUpdateUrl(url: string): Promise<void>

Change the update server URL.

```typescript
await CapacitorNativeUpdate.setUpdateUrl('https://new-server.com/updates');
```

## App Update API

### getAppUpdateInfo(): Promise<AppUpdateInfo>

Check for native app updates in the app store.

```typescript
const updateInfo = await CapacitorNativeUpdate.getAppUpdateInfo();
if (updateInfo.updateAvailable) {
  console.log(`Version ${updateInfo.availableVersion} is available`);
}
```

### performImmediateUpdate(): Promise<void>

Start an immediate (blocking) update from the app store.

```typescript
try {
  await CapacitorNativeUpdate.performImmediateUpdate();
  // App will restart after update
} catch (error) {
  if (error.code === 'UPDATE_CANCELLED') {
    // User cancelled the update
  }
}
```

### startFlexibleUpdate(): Promise<void>

Start a flexible (background) update from the app store.

```typescript
await CapacitorNativeUpdate.startFlexibleUpdate();
// Update downloads in background
```

### completeFlexibleUpdate(): Promise<void>

Complete a flexible update that has finished downloading.

```typescript
await CapacitorNativeUpdate.completeFlexibleUpdate();
// App will restart
```

### openAppStore(options?: OpenAppStoreOptions): Promise<void>

Open the app store page for the app.

```typescript
await CapacitorNativeUpdate.openAppStore({
  appId: 'com.example.app', // Optional, uses current app ID if not provided
});
```

## App Review API

### requestReview(): Promise<ReviewResult>

Request an in-app review from the user.

```typescript
const result = await CapacitorNativeUpdate.requestReview();
if (result.shown) {
  console.log('Review dialog was shown');
}
```

### canRequestReview(): Promise<CanRequestReviewResult>

Check if it's appropriate to request a review.

```typescript
const canRequest = await CapacitorNativeUpdate.canRequestReview();
if (canRequest.allowed) {
  await CapacitorNativeUpdate.requestReview();
} else {
  console.log(`Cannot request: ${canRequest.reason}`);
}
```

## Types and Interfaces

### UpdateConfig

```typescript
interface UpdateConfig {
  liveUpdate?: LiveUpdateConfig;
  appUpdate?: AppUpdateConfig;
  appReview?: AppReviewConfig;
  security?: SecurityConfig;
}

interface LiveUpdateConfig {
  appId: string;
  serverUrl: string; // Must be HTTPS
  channel?: string;
  autoUpdate?: boolean;
  updateStrategy?: 'immediate' | 'background' | 'manual';
  publicKey?: string; // Base64 encoded public key for signature verification
  requireSignature?: boolean; // Default: true
  checksumAlgorithm?: 'SHA-256' | 'SHA-512'; // Default: 'SHA-256'
  checkInterval?: number;
  allowEmulator?: boolean; // Default: false for production
  mandatoryInstallMode?: InstallMode;
  optionalInstallMode?: InstallMode;
  maxBundleSize?: number; // Maximum allowed bundle size in bytes
  allowedHosts?: string[]; // Whitelist of allowed update servers
}

interface AppUpdateConfig {
  minimumVersion?: string;
  updatePriority?: number;
  storeUrl?: {
    android?: string;
    ios?: string;
  };
  checkOnAppStart?: boolean;
  allowDowngrade?: boolean; // Default: false
}

interface AppReviewConfig {
  minimumDaysSinceInstall?: number;
  minimumDaysSinceLastPrompt?: number;
  minimumLaunchCount?: number;
  customTriggers?: string[];

interface SecurityConfig {
  enforceHttps?: boolean; // Default: true
  certificatePinning?: {
    enabled: boolean;
    certificates: string[]; // SHA256 fingerprints
    includeSubdomains?: boolean;
    maxAge?: number; // Pin duration in seconds
  };
  validateInputs?: boolean; // Default: true
  secureStorage?: boolean; // Default: true
  logSecurityEvents?: boolean; // Default: true in debug
}
  debugMode?: boolean;
}
```

### SyncResult

```typescript
interface SyncResult {
  status: 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'UPDATE_INSTALLED' | 'ERROR';
  version?: string;
  description?: string;
  mandatory?: boolean;
  error?: UpdateError;
}
```

### BundleInfo

```typescript
interface BundleInfo {
  bundleId: string;
  version: string;
  path: string; // Sanitized path within app sandbox
  downloadTime: number;
  size: number;
  status: 'PENDING' | 'DOWNLOADING' | 'READY' | 'ACTIVE' | 'FAILED';
  checksum: string; // SHA-256 checksum of the bundle
  signature?: string; // Digital signature if available
  verified: boolean; // Indicates if bundle passed all security checks
  metadata?: Record<string, any>;
}
```

### AppUpdateInfo

```typescript
interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  updatePriority?: number;
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  clientVersionStalenessDays?: number;
  installStatus?: InstallStatus;
  bytesDownloaded?: number;
  totalBytesToDownload?: number;
}
```

### ReviewResult

```typescript
interface ReviewResult {
  shown: boolean;
  error?: string;
}
```

## Error Codes

The plugin uses standard error codes for different failure scenarios:

### Live Update Errors

- `NETWORK_ERROR` - Network connection failed
- `SERVER_ERROR` - Update server returned an error
- `DOWNLOAD_ERROR` - Bundle download failed
- `VERIFICATION_ERROR` - Bundle signature verification failed
- `CHECKSUM_ERROR` - Bundle checksum validation failed
- `STORAGE_ERROR` - Insufficient storage or write error
- `INSTALL_ERROR` - Bundle installation failed
- `ROLLBACK_ERROR` - Rollback operation failed
- `INSECURE_URL` - Attempted to use non-HTTPS URL
- `INVALID_CERTIFICATE` - Certificate pinning validation failed
- `SIZE_LIMIT_EXCEEDED` - Bundle exceeds maximum allowed size
- `PERMISSION_DENIED` - Required permission not granted
- `PATH_TRAVERSAL` - Attempted directory traversal detected

### App Update Errors

- `UPDATE_NOT_AVAILABLE` - No update available in app store
- `UPDATE_IN_PROGRESS` - Another update is already in progress
- `UPDATE_CANCELLED` - User cancelled the update
- `PLATFORM_NOT_SUPPORTED` - Feature not supported on this platform

### App Review Errors

- `REVIEW_NOT_SUPPORTED` - In-app reviews not supported
- `QUOTA_EXCEEDED` - Review request quota exceeded
- `CONDITIONS_NOT_MET` - Review conditions not satisfied

## Events

The plugin emits events for update progress and state changes:

```typescript
// Listen for download progress
CapacitorNativeUpdate.addListener('downloadProgress', (progress) => {
  console.log(`Downloaded ${progress.percent}%`);
});

// Listen for update state changes
CapacitorNativeUpdate.addListener('updateStateChanged', (state) => {
  console.log(`Update state: ${state.status}`);
});

// Remove listeners when done
CapacitorNativeUpdate.removeAllListeners();
```

## Security API

### validateUpdate(options: ValidateOptions): Promise<ValidationResult>

Validate an update bundle before installation.

```typescript
const validation = await CapacitorNativeUpdate.validateUpdate({
  bundlePath: '/path/to/bundle',
  checksum: 'sha256:...',
  signature: 'base64...',
  maxSize: 50 * 1024 * 1024,
});

if (!validation.isValid) {
  console.error(`Validation failed: ${validation.error}`);
}
```

### getSecurityInfo(): Promise<SecurityInfo>

Get current security configuration and status.

```typescript
const security = await CapacitorNativeUpdate.getSecurityInfo();
console.log(`HTTPS enforced: ${security.enforceHttps}`);
console.log(`Certificate pinning: ${security.certificatePinning.enabled}`);
```

## Platform-Specific Notes

### iOS

- App updates require manual version checking against iTunes API
- In-app reviews use StoreKit framework
- Maximum 3 review requests per year per user
- Uses Keychain Services for secure storage
- File operations validated within app sandbox

### Android

- App updates use Google Play Core Library
- Requires Play Store app to be installed
- In-app reviews use Play Core Review API
- Uses Android Keystore for secure storage
- Runtime permissions required for storage access

### Web

- Live updates work through service worker updates
- App updates and reviews show fallback UI
- Limited functionality compared to native platforms
- Uses Web Crypto API for security features

## Security Best Practices

### Secure Configuration Example

```typescript
// Recommended security configuration
await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://updates.example.com', // Always use HTTPS
    publicKey: process.env.UPDATE_PUBLIC_KEY, // Never hardcode keys
    requireSignature: true,
    checksumAlgorithm: 'SHA-256',
    maxBundleSize: 50 * 1024 * 1024,
    allowedHosts: ['updates.example.com'], // Whitelist update servers
    allowEmulator: false, // Disable in production
  },
  security: {
    enforceHttps: true,
    certificatePinning: {
      enabled: true,
      certificates: [process.env.UPDATE_CERT_PIN],
    },
    validateInputs: true,
    secureStorage: true,
  },
});
```

### Input Validation

Always validate user inputs and options:

```typescript
// Good: Validate before use
try {
  if (!isValidUrl(updateUrl) || !updateUrl.startsWith('https://')) {
    throw new Error('Invalid update URL');
  }

  await CapacitorNativeUpdate.download({
    url: updateUrl,
    checksum: checksum,
    signature: signature,
  });
} catch (error) {
  // Handle validation error
}
```

### Error Handling

Handle errors without exposing sensitive information:

````typescript
try {
  await CapacitorNativeUpdate.sync();
} catch (error) {
  // Don't expose internal paths or server details
  if (error.code === 'VERIFICATION_ERROR') {
    console.error('Update verification failed');
    // Log detailed error internally, show generic message to user
  }
}
```## Support

For questions, issues, or contributions:
- Email: aoneahsan@gmail.com
- GitHub Issues: [https://github.com/aoneahsan/capacitor-native-update/issues](https://github.com/aoneahsan/capacitor-native-update/issues)
- Author: Ahsan Mahmood ([Portfolio](https://aoneahsan.com))
````
