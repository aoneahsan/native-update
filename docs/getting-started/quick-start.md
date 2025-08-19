# Quick Start Guide

> **⚠️ IMPORTANT: Backend Infrastructure Required**
>
> This plugin is a **client-side SDK only** and requires significant backend infrastructure to function:
>
> - **Update Server**: You must build and host your own server to manage and serve update bundles
> - **Bundle Generation**: You need a CI/CD pipeline to create, sign, and deploy update bundles
> - **Security Infrastructure**: Implement bundle signing, verification, and secure distribution
> - **Version Management**: Handle versioning, channels, and rollback mechanisms
> - **Analytics & Monitoring**: Track update success rates and handle failures
>
> **This is NOT a complete solution** - it's a foundation that requires substantial additional development. See our [Server Requirements](../server-requirements.md) guide for detailed backend implementation requirements.

Get up and running with Capacitor Native Update in just a few minutes! This guide covers the most common use cases.

## Basic Setup

### 1. Import and Configure

```typescript
import { NativeUpdate } from 'native-update';

// Initialize the plugin with your configuration
async function initializeUpdates() {
  await NativeUpdate.configure({
    config: {
      // Live update settings
      autoUpdate: true,
      updateChannel: 'production',
      updateStrategy: 'IMMEDIATE',
      
      // Security settings
      enableSignatureVerification: true,
      publicKey: 'your-public-key',
      
      // App review settings
      minimumDaysSinceInstall: 7,
      minimumLaunchCount: 3,
    }
  });
}

// Call this when your app starts
initializeUpdates();
```

## Live Updates (OTA)

### Check and Apply Updates Automatically

```typescript
// Sync with server and apply updates if available
async function syncUpdates() {
  try {
    const result = await NativeUpdate.sync();

    if (result.status === 'UPDATE_INSTALLED') {
      console.log('Update installed:', result.bundle.version);
      // Update will be applied based on your updateStrategy
    } else if (result.status === 'UP_TO_DATE') {
      console.log('App is up to date');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

### Manual Update Control

```typescript
// Check for updates without downloading
async function checkForUpdates() {
  const latest = await NativeUpdate.getLatest();
  const current = await NativeUpdate.current();

  if (latest.version !== current.version) {
    console.log(`Update available: ${latest.version}`);
    return true;
  }
  return false;
}

// Download and install update manually
async function downloadAndInstallUpdate() {
  try {
    // Download the latest version
    const bundle = await NativeUpdate.download({
      version: 'latest',
    });

    // Set it as active
    await NativeUpdate.set(bundle);

    // Reload the app to apply
    await NativeUpdate.reload();
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

### Listen for Download Progress

```typescript
// Add download progress listener
const progressListener = await NativeUpdate.addListener(
  'downloadProgress',
  (progress) => {
    console.log(`Download: ${progress.percent}% complete`);
    console.log(`${progress.bytesDownloaded} / ${progress.totalBytes} bytes`);
  }
);

// Remember to remove listener when done
// progressListener.remove();
```

## Native App Updates

### Check for App Store Updates

```typescript
async function checkAppStoreUpdate() {
  try {
    const updateInfo = await NativeUpdate.getAppUpdateInfo();

    if (updateInfo.updateAvailable) {
      console.log(`New version available: ${updateInfo.availableVersion}`);

      if (updateInfo.updatePriority >= 4) {
        // High priority - immediate update
        await NativeUpdate.performImmediateUpdate();
      } else {
        // Optional update
        showUpdateDialog(updateInfo);
      }
    }
  } catch (error) {
    console.error('App update check failed:', error);
  }
}

function showUpdateDialog(updateInfo) {
  // Show your custom update UI
  if (userAcceptsUpdate) {
    NativeUpdate.openAppStore();
  }
}
```

### Flexible Updates (Android)

```typescript
// Start downloading in background
async function startFlexibleUpdate() {
  await NativeUpdate.startFlexibleUpdate();

  // Listen for download completion
  const listener = await NativeUpdate.addListener(
    'appUpdateStateChanged',
    (state) => {
      if (state.status === 'DOWNLOADED') {
        // Prompt user to restart
        showRestartPrompt();
      }
    }
  );
}

// Complete the update
async function completeUpdate() {
  await NativeUpdate.completeFlexibleUpdate();
  // App will restart with new version
}
```

## App Reviews

### Request Review at the Right Time

```typescript
async function requestReviewIfAppropriate() {
  try {
    // Check if we can request a review
    const canRequest = await NativeUpdate.canRequestReview();

    if (canRequest.allowed) {
      // Request the review
      const result = await NativeUpdate.requestReview();

      if (result.shown) {
        console.log('Review dialog was shown');
      }
    } else {
      console.log('Cannot request review:', canRequest.reason);
    }
  } catch (error) {
    console.error('Review request failed:', error);
  }
}

// Call after positive user actions
// e.g., after completing a task, making a purchase, etc.
requestReviewIfAppropriate();
```

## Common Patterns

### Initialize on App Start

```typescript
// In your main app component
import { App } from '@capacitor/app';
import { NativeUpdate } from 'native-update';

App.addListener('appStateChange', async ({ isActive }) => {
  if (isActive) {
    // Check for updates when app becomes active
    await NativeUpdate.sync({
      installMode: 'ON_NEXT_RESUME',
    });
  }
});
```

### Handle Update Lifecycle

```typescript
class UpdateManager {
  async initialize() {
    // Configure plugin
    await NativeUpdate.configure({
      liveUpdate: {
        appId: 'your-app-id',
        serverUrl: 'https://your-server.com',
        autoUpdate: true,
      },
    });

    // Set up listeners
    this.setupListeners();

    // Initial sync
    await this.checkForUpdates();
  }

  setupListeners() {
    // Listen for update state changes
    NativeUpdate.addListener(
      'updateStateChanged',
      (event) => {
        console.log('Update state:', event.status);
        this.handleUpdateState(event);
      }
    );
  }

  async checkForUpdates() {
    try {
      const result = await NativeUpdate.sync();

      if (result.status === 'UPDATE_INSTALLED') {
        // Notify user about update
        this.notifyUpdateInstalled(result.bundle.version);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  handleUpdateState(event) {
    switch (event.status) {
      case 'DOWNLOADING':
        // Show progress indicator
        break;
      case 'READY':
        // Update downloaded, ready to install
        break;
      case 'FAILED':
        // Handle failure
        break;
    }
  }
}
```

### Error Handling Best Practices

```typescript
import { NativeUpdateError } from 'native-update';

async function safeUpdateCheck() {
  try {
    await NativeUpdate.sync();
  } catch (error) {
    if (error instanceof NativeUpdateError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          // Handle network issues
          console.log('No internet connection');
          break;
        case 'SERVER_ERROR':
          // Server issues
          console.log('Update server unavailable');
          break;
        case 'VERIFICATION_ERROR':
          // Security validation failed
          console.log('Update verification failed');
          break;
        default:
          console.error('Update error:', error.message);
      }
    }
  }
}
```

## Testing Your Implementation

### Development Tips

1. **Use staging channel for testing**:

   ```typescript
   await NativeUpdate.setChannel('staging');
   ```

2. **Enable debug mode for app reviews**:

   ```typescript
   await NativeUpdate.configure({
     appReview: {
       debugMode: true, // Bypass time restrictions
     },
   });
   ```

3. **Force update check**:
   ```typescript
   // Clear cache and check
   await NativeUpdate.sync({
     forceCheck: true,
   });
   ```

## Setting Up Backend & Creating Updates

### Quick Backend Setup

Use our CLI to quickly set up a backend:

```bash
# Create an Express.js backend with admin dashboard
npx native-update backend create express --with-admin

# Or create a Firebase Functions backend
npx native-update backend create firebase --with-monitoring

# Start the development server
cd native-update-backend
npm install
npm run dev
```

### Creating and Deploying Updates

1. **Generate signing keys** (see [Key Management Guide](../guides/key-management.md) for details):
   ```bash
   npx native-update keys generate --type rsa --size 4096
   ```
   This creates a private key (keep secret) and public key (add to app config)

2. **Build and create update bundle**:
   ```bash
   npm run build
   npx native-update bundle create ./www --version 1.0.1
   ```

3. **Sign the bundle**:
   ```bash
   npx native-update bundle sign ./update-bundles/bundle-*.zip --key ./keys/private-*.pem
   ```

4. **Upload via admin dashboard or API**

### Development Server

For local testing:
```bash
# Start a local update server
npx native-update server start --port 3000

# Monitor updates in real-time
npx native-update monitor --server http://localhost:3000
```

## Next Steps

Now that you have the basics working:

1. Deploy your backend to production
2. Implement [Security Best Practices](../guides/security-best-practices.md)
3. Configure [Advanced Options](./configuration.md)
4. Explore [API Reference](../api/live-update-api.md) for all available methods
5. See [CLI Reference](../cli-reference.md) for all available commands

## Quick Reference

### Essential Methods

| Method                         | Purpose                         |
| ------------------------------ | ------------------------------- |
| `configure()`                  | Initialize plugin with settings |
| `sync()`                       | Check and apply updates         |
| `current()`                    | Get current bundle info         |
| `getAppUpdateInfo()`           | Check app store updates         |
| `requestReview()`              | Request user review             |

### Key Events

| Event                | Description              |
| -------------------- | ------------------------ |
| `downloadProgress`   | Update download progress |
| `updateStateChanged` | Bundle state changes     |

---

Made with ❤️ by Ahsan Mahmood
