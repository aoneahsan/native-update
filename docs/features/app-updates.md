# App Updates

The App Updates feature provides a seamless way to manage native app store updates, ensuring users always have the latest version of your app with critical native changes, new permissions, or platform-specific features.

## Overview

While Live Updates handle web assets, App Updates manage the native app binary itself. This feature integrates with:

- **Google Play Store** on Android (using Play Core Library)
- **Apple App Store** on iOS (using manual version checking)
- **Web platforms** with fallback notifications

## Key Features

### 🎯 Update Priority Management

- Configure update urgency (0-5 scale)
- Force critical updates
- Flexible update scheduling

### 📱 Native UI Integration

- Platform-specific update dialogs
- In-app download progress
- Seamless installation flow

### 🔄 Update Types

- **Immediate Updates**: Blocking updates for critical fixes
- **Flexible Updates**: Background downloads with user control
- **Manual Updates**: Direct app store navigation

### 📊 Version Intelligence

- Semantic version comparison
- Minimum version enforcement
- Update availability detection

## Implementation Guide

### Basic Implementation

```typescript
// Check for app updates on startup
async function checkForAppUpdates() {
  try {
    const updateInfo = await CapacitorNativeUpdate.AppUpdate.getAppUpdateInfo();

    if (updateInfo.updateAvailable) {
      console.log(`Update available: ${updateInfo.availableVersion}`);

      // Handle based on priority
      if (updateInfo.updatePriority >= 4) {
        // High priority - immediate update
        await CapacitorNativeUpdate.AppUpdate.performImmediateUpdate();
      } else {
        // Optional update - show custom UI
        showUpdateDialog(updateInfo);
      }
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}
```

### Advanced Implementation

```typescript
class AppUpdateManager {
  private updateInfo: AppUpdateInfo | null = null;
  private downloadProgress = 0;

  async initialize() {
    // Configure app updates
    await CapacitorNativeUpdate.configure({
      appUpdate: {
        checkOnAppStart: true,
        minimumVersion: '2.0.0',
        updatePriority: 3,
        storeUrl: {
          android: 'https://play.google.com/store/apps/details?id=com.myapp',
          ios: 'https://apps.apple.com/app/id123456789',
        },
      },
    });

    // Set up listeners
    this.setupUpdateListeners();

    // Check for updates
    await this.checkForUpdates();
  }

  private setupUpdateListeners() {
    // Android flexible update state changes
    CapacitorNativeUpdate.AppUpdate.addListener(
      'flexibleUpdateStateChanged',
      (state) => {
        this.handleFlexibleUpdateState(state);
      }
    );

    // Download progress for flexible updates
    CapacitorNativeUpdate.AppUpdate.addListener(
      'flexibleUpdateProgress',
      (progress) => {
        this.downloadProgress = progress.percent;
        this.updateProgressUI(progress);
      }
    );
  }

  async checkForUpdates() {
    try {
      this.updateInfo =
        await CapacitorNativeUpdate.AppUpdate.getAppUpdateInfo();

      if (!this.updateInfo.updateAvailable) {
        console.log('App is up to date');
        return;
      }

      // Analyze update type needed
      const updateType = this.determineUpdateType(this.updateInfo);

      switch (updateType) {
        case 'IMMEDIATE':
          await this.performImmediateUpdate();
          break;
        case 'FLEXIBLE':
          await this.startFlexibleUpdate();
          break;
        case 'OPTIONAL':
          this.showOptionalUpdateUI();
          break;
      }
    } catch (error) {
      this.handleUpdateError(error);
    }
  }

  private determineUpdateType(info: AppUpdateInfo): string {
    // Force immediate update for critical priority
    if (info.updatePriority === 5) {
      return 'IMMEDIATE';
    }

    // Check if current version is below minimum
    if (this.isVersionBelowMinimum(info.currentVersion, info.minimumVersion)) {
      return 'IMMEDIATE';
    }

    // High priority gets flexible update
    if (info.updatePriority >= 3) {
      return 'FLEXIBLE';
    }

    // Low priority is optional
    return 'OPTIONAL';
  }

  async performImmediateUpdate() {
    try {
      // Show blocking update UI
      this.showImmediateUpdateUI();

      // Start immediate update
      await CapacitorNativeUpdate.AppUpdate.performImmediateUpdate();

      // App will restart automatically after update
    } catch (error) {
      if (error.code === 'UPDATE_CANCELLED') {
        // User cancelled - handle based on requirements
        if (this.updateInfo?.updatePriority === 5) {
          // Critical update - exit app
          App.exitApp();
        }
      }
    }
  }

  async startFlexibleUpdate() {
    try {
      // Start background download
      await CapacitorNativeUpdate.AppUpdate.startFlexibleUpdate();

      // Show download progress UI
      this.showFlexibleUpdateUI();
    } catch (error) {
      this.handleUpdateError(error);
    }
  }

  private handleFlexibleUpdateState(state: FlexibleUpdateState) {
    switch (state.status) {
      case 'PENDING':
        console.log('Update pending');
        break;

      case 'DOWNLOADING':
        console.log('Downloading update...');
        break;

      case 'DOWNLOADED':
        // Update ready to install
        this.showInstallPrompt();
        break;

      case 'INSTALLING':
        console.log('Installing update...');
        break;

      case 'INSTALLED':
        console.log('Update installed successfully');
        break;

      case 'FAILED':
        this.handleUpdateError(new Error(state.error));
        break;
    }
  }

  async completeFlexibleUpdate() {
    try {
      await CapacitorNativeUpdate.AppUpdate.completeFlexibleUpdate();
      // App will restart with new version
    } catch (error) {
      console.error('Failed to complete update:', error);
    }
  }

  private showInstallPrompt() {
    // Show snackbar or dialog
    this.showDialog({
      title: 'Update Ready',
      message: 'An update has been downloaded. Restart to apply?',
      buttons: [
        {
          text: 'Restart',
          handler: () => this.completeFlexibleUpdate(),
        },
        {
          text: 'Later',
          handler: () => {
            // Schedule reminder
            this.scheduleUpdateReminder();
          },
        },
      ],
    });
  }
}
```

## Platform-Specific Behavior

### Android (Google Play)

Android uses the Google Play Core Library for in-app updates:

```typescript
// Android-specific features
const androidUpdate = {
  // Immediate update flow
  immediate: async () => {
    // Blocks UI until update is installed
    await CapacitorNativeUpdate.AppUpdate.performImmediateUpdate();
    // App restarts automatically
  },

  // Flexible update flow
  flexible: async () => {
    // Download in background
    await CapacitorNativeUpdate.AppUpdate.startFlexibleUpdate();

    // Monitor progress
    const listener = await CapacitorNativeUpdate.AppUpdate.addListener(
      'flexibleUpdateProgress',
      (progress) => {
        console.log(
          `Downloaded: ${progress.bytesDownloaded}/${progress.totalBytes}`
        );
      }
    );

    // Complete when ready
    await CapacitorNativeUpdate.AppUpdate.completeFlexibleUpdate();
  },
};
```

### iOS (App Store)

iOS requires manual version checking and App Store redirection:

```typescript
// iOS-specific implementation
const iosUpdate = {
  // Check version manually
  check: async () => {
    const info = await CapacitorNativeUpdate.AppUpdate.getAppUpdateInfo();

    if (info.updateAvailable) {
      // Show custom update dialog
      const shouldUpdate = await showUpdateDialog(info);

      if (shouldUpdate) {
        // Open App Store
        await CapacitorNativeUpdate.AppUpdate.openAppStore();
      }
    }
  },
};
```

### Web Platform

Web platforms show update notifications:

```typescript
// Web fallback
const webUpdate = {
  notify: async () => {
    const info = await CapacitorNativeUpdate.AppUpdate.getAppUpdateInfo();

    if (info.updateAvailable) {
      // Show notification
      new Notification('Update Available', {
        body: `Version ${info.availableVersion} is available`,
        icon: '/icon.png',
        actions: [
          {
            action: 'update',
            title: 'Update Now',
          },
        ],
      });
    }
  },
};
```

## Update Priority Levels

Configure update behavior based on priority:

```typescript
const updatePriorities = {
  0: {
    // Low priority
    name: 'Optional',
    behavior: 'Show notification only',
    userControl: 'full',
  },
  1: {
    // Minor improvements
    name: 'Recommended',
    behavior: 'Show dialog on app start',
    userControl: 'dismissible',
  },
  2: {
    // Important features
    name: 'Important',
    behavior: 'Prompt after key actions',
    userControl: 'postponable',
  },
  3: {
    // Significant changes
    name: 'High',
    behavior: 'Flexible update with reminders',
    userControl: 'limited',
  },
  4: {
    // Critical fixes
    name: 'Critical',
    behavior: 'Immediate update prompt',
    userControl: 'minimal',
  },
  5: {
    // Security updates
    name: 'Mandatory',
    behavior: 'Force immediate update',
    userControl: 'none',
  },
};
```

## Version Management

### Semantic Version Comparison

```typescript
class VersionManager {
  // Compare semantic versions
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  // Check if update is major/minor/patch
  getUpdateType(oldVersion: string, newVersion: string): string {
    const [oldMajor, oldMinor, oldPatch] = oldVersion.split('.').map(Number);
    const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

    if (newMajor > oldMajor) return 'major';
    if (newMinor > oldMinor) return 'minor';
    if (newPatch > oldPatch) return 'patch';
    return 'none';
  }

  // Determine update strategy based on version change
  async determineStrategy(info: AppUpdateInfo) {
    const updateType = this.getUpdateType(
      info.currentVersion,
      info.availableVersion
    );

    switch (updateType) {
      case 'major':
        // Major updates might need immediate update
        return info.updatePriority >= 3 ? 'immediate' : 'flexible';

      case 'minor':
        // Minor updates are usually flexible
        return 'flexible';

      case 'patch':
        // Patches can be optional unless critical
        return info.updatePriority >= 4 ? 'flexible' : 'optional';

      default:
        return 'none';
    }
  }
}
```

### Minimum Version Enforcement

```typescript
// Enforce minimum version requirements
async function enforceMinimumVersion() {
  const config = {
    appUpdate: {
      minimumVersion: '2.0.0',
      forceUpdateBelow: '1.5.0', // Force update for very old versions
    },
  };

  const info = await CapacitorNativeUpdate.AppUpdate.getAppUpdateInfo();

  // Check if current version is below minimum
  if (isVersionBelow(info.currentVersion, config.appUpdate.minimumVersion)) {
    // Force immediate update
    try {
      await CapacitorNativeUpdate.AppUpdate.performImmediateUpdate();
    } catch (error) {
      // If update fails or is cancelled, restrict app usage
      showMinimumVersionRequired();
      disableAppFeatures();
    }
  }
}
```

## Custom Update UI

### Update Dialog Examples

```typescript
// Custom update dialog
class UpdateUI {
  showUpdateDialog(info: AppUpdateInfo) {
    const dialog = {
      title: this.getUpdateTitle(info),
      message: this.getUpdateMessage(info),
      buttons: this.getUpdateButtons(info),
    };

    return this.presentDialog(dialog);
  }

  private getUpdateTitle(info: AppUpdateInfo): string {
    switch (info.updatePriority) {
      case 5:
        return '🚨 Critical Update Required';
      case 4:
        return '⚠️ Important Update Available';
      case 3:
        return '🎯 Recommended Update';
      default:
        return '✨ New Version Available';
    }
  }

  private getUpdateMessage(info: AppUpdateInfo): string {
    const size = this.formatBytes(info.updateSize);
    const features = info.releaseNotes?.slice(0, 3).join('\n• ');

    return `Version ${info.availableVersion} is available (${size})
    
What's new:
• ${features}
    
${this.getUpdateUrgency(info)}`;
  }

  private getUpdateButtons(info: AppUpdateInfo): DialogButton[] {
    if (info.updatePriority === 5) {
      // Mandatory update - no cancel option
      return [
        {
          text: 'Update Now',
          handler: () => this.startUpdate(info),
        },
      ];
    }

    return [
      {
        text: 'Update',
        handler: () => this.startUpdate(info),
      },
      {
        text: 'Later',
        role: 'cancel',
        handler: () => this.scheduleReminder(info),
      },
    ];
  }
}
```

### Progress Indicators

```typescript
// Update progress UI
class UpdateProgressUI {
  private progressBar: HTMLElement;
  private statusText: HTMLElement;

  showProgress() {
    this.createProgressUI();

    CapacitorNativeUpdate.AppUpdate.addListener(
      'flexibleUpdateProgress',
      (progress) => {
        this.updateProgress(progress);
      }
    );
  }

  private updateProgress(progress: UpdateProgress) {
    // Update progress bar
    this.progressBar.style.width = `${progress.percent}%`;

    // Update status text
    const downloaded = this.formatBytes(progress.bytesDownloaded);
    const total = this.formatBytes(progress.totalBytes);
    this.statusText.textContent = `Downloading: ${downloaded} / ${total}`;

    // Show completion
    if (progress.percent === 100) {
      this.showCompletionUI();
    }
  }

  private showCompletionUI() {
    this.statusText.textContent = 'Update ready to install';
    this.showInstallButton();
  }
}
```

## Error Handling

### Common Errors and Solutions

```typescript
async function handleAppUpdateErrors() {
  try {
    await CapacitorNativeUpdate.AppUpdate.performImmediateUpdate();
  } catch (error) {
    switch (error.code) {
      case 'UPDATE_NOT_AVAILABLE':
        console.log('No update available');
        break;

      case 'UPDATE_CANCELLED':
        // User cancelled the update
        if (isCriticalUpdate()) {
          showMandatoryUpdateMessage();
        }
        break;

      case 'UPDATE_FAILED':
        // Update failed to install
        showRetryDialog();
        break;

      case 'PLATFORM_NOT_SUPPORTED':
        // Feature not available on this platform
        fallbackToManualUpdate();
        break;

      case 'PLAY_STORE_NOT_FOUND':
        // Google Play Store not installed
        showAlternativeUpdateMethod();
        break;

      case 'NETWORK_ERROR':
        // No internet connection
        showOfflineMessage();
        scheduleRetryWhenOnline();
        break;
    }
  }
}
```

### Retry Strategies

```typescript
class UpdateRetryStrategy {
  private retryCount = 0;
  private maxRetries = 3;

  async retryUpdate() {
    try {
      await CapacitorNativeUpdate.AppUpdate.startFlexibleUpdate();
      this.retryCount = 0;
    } catch (error) {
      if (this.shouldRetry(error)) {
        this.retryCount++;
        const delay = this.calculateBackoff();

        setTimeout(() => {
          this.retryUpdate();
        }, delay);
      } else {
        // Give up and show manual update option
        this.showManualUpdateOption();
      }
    }
  }

  private calculateBackoff(): number {
    // Exponential backoff: 2s, 4s, 8s
    return Math.pow(2, this.retryCount) * 1000;
  }
}
```

## Testing App Updates

### Development Testing

```typescript
// Mock update info for testing
const mockUpdateInfo: AppUpdateInfo = {
  updateAvailable: true,
  currentVersion: '1.0.0',
  availableVersion: '2.0.0',
  updatePriority: 4,
  updateSize: 15 * 1024 * 1024, // 15MB
  releaseNotes: [
    'New feature: Dark mode',
    'Performance improvements',
    'Bug fixes',
  ],
  isFlexibleUpdateAllowed: true,
  isImmediateUpdateAllowed: true,
};

// Test different scenarios
async function testUpdateScenarios() {
  // Test immediate update
  await testImmediateUpdate();

  // Test flexible update
  await testFlexibleUpdate();

  // Test update cancellation
  await testUpdateCancellation();

  // Test network errors
  await testNetworkErrors();
}
```

### Platform-Specific Testing

```bash
# Android testing with internal app sharing
# 1. Build APK with higher version number
# 2. Upload to Play Console internal app sharing
# 3. Install lower version on device
# 4. Test update flow

# iOS testing with TestFlight
# 1. Upload new version to TestFlight
# 2. Install older version
# 3. Test update detection and App Store redirect
```

## Best Practices

### 1. User Experience

```typescript
// Provide clear update information
const updateMessage = {
  title: 'Exciting Update!',
  features: [
    '🎨 Beautiful new design',
    '⚡ 2x faster performance',
    '🐛 Bug fixes and improvements',
  ],
  size: '12 MB',
  time: 'Less than 1 minute',
};
```

### 2. Smart Scheduling

```typescript
// Update at appropriate times
class SmartUpdateScheduler {
  async scheduleUpdate(info: AppUpdateInfo) {
    // Don't interrupt critical user flows
    if (this.isUserInCriticalFlow()) {
      this.scheduleForLater();
      return;
    }

    // Check device conditions
    const conditions = await this.checkDeviceConditions();

    if (conditions.isCharging && conditions.onWifi) {
      // Ideal conditions - start update
      await this.startUpdate();
    } else {
      // Wait for better conditions
      this.waitForBetterConditions();
    }
  }
}
```

### 3. Analytics Integration

```typescript
// Track update metrics
async function trackUpdateMetrics(event: string, data: any) {
  await analytics.track({
    event: `app_update_${event}`,
    properties: {
      currentVersion: data.currentVersion,
      availableVersion: data.availableVersion,
      updatePriority: data.updatePriority,
      userAction: data.userAction,
      timestamp: Date.now(),
    },
  });
}
```

## Next Steps

- Configure [App Reviews](./app-reviews.md) for user feedback
- Implement [Security Best Practices](../guides/security-best-practices.md)
- Set up [Update Monitoring](../guides/monitoring.md)
- Review [API Reference](../api/app-update-api.md)

---

Made with ❤️ by Ahsan Mahmood
