# Basic Usage Examples

This guide demonstrates basic usage patterns for the Capacitor Native Update plugin.

## Installation

```bash
yarn add native-update
npx cap sync
```

## Simple Live Update Check

```typescript
import { NativeUpdate } from 'native-update';

// Check for updates on app startup
async function checkForUpdates() {
  try {
    const result = await NativeUpdate.sync({
      updateUrl: 'https://your-update-server.com/api/check'
    });
    
    if (result.status === 'UPDATE_AVAILABLE') {
      console.log(`Update available: ${result.bundle?.version}`);
      // Update will be downloaded and installed automatically
    } else if (result.status === 'UPDATE_INSTALLED') {
      // Reload the app to apply the update
      await NativeUpdate.reload();
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

async function downloadAndInstall(version: string) {
  // Download a specific version
  const download = await NativeUpdate.download({
    version: version
  });
  
  // Set the downloaded bundle as active
  await NativeUpdate.set({
    version: download.version,
    checksum: download.checksum
  });
  
  // Reload the app with new bundle
  await NativeUpdate.reload();
}
```

## Basic App Store Update Check

```typescript
// Check if a native app update is available
async function checkAppStoreUpdate() {
  const result = await NativeUpdate.getAppUpdateInfo();
  
  if (result.updateAvailable) {
    // Show update prompt to user
    const shouldUpdate = confirm(
      `Version ${result.availableVersion} is available. Update now?`
    );
    
    if (shouldUpdate) {
      // Open app store for update
      await NativeUpdate.openAppStore();
    }
  }
}
```

## Simple App Review Request

```typescript
// Request app review after positive user action
async function requestReview() {
  try {
    const result = await NativeUpdate.requestReview();
    
    if (result.displayed) {
      console.log('Review dialog was shown');
      // Track that review was requested
    }
  } catch (error) {
    console.error('Could not request review:', error);
  }
}

// Example: Request review after successful task completion
async function onTaskCompleted() {
  // Your task logic here
  
  // Check if it's a good time to ask for review
  const completedTasks = getCompletedTaskCount();
  if (completedTasks === 5) {
    await requestReview();
  }
}
```

## Configuration Options

```typescript
// Option 1: Direct configuration (auto-initializes if not already initialized)
await NativeUpdate.configure({
  config: {
    // Live update settings
    autoUpdate: true,
    updateCheckInterval: 3600000, // 1 hour
    updateChannel: 'production',
    
    // Security settings
    enableSignatureVerification: true,
    publicKey: 'your-public-key',
    
    // App review settings
    minimumDaysSinceInstall: 3,
    minimumDaysSinceLastPrompt: 30
  }
});

// Option 2: Explicit initialization (if you need more control)
await NativeUpdate.initialize({
  config: {
    autoUpdate: true,
    updateChannel: 'production'
  }
});

// Later, you can update configuration
await NativeUpdate.configure({
  config: {
    updateChannel: 'staging',
    autoUpdate: false
  }
});
```

## Error Handling

```typescript
// Comprehensive error handling
async function safeUpdateCheck() {
  try {
    const result = await NativeUpdate.sync({
      updateUrl: 'https://your-update-server.com/api/check'
    });
    
    if (result.status === 'UPDATE_AVAILABLE' || result.status === 'UPDATE_INSTALLED') {
      await handleUpdate(result);
    }
  } catch (error) {
    if (error.code === 'NETWORK_ERROR') {
      console.log('No internet connection');
    } else if (error.code === 'INVALID_RESPONSE') {
      console.error('Invalid server response');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

## Event Listeners

```typescript
// Set up event listeners
function setupUpdateListeners() {
  // Update state changes
  NativeUpdate.addListener('updateStateChanged', (event) => {
    console.log('Update state:', event.status);
    if (event.status === 'READY') {
      // Update has been applied successfully
      console.log('Update ready to use');
    }
  });
  
  // Download progress
  NativeUpdate.addListener('downloadProgress', (progress) => {
    console.log(`Download progress: ${progress.percent}%`);
    console.log(`Speed: ${progress.bytesPerSecond} bytes/s`);
  });
  
  // Background update notifications
  NativeUpdate.addListener('backgroundUpdateNotification', (event) => {
    if (event.updateAvailable) {
      console.log(`Background update available: ${event.version}`);
    }
  });
}

// Clean up listeners when done
function cleanup() {
  NativeUpdate.removeAllListeners();
}
```

## Next Steps

- See [Advanced Scenarios](./advanced-scenarios.md) for more complex use cases
- Read the [Live Update API Reference](../api/live-update-api.md) for complete live update methods
- Read the [App Update API Reference](../api/app-update-api.md) for native update methods
- Read the [App Review API Reference](../api/app-review-api.md) for review request methods