# Advanced Scenarios

This guide covers complex use cases and advanced patterns for the Capacitor Native Update plugin.

## Delta Updates

Minimize download sizes by only downloading changed files:

```typescript
import { NativeUpdate } from 'native-update';

async function checkForDeltaUpdate() {
  const currentManifest = await NativeUpdate.getCurrentManifest();
  
  const result = await NativeUpdate.checkForUpdate({
    updateUrl: 'https://your-update-server.com/api/check',
    currentVersion: currentManifest.version,
    currentChecksum: currentManifest.checksum,
    supportsDelta: true
  });
  
  if (result.updateAvailable && result.deltaAvailable) {
    console.log(`Delta update available: ${result.deltaSize} bytes`);
    await downloadDeltaUpdate(result.deltaUrl);
  }
}

async function downloadDeltaUpdate(deltaUrl: string) {
  const download = await NativeUpdate.downloadUpdate({
    url: deltaUrl,
    isDelta: true
  });
  
  // Apply delta patch
  await NativeUpdate.applyDelta({
    bundleId: download.bundleId,
    baseVersion: getCurrentVersion()
  });
}
```

## Update Channels

Manage different release tracks:

```typescript
// Configure update channels
enum UpdateChannel {
  PRODUCTION = 'production',
  BETA = 'beta',
  DEVELOPMENT = 'development'
}

async function setupUpdateChannel(channel: UpdateChannel) {
  await NativeUpdate.configure({
    updateChannel: channel,
    updateUrl: `https://updates.example.com/api/${channel}/check`
  });
}

// Switch channels based on user preference
async function switchToBetaChannel() {
  await setupUpdateChannel(UpdateChannel.BETA);
  
  // Check for updates in the new channel
  const result = await NativeUpdate.checkForUpdate({
    currentVersion: await getCurrentVersion()
  });
  
  if (result.updateAvailable) {
    console.log(`Beta update ${result.version} available`);
  }
}
```

## Staged Rollouts

Implement gradual update deployment:

```typescript
async function checkStagedUpdate() {
  const deviceId = await getDeviceId();
  const rolloutPercentage = hashDeviceId(deviceId) % 100;
  
  const result = await NativeUpdate.checkForUpdate({
    updateUrl: 'https://your-update-server.com/api/check',
    currentVersion: '1.0.0',
    metadata: {
      deviceId,
      rolloutGroup: rolloutPercentage
    }
  });
  
  if (result.updateAvailable && result.rolloutPercentage >= rolloutPercentage) {
    // Device is eligible for update
    await downloadAndInstall(result);
  }
}
```

## Background Updates

Download updates in the background without interrupting users:

```typescript
async function setupBackgroundUpdates() {
  // Configure background update behavior
  await NativeUpdate.configure({
    backgroundUpdateMode: 'wifi-only',
    autoInstallMode: 'on-restart'
  });
  
  // Schedule background update checks
  await NativeUpdate.scheduleBackgroundCheck({
    interval: 14400000, // 4 hours
    requiresWifi: true,
    requiresCharging: false
  });
}

// Handle background update events
NativeUpdate.addListener('backgroundUpdateReady', (event) => {
  // Notify user that update is ready
  showUpdateNotification({
    version: event.version,
    releaseNotes: event.releaseNotes
  });
});
```

## Rollback Strategies

Implement automatic rollback on update failures:

```typescript
async function safeUpdate() {
  // Save current version info before update
  const backup = await NativeUpdate.createBackup();
  
  try {
    // Attempt update
    await NativeUpdate.installUpdate({
      bundleId: 'new-update-id',
      validateAfterInstall: true
    });
    
    // Verify update success
    const health = await performHealthCheck();
    if (!health.passed) {
      throw new Error('Health check failed');
    }
    
    // Confirm successful update
    await NativeUpdate.confirmUpdate();
  } catch (error) {
    console.error('Update failed, rolling back:', error);
    
    // Automatic rollback
    await NativeUpdate.rollback({
      backupId: backup.id
    });
    
    // Report failure to analytics
    reportUpdateFailure(error);
  }
}

async function performHealthCheck(): Promise<{ passed: boolean }> {
  // Custom health check logic
  try {
    // Test critical functionality
    await testApiConnection();
    await testDatabaseAccess();
    await testUIComponents();
    
    return { passed: true };
  } catch {
    return { passed: false };
  }
}
```

## Multi-Bundle Management

Handle multiple update bundles for A/B testing:

```typescript
interface ABTestConfig {
  testId: string;
  variants: {
    control: string;
    treatment: string;
  };
}

async function setupABTest(config: ABTestConfig) {
  const variant = await determineVariant(config.testId);
  
  // Download appropriate bundle
  const bundleUrl = variant === 'treatment' 
    ? config.variants.treatment 
    : config.variants.control;
    
  const download = await NativeUpdate.downloadUpdate({
    url: bundleUrl,
    metadata: {
      testId: config.testId,
      variant
    }
  });
  
  // Install with test metadata
  await NativeUpdate.installUpdate({
    bundleId: download.bundleId,
    preserveData: true
  });
}
```

## Custom Update UI

Create sophisticated update experiences:

```typescript
class UpdateManager {
  private updateState: UpdateState = { status: 'idle' };
  
  async checkAndPromptUpdate() {
    // Check for update
    const result = await NativeUpdate.checkForUpdate({
      updateUrl: 'https://your-update-server.com/api/check',
      currentVersion: await this.getCurrentVersion()
    });
    
    if (!result.updateAvailable) return;
    
    // Show custom update dialog
    const userChoice = await this.showUpdateDialog({
      version: result.version,
      releaseNotes: result.releaseNotes,
      size: result.size,
      criticalUpdate: result.priority === 'critical'
    });
    
    if (userChoice === 'update') {
      await this.performUpdate(result);
    } else if (userChoice === 'remind') {
      await this.scheduleReminder();
    }
  }
  
  private async performUpdate(updateInfo: UpdateInfo) {
    this.updateState = { status: 'downloading', progress: 0 };
    
    // Download with progress tracking
    const downloadListener = NativeUpdate.addListener(
      'downloadProgress',
      (progress) => {
        this.updateState = {
          status: 'downloading',
          progress: progress.percent
        };
        this.updateUI();
      }
    );
    
    try {
      const download = await NativeUpdate.downloadUpdate({
        url: updateInfo.downloadUrl
      });
      
      this.updateState = { status: 'installing' };
      this.updateUI();
      
      await NativeUpdate.installUpdate({
        bundleId: download.bundleId
      });
      
      this.updateState = { status: 'ready' };
      await this.promptRestart();
    } finally {
      downloadListener.remove();
    }
  }
}
```

## Security-Enhanced Updates

Implement advanced security measures:

```typescript
async function secureUpdateCheck() {
  // Generate request signature
  const timestamp = Date.now();
  const nonce = generateNonce();
  const signature = await signRequest({
    timestamp,
    nonce,
    version: getCurrentVersion()
  });
  
  const result = await NativeUpdate.checkForUpdate({
    updateUrl: 'https://your-update-server.com/api/check',
    currentVersion: getCurrentVersion(),
    headers: {
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Signature': signature
    },
    certificatePins: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    ]
  });
  
  // Verify response signature
  if (!await verifyUpdateSignature(result)) {
    throw new Error('Invalid update signature');
  }
  
  return result;
}

async function downloadWithIntegrityCheck(url: string, expectedHash: string) {
  const download = await NativeUpdate.downloadUpdate({
    url,
    validateChecksum: true,
    expectedChecksum: expectedHash,
    algorithm: 'sha256'
  });
  
  // Additional verification
  const verified = await NativeUpdate.verifyBundle({
    bundleId: download.bundleId,
    publicKey: await getPublicKey()
  });
  
  if (!verified.valid) {
    throw new Error('Bundle verification failed');
  }
  
  return download;
}
```

## Performance Monitoring

Track update performance and success rates:

```typescript
class UpdateMetrics {
  async trackUpdateCycle() {
    const startTime = Date.now();
    const metrics: UpdateMetrics = {
      checkStarted: startTime,
      downloadStarted: 0,
      downloadCompleted: 0,
      installStarted: 0,
      installCompleted: 0,
      errors: []
    };
    
    try {
      // Check phase
      const result = await NativeUpdate.checkForUpdate({
        updateUrl: 'https://your-update-server.com/api/check',
        currentVersion: getCurrentVersion()
      });
      
      if (!result.updateAvailable) {
        metrics.checkCompleted = Date.now();
        await this.reportMetrics(metrics);
        return;
      }
      
      // Download phase
      metrics.downloadStarted = Date.now();
      const download = await NativeUpdate.downloadUpdate({
        url: result.downloadUrl
      });
      metrics.downloadCompleted = Date.now();
      metrics.downloadSize = download.size;
      
      // Install phase
      metrics.installStarted = Date.now();
      await NativeUpdate.installUpdate({
        bundleId: download.bundleId
      });
      metrics.installCompleted = Date.now();
      
      metrics.success = true;
    } catch (error) {
      metrics.errors.push({
        phase: this.getCurrentPhase(metrics),
        error: error.message,
        timestamp: Date.now()
      });
      metrics.success = false;
    }
    
    await this.reportMetrics(metrics);
  }
}
```

## Next Steps

- Review [Integration Examples](./integration-examples.md) for framework-specific implementations
- See the [API Reference](../api/README.md) for detailed method documentation
- Check [Basic Usage](./basic-usage.md) for simpler examples