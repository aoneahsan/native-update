# Live Updates (OTA)

> **⚠️ Backend Infrastructure Required**
>
> Live Updates require a complete backend infrastructure that you must build:
> - **Update Server**: Host and serve update bundles
> - **Bundle Generation**: CI/CD pipeline to create and sign bundles
> - **Version Management**: Track versions, channels, and rollbacks
> - **Security Infrastructure**: Implement signing and verification
> - **CDN/Storage**: Distribute bundles globally
>
> This plugin provides the client-side implementation only. Without the backend, Live Updates will not function.

Live Updates, also known as Over-The-Air (OTA) updates, allow you to deploy JavaScript, HTML, and CSS changes to your app instantly without going through app store review processes. This feature is perfect for bug fixes, content updates, and minor feature additions.

## How Live Updates Work

1. **Bundle Creation**: Your web assets are packaged into a bundle with metadata
2. **Version Check**: The app checks for new versions on your update server
3. **Download**: New bundles are downloaded in the background
4. **Verification**: Checksums and signatures are validated for security
5. **Installation**: The update is applied based on your configured strategy
6. **Activation**: The app reloads with the new bundle

## Key Features

### 🚀 Instant Deployment

- Deploy updates within minutes
- No app store review delays
- Fix critical bugs immediately

### 🔒 Secure Updates

- Cryptographic signature verification
- Checksum validation
- HTTPS enforcement
- Certificate pinning support

### 📦 Smart Bundle Management

- Automatic cleanup of old bundles
- Storage usage optimization
- Version history tracking
- Rollback capabilities

### 🎯 Targeted Deployments

- Multiple update channels
- Gradual rollouts
- A/B testing support
- User segmentation

## Implementation Guide

### Basic Implementation

```typescript
// 1. Configure live updates
await NativeUpdate.configure({
  liveUpdate: {
    appId: 'com.myapp.example',
    serverUrl: 'https://updates.myserver.com',
    autoUpdate: true,
  },
});

// 2. Sync updates (automatic with autoUpdate: true)
const result = await NativeUpdate.LiveUpdate.sync();

// 3. Handle the result
switch (result.status) {
  case 'UPDATE_INSTALLED':
    console.log('Update installed:', result.bundle.version);
    break;
  case 'UP_TO_DATE':
    console.log('App is up to date');
    break;
}
```

### Advanced Implementation

```typescript
class LiveUpdateManager {
  private updateAvailable = false;

  async initialize() {
    // Configure with advanced options
    await NativeUpdate.configure({
      liveUpdate: {
        appId: 'com.myapp.example',
        serverUrl: 'https://updates.myserver.com',
        channel: this.getUpdateChannel(),
        updateStrategy: 'BACKGROUND',
        publicKey: this.getPublicKey(),
        requireSignature: true,
        checksumAlgorithm: 'SHA-512',
      },
    });

    // Set up listeners
    this.setupUpdateListeners();

    // Initial check
    await this.checkForUpdates();
  }

  private setupUpdateListeners() {
    // Download progress
    NativeUpdate.LiveUpdate.addListener(
      'downloadProgress',
      (progress) => {
        this.updateDownloadProgress(progress.percent);
      }
    );

    // State changes
    NativeUpdate.LiveUpdate.addListener(
      'updateStateChanged',
      (event) => {
        this.handleStateChange(event);
      }
    );
  }

  async checkForUpdates() {
    try {
      const latest = await NativeUpdate.LiveUpdate.getLatest();
      const current = await NativeUpdate.LiveUpdate.current();

      if (this.isNewerVersion(latest.version, current.version)) {
        this.updateAvailable = true;
        this.notifyUpdateAvailable(latest);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  async downloadUpdate() {
    if (!this.updateAvailable) return;

    try {
      const bundle = await NativeUpdate.LiveUpdate.download({
        version: 'latest',
        onProgress: (progress) => {
          console.log(`Download: ${progress.percent}%`);
        },
      });

      // Validate the bundle
      const validation = await NativeUpdate.LiveUpdate.validateUpdate({
        bundleId: bundle.bundleId,
      });

      if (validation.valid) {
        await this.installUpdate(bundle);
      } else {
        throw new Error('Bundle validation failed');
      }
    } catch (error) {
      this.handleUpdateError(error);
    }
  }

  async installUpdate(bundle: BundleInfo) {
    // Set the bundle as active
    await NativeUpdate.LiveUpdate.set(bundle);

    // Notify app is ready (important for rollback mechanism)
    await NativeUpdate.LiveUpdate.notifyAppReady();

    // Schedule reload based on user preference
    this.scheduleReload();
  }

  private scheduleReload() {
    // Option 1: Immediate reload
    // await NativeUpdate.LiveUpdate.reload();

    // Option 2: Reload on next app resume
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        NativeUpdate.LiveUpdate.reload();
      }
    });

    // Option 3: User-triggered reload
    this.showUpdateReadyDialog();
  }
}
```

## Update Strategies

### Immediate Updates

Updates are downloaded and applied immediately when detected.

```typescript
{
  updateStrategy: 'IMMEDIATE',
  mandatoryInstallMode: 'IMMEDIATE'
}
```

**Use when:**

- Critical bug fixes
- Security patches
- Time-sensitive content

### Background Updates

Updates download in the background and install based on install mode.

```typescript
{
  updateStrategy: 'BACKGROUND',
  mandatoryInstallMode: 'ON_NEXT_RESTART',
  optionalInstallMode: 'ON_NEXT_RESUME'
}
```

**Use when:**

- Regular feature updates
- Non-critical improvements
- Large bundle sizes

### Manual Updates

Full control over download and installation timing.

```typescript
{
  updateStrategy: 'MANUAL',
  autoUpdate: false
}
```

**Use when:**

- User-initiated updates
- Specific update windows
- Custom update UI

## Version Management

### Semantic Versioning

The plugin uses semantic versioning (MAJOR.MINOR.PATCH):

```typescript
// Version comparison
const current = await NativeUpdate.LiveUpdate.current();
console.log(current.version); // "1.2.3"

// Check if update is major/minor/patch
function getUpdateType(oldVersion: string, newVersion: string) {
  const [oldMajor, oldMinor, oldPatch] = oldVersion.split('.').map(Number);
  const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

  if (newMajor > oldMajor) return 'major';
  if (newMinor > oldMinor) return 'minor';
  if (newPatch > oldPatch) return 'patch';
  return 'none';
}
```

### Bundle History

```typescript
// List all downloaded bundles
const bundles = await NativeUpdate.LiveUpdate.list();

bundles.forEach((bundle) => {
  console.log(`Version: ${bundle.version}`);
  console.log(`Downloaded: ${new Date(bundle.downloadTime)}`);
  console.log(`Size: ${bundle.size} bytes`);
  console.log(`Status: ${bundle.status}`);
});

// Clean up old bundles
await NativeUpdate.LiveUpdate.delete({
  keepNewest: 3, // Keep only 3 most recent bundles
});
```

## Rollback Mechanism

The plugin includes automatic rollback for failed updates.

### Automatic Rollback

```typescript
// Mark app as ready after successful startup
async function onAppReady() {
  try {
    // Verify app is working correctly
    await performHealthCheck();

    // Notify that app started successfully
    await NativeUpdate.LiveUpdate.notifyAppReady();
  } catch (error) {
    // Don't call notifyAppReady() - automatic rollback will occur
    console.error('App startup failed:', error);
  }
}
```

### Manual Rollback

```typescript
// Reset to original bundle
await NativeUpdate.LiveUpdate.reset();

// Or rollback to previous version
const bundles = await NativeUpdate.LiveUpdate.list();
const previousBundle = bundles[bundles.length - 2];
if (previousBundle) {
  await NativeUpdate.LiveUpdate.set(previousBundle);
  await NativeUpdate.LiveUpdate.reload();
}
```

## Update Channels

Use channels to manage different release tracks.

### Channel Configuration

```typescript
// Set channel based on user preference
const channel = getUserPreference('updateChannel') || 'production';
await NativeUpdate.LiveUpdate.setChannel(channel);

// Available channels examples:
// - 'production': Stable releases
// - 'beta': Beta testing
// - 'alpha': Early access
// - 'development': Dev builds
// - 'staging': Pre-production
```

### Channel-Based Features

```typescript
// Enable features based on channel
async function getFeatureFlags() {
  const bundle = await NativeUpdate.LiveUpdate.current();

  switch (bundle.metadata?.channel) {
    case 'alpha':
      return { experimentalFeatures: true, debugMode: true };
    case 'beta':
      return { experimentalFeatures: true, debugMode: false };
    default:
      return { experimentalFeatures: false, debugMode: false };
  }
}
```

## Performance Optimization

### Bundle Size Optimization

1. **Minimize bundle size**:

   ```bash
   # Use production builds
   npm run build -- --mode production

   # Enable compression
   gzip -9 bundle.js
   ```

2. **Implement delta updates** (coming soon):
   ```typescript
   // Future API
   const delta = await NativeUpdate.LiveUpdate.downloadDelta({
     fromVersion: current.version,
     toVersion: latest.version,
   });
   ```

### Download Optimization

```typescript
// Configure optimal download settings
{
  liveUpdate: {
    // Download only on WiFi
    downloadOnWifiOnly: true,

    // Limit concurrent downloads
    maxConcurrentDownloads: 1,

    // Set reasonable timeout
    timeout: 30000,

    // Enable resume capability
    resumableDownloads: true
  }
}
```

### Storage Management

```typescript
// Monitor storage usage
const storage = await NativeUpdate.LiveUpdate.getStorageInfo();
console.log(`Used: ${storage.usedBytes} / ${storage.totalBytes}`);

// Clean up when needed
if (storage.usedBytes > storage.totalBytes * 0.8) {
  await NativeUpdate.LiveUpdate.delete({
    olderThan: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}
```

## Error Handling

### Common Errors and Solutions

```typescript
try {
  await NativeUpdate.LiveUpdate.sync();
} catch (error) {
  switch (error.code) {
    case 'NETWORK_ERROR':
      // No internet connection
      showOfflineMessage();
      break;

    case 'SERVER_ERROR':
      // Update server is down
      scheduleRetry();
      break;

    case 'CHECKSUM_ERROR':
      // Bundle corrupted
      await NativeUpdate.LiveUpdate.delete({
        bundleId: error.bundleId,
      });
      break;

    case 'SIGNATURE_ERROR':
      // Security validation failed
      logSecurityEvent(error);
      break;

    case 'STORAGE_ERROR':
      // Not enough space
      await cleanupStorage();
      break;

    case 'VERSION_MISMATCH':
      // Incompatible update
      promptForAppUpdate();
      break;
  }
}
```

### Retry Logic

```typescript
class UpdateRetryManager {
  private retryCount = 0;
  private maxRetries = 3;

  async syncWithRetry() {
    try {
      await NativeUpdate.LiveUpdate.sync();
      this.retryCount = 0; // Reset on success
    } catch (error) {
      if (this.shouldRetry(error)) {
        this.retryCount++;
        const delay = this.getRetryDelay();

        console.log(
          `Retry ${this.retryCount}/${this.maxRetries} in ${delay}ms`
        );

        setTimeout(() => {
          this.syncWithRetry();
        }, delay);
      } else {
        throw error; // Don't retry
      }
    }
  }

  private shouldRetry(error: any): boolean {
    return (
      this.retryCount < this.maxRetries &&
      ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'].includes(error.code)
    );
  }

  private getRetryDelay(): number {
    // Exponential backoff
    return Math.min(1000 * Math.pow(2, this.retryCount), 30000);
  }
}
```

## Testing Live Updates

### Development Testing

```typescript
// Enable development mode
const devConfig = {
  liveUpdate: {
    appId: 'com.myapp.dev',
    serverUrl: 'http://localhost:3000',
    channel: 'development',
    allowEmulator: true,
    requireSignature: false, // Disable in dev
    autoUpdate: false, // Manual control
  },
};

// Force update check
await NativeUpdate.LiveUpdate.sync({ forceCheck: true });

// Simulate different scenarios
await testUpdateScenarios();
```

### Update Server Testing

Set up a local update server for testing:

```bash
# See server-example directory
cd server-example
npm install
npm run dev
```

### Test Scenarios

1. **Successful update**
2. **Network interruption**
3. **Corrupted bundle**
4. **Version rollback**
5. **Storage full**
6. **Signature mismatch**

## Best Practices

### 1. Progressive Rollout

```typescript
// Roll out to percentage of users
function shouldReceiveUpdate(userId: string, percentage: number): boolean {
  const hash = hashCode(userId);
  return hash % 100 < percentage;
}

if (shouldReceiveUpdate(user.id, 10)) {
  // 10% rollout
  await NativeUpdate.LiveUpdate.setChannel('beta');
}
```

### 2. Update Notifications

```typescript
// Notify users about updates
NativeUpdate.LiveUpdate.addListener('updateStateChanged', (event) => {
  if (event.status === 'READY') {
    showNotification({
      title: 'Update Ready',
      body: 'A new version is available. Restart to apply.',
      actions: [
        { id: 'restart', title: 'Restart Now' },
        { id: 'later', title: 'Later' },
      ],
    });
  }
});
```

### 3. Monitoring

```typescript
// Track update metrics
async function trackUpdateMetrics(result: SyncResult) {
  const metrics = {
    event: 'live_update',
    status: result.status,
    version: result.bundle?.version,
    downloadTime: result.downloadTime,
    installTime: result.installTime,
    bundleSize: result.bundle?.size,
  };

  await analytics.track(metrics);
}
```

### 4. Fallback Strategy

```typescript
// Implement fallback for critical features
async function loadFeature(featureName: string) {
  try {
    // Try loading from update bundle
    return await import(`./features/${featureName}`);
  } catch (error) {
    // Fall back to shipped version
    console.warn(`Loading fallback for ${featureName}`);
    return await import(`./features-fallback/${featureName}`);
  }
}
```

## Next Steps

- Set up your [Update Server](../examples/server-setup.md)
- Implement [Security Best Practices](../guides/security-best-practices.md)
- Configure [App Updates](./app-updates.md) for native changes
- Explore [API Reference](../api/live-update-api.md)

---

Made with ❤️ by Ahsan Mahmood
