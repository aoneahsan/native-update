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
    const result = await NativeUpdate.checkForUpdate({
      updateUrl: 'https://your-update-server.com/api/check',
      currentVersion: '1.0.0'
    });
    
    if (result.updateAvailable) {
      console.log(`Update available: ${result.version}`);
      // Download and install the update
      await downloadAndInstall(result.downloadUrl);
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

async function downloadAndInstall(downloadUrl: string) {
  // Download the update
  const download = await NativeUpdate.downloadUpdate({
    url: downloadUrl
  });
  
  // Monitor download progress
  NativeUpdate.addListener('downloadProgress', (progress) => {
    console.log(`Download progress: ${progress.percent}%`);
  });
  
  // Install the update
  await NativeUpdate.installUpdate({
    bundleId: download.bundleId
  });
  
  // Reload the app with new bundle
  await NativeUpdate.reloadApp();
}
```

## Basic App Store Update Check

```typescript
// Check if a native app update is available
async function checkAppStoreUpdate() {
  const result = await NativeUpdate.checkAppUpdate();
  
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
// Initialize with custom configuration
NativeUpdate.configure({
  // Live update settings
  autoCheckOnStart: true,
  updateCheckInterval: 3600000, // 1 hour
  updateChannel: 'production',
  
  // Security settings
  enableSignatureVerification: true,
  publicKey: 'your-public-key',
  
  // App review settings
  minimumDaysSinceInstall: 3,
  minimumDaysSinceLastPrompt: 30
});
```

## Error Handling

```typescript
// Comprehensive error handling
async function safeUpdateCheck() {
  try {
    const result = await NativeUpdate.checkForUpdate({
      updateUrl: 'https://your-update-server.com/api/check',
      currentVersion: '1.0.0'
    });
    
    if (result.updateAvailable) {
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
  // Download progress
  NativeUpdate.addListener('downloadProgress', (event) => {
    updateProgressBar(event.percent);
  });
  
  // Update installed
  NativeUpdate.addListener('updateInstalled', (event) => {
    console.log(`Update ${event.version} installed successfully`);
  });
  
  // Update failed
  NativeUpdate.addListener('updateFailed', (event) => {
    console.error(`Update failed: ${event.error}`);
    // Optionally rollback
    NativeUpdate.rollback();
  });
}

// Clean up listeners when done
function cleanup() {
  NativeUpdate.removeAllListeners();
}
```

## Next Steps

- See [Advanced Scenarios](./advanced-scenarios.md) for more complex use cases
- Check [Integration Examples](./integration-examples.md) for framework-specific implementations
- Read the [API Reference](../api/README.md) for complete method documentation