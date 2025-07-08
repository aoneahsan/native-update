# Native App Updates Implementation Guide

This comprehensive guide explains how to implement Native App Updates (App Store and Google Play updates) in your Capacitor application using the CapacitorNativeUpdate plugin.

## Table of Contents
- [Overview](#overview)
- [Platform Differences](#platform-differences)
- [Setup Guide](#setup-guide)
- [Implementation Steps](#implementation-steps)
- [UI/UX Best Practices](#uiux-best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

Native App Updates allow your app to:
- 🔄 Check for new versions in app stores
- 📥 Download updates within the app
- 🚀 Install updates seamlessly
- 📊 Track update adoption rates

### Benefits

- **User Experience**: Users update without leaving your app
- **Adoption Rate**: Higher update rates vs waiting for manual updates  
- **Control**: Guide users through important updates
- **Flexibility**: Immediate vs flexible update strategies

## Platform Differences

### Android (Google Play)
- Uses Google Play Core Library
- Supports In-App Updates API
- Two update modes: Immediate and Flexible
- Requires Google Play Store (not available on other stores)

### iOS (App Store)
- Uses StoreKit framework
- Redirects to App Store for download
- Cannot install directly within app
- Shows update availability only

## Setup Guide

### Prerequisites

1. **Android**:
   - App must be published on Google Play Store
   - Minimum API level 21 (Android 5.0)
   - Google Play Core library

2. **iOS**:
   - App must be published on Apple App Store
   - iOS 10.0 or higher
   - Valid App Store ID

### Installation

```bash
npm install capacitor-native-update
npx cap sync
```

### Android Configuration

1. **Add to `android/app/build.gradle`:**
```gradle
dependencies {
    implementation 'com.google.android.play:core:2.1.0'
    implementation 'com.google.android.play:core-ktx:1.8.1'
}
```

2. **Add to `AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS Configuration

1. **Add to `Info.plist`:**
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>itms-apps</string>
</array>
```

2. **Enable Capabilities in Xcode:**
   - App Groups (for shared data)
   - Background Modes > Background fetch

## Implementation Steps

### Step 1: Basic Implementation

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { Capacitor } from '@capacitor/core';

export class NativeUpdateService {
  async checkForAppUpdate() {
    try {
      // Check current platform
      const platform = Capacitor.getPlatform();
      
      // Check for native app updates
      const result = await CapacitorNativeUpdate.checkAppUpdate();
      
      if (result.updateAvailable) {
        console.log(`Update available: ${result.availableVersion}`);
        console.log(`Current version: ${result.currentVersion}`);
        
        // Handle based on update type
        if (result.immediateUpdateAllowed) {
          await this.performImmediateUpdate();
        } else if (result.flexibleUpdateAllowed) {
          await this.performFlexibleUpdate();
        } else if (platform === 'ios') {
          await this.redirectToAppStore();
        }
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }
}
```

### Step 2: Android In-App Updates

#### Immediate Update (Blocking)
```typescript
export class AndroidImmediateUpdate {
  async performImmediateUpdate() {
    try {
      // Start immediate update
      const { started } = await CapacitorNativeUpdate.startImmediateUpdate();
      
      if (started) {
        // The app will be restarted automatically after update
        console.log('Immediate update started');
      }
    } catch (error) {
      if (error.code === 'UPDATE_CANCELED') {
        // User canceled the update
        // For immediate updates, you might want to close the app
        await this.showMandatoryUpdateDialog();
      }
    }
  }

  async showMandatoryUpdateDialog() {
    const alert = await this.alertController.create({
      header: 'Update Required',
      message: 'This update is required to continue using the app.',
      backdropDismiss: false,
      buttons: [{
        text: 'Update',
        handler: () => {
          this.performImmediateUpdate();
        }
      }]
    });
    await alert.present();
  }
}
```

#### Flexible Update (Non-blocking)
```typescript
export class AndroidFlexibleUpdate {
  private updateDownloaded = false;

  async performFlexibleUpdate() {
    try {
      // Start flexible update
      await CapacitorNativeUpdate.startFlexibleUpdate();
      
      // Listen for download progress
      CapacitorNativeUpdate.addListener('onAppUpdateDownloadProgress', 
        (progress) => {
          console.log(`Download progress: ${progress.bytesDownloaded} / ${progress.totalBytesToDownload}`);
          this.updateProgressUI(progress);
        }
      );

      // Listen for download completion
      CapacitorNativeUpdate.addListener('onAppUpdateDownloaded', 
        () => {
          console.log('Update downloaded');
          this.updateDownloaded = true;
          this.showInstallPrompt();
        }
      );
    } catch (error) {
      console.error('Flexible update failed:', error);
    }
  }

  async showInstallPrompt() {
    const alert = await this.alertController.create({
      header: 'Update Ready',
      message: 'A new version has been downloaded. Would you like to install it now?',
      buttons: [
        {
          text: 'Later',
          role: 'cancel',
          handler: () => {
            // Install will happen on next app restart
          }
        },
        {
          text: 'Install',
          handler: () => {
            this.completeFlexibleUpdate();
          }
        }
      ]
    });
    await alert.present();
  }

  async completeFlexibleUpdate() {
    try {
      await CapacitorNativeUpdate.completeFlexibleUpdate();
      // App will restart with new version
    } catch (error) {
      console.error('Failed to complete update:', error);
    }
  }

  updateProgressUI(progress: any) {
    const percent = Math.round(
      (progress.bytesDownloaded / progress.totalBytesToDownload) * 100
    );
    
    // Update your UI progress bar
    this.downloadProgress = percent;
  }
}
```

### Step 3: iOS App Store Updates

```typescript
export class iOSAppStoreUpdate {
  async checkAndPromptUpdate() {
    try {
      const result = await CapacitorNativeUpdate.checkAppUpdate();
      
      if (result.updateAvailable) {
        await this.showiOSUpdateDialog(result);
      }
    } catch (error) {
      console.error('iOS update check failed:', error);
    }
  }

  async showiOSUpdateDialog(updateInfo: any) {
    const alert = await this.alertController.create({
      header: 'Update Available',
      message: `Version ${updateInfo.availableVersion} is available on the App Store.`,
      buttons: [
        {
          text: 'Later',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: () => {
            this.openAppStore();
          }
        }
      ]
    });
    await alert.present();
  }

  async openAppStore() {
    try {
      await CapacitorNativeUpdate.openAppStore();
    } catch (error) {
      // Fallback to browser
      const appStoreUrl = `https://apps.apple.com/app/id${YOUR_APP_STORE_ID}`;
      window.open(appStoreUrl, '_system');
    }
  }
}
```

### Step 4: Cross-Platform Implementation

```typescript
import { Capacitor } from '@capacitor/core';
import { CapacitorNativeUpdate } from 'capacitor-native-update';

export class UnifiedUpdateService {
  private platform = Capacitor.getPlatform();

  async checkAndUpdateApp() {
    try {
      const updateInfo = await CapacitorNativeUpdate.checkAppUpdate();
      
      if (!updateInfo.updateAvailable) {
        console.log('App is up to date');
        return;
      }

      // Platform-specific handling
      if (this.platform === 'android') {
        await this.handleAndroidUpdate(updateInfo);
      } else if (this.platform === 'ios') {
        await this.handleiOSUpdate(updateInfo);
      }
    } catch (error) {
      console.error('Update check failed:', error);
      this.handleUpdateError(error);
    }
  }

  private async handleAndroidUpdate(updateInfo: any) {
    // Determine update priority
    const priority = updateInfo.updatePriority || 0;
    
    if (priority >= 4 || updateInfo.immediateUpdateAllowed) {
      // High priority or immediate update required
      await this.showUpdateDialog({
        title: 'Important Update',
        message: 'A critical update is available and must be installed.',
        mandatory: true,
        action: () => this.performImmediateUpdate()
      });
    } else if (updateInfo.flexibleUpdateAllowed) {
      // Normal priority - flexible update
      await this.showUpdateDialog({
        title: 'Update Available',
        message: `Version ${updateInfo.availableVersion} is available with new features and improvements.`,
        mandatory: false,
        action: () => this.performFlexibleUpdate()
      });
    }
  }

  private async handleiOSUpdate(updateInfo: any) {
    await this.showUpdateDialog({
      title: 'Update Available',
      message: `Version ${updateInfo.availableVersion} is available on the App Store.`,
      mandatory: false,
      action: () => CapacitorNativeUpdate.openAppStore()
    });
  }

  private async showUpdateDialog(options: {
    title: string;
    message: string;
    mandatory: boolean;
    action: () => Promise<void>;
  }) {
    const buttons = options.mandatory 
      ? [{
          text: 'Update Now',
          handler: () => options.action()
        }]
      : [
          {
            text: 'Later',
            role: 'cancel'
          },
          {
            text: 'Update',
            handler: () => options.action()
          }
        ];

    const alert = await this.alertController.create({
      header: options.title,
      message: options.message,
      backdropDismiss: !options.mandatory,
      buttons
    });

    await alert.present();
  }
}
```

### Step 5: Update Status Handling

```typescript
export class UpdateStatusManager {
  constructor() {
    this.setupUpdateListeners();
  }

  private setupUpdateListeners() {
    // Installation status
    CapacitorNativeUpdate.addListener('onAppUpdateInstallStatus', 
      (status) => {
        switch (status.status) {
          case 'PENDING':
            console.log('Update pending');
            break;
          case 'DOWNLOADING':
            console.log('Downloading update');
            break;
          case 'INSTALLING':
            console.log('Installing update');
            break;
          case 'INSTALLED':
            console.log('Update installed');
            this.notifyUpdateComplete();
            break;
          case 'FAILED':
            console.error('Update failed:', status.error);
            this.handleUpdateFailure(status.error);
            break;
          case 'CANCELED':
            console.log('Update canceled by user');
            break;
        }
      }
    );

    // Download progress (Android flexible updates)
    CapacitorNativeUpdate.addListener('onAppUpdateDownloadProgress',
      (progress) => {
        const percent = Math.round(
          (progress.bytesDownloaded / progress.totalBytesToDownload) * 100
        );
        this.updateProgressBar(percent);
      }
    );
  }

  private updateProgressBar(percent: number) {
    // Update your UI
    const progressBar = document.querySelector('.update-progress');
    if (progressBar) {
      progressBar.setAttribute('value', percent.toString());
    }
  }
}
```

## UI/UX Best Practices

### 1. Update Prompts

```typescript
export class UpdateUIService {
  async showSmartUpdatePrompt(updateInfo: any) {
    const timeSinceLastPrompt = Date.now() - this.lastPromptTime;
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    // Don't prompt too frequently
    if (timeSinceLastPrompt < oneDayInMs && !updateInfo.mandatory) {
      return;
    }

    // Custom UI based on update importance
    if (updateInfo.updatePriority >= 4) {
      await this.showCriticalUpdateUI(updateInfo);
    } else if (updateInfo.releaseNotes?.includes('security')) {
      await this.showSecurityUpdateUI(updateInfo);
    } else {
      await this.showStandardUpdateUI(updateInfo);
    }
    
    this.lastPromptTime = Date.now();
  }

  private async showCriticalUpdateUI(updateInfo: any) {
    // Full-screen modal for critical updates
    const modal = await this.modalController.create({
      component: CriticalUpdateComponent,
      componentProps: { updateInfo },
      backdropDismiss: false
    });
    await modal.present();
  }

  private async showStandardUpdateUI(updateInfo: any) {
    // Toast or small banner for standard updates
    const toast = await this.toastController.create({
      message: 'A new version is available',
      duration: 5000,
      position: 'top',
      buttons: [{
        text: 'Update',
        handler: () => this.startUpdate()
      }]
    });
    await toast.present();
  }
}
```

### 2. Progress Indicators

```html
<!-- update-progress.component.html -->
<ion-card *ngIf="updateInProgress">
  <ion-card-header>
    <ion-card-title>Updating App</ion-card-title>
  </ion-card-header>
  <ion-card-content>
    <ion-progress-bar [value]="downloadProgress / 100"></ion-progress-bar>
    <p>{{ downloadProgress }}% complete</p>
    <p class="update-status">{{ updateStatus }}</p>
  </ion-card-content>
</ion-card>
```

### 3. Smart Update Scheduling

```typescript
export class SmartUpdateScheduler {
  async scheduleUpdate() {
    const updateInfo = await CapacitorNativeUpdate.checkAppUpdate();
    
    if (!updateInfo.updateAvailable) return;

    // Check user preferences
    const preferences = await this.getUpdatePreferences();
    
    if (preferences.autoUpdate === 'wifi-only') {
      const connection = await Network.getStatus();
      if (connection.connectionType !== 'wifi') {
        // Schedule for later when on WiFi
        this.scheduleForWiFi();
        return;
      }
    }

    if (preferences.autoUpdate === 'night-only') {
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 22) {
        // Schedule for nighttime
        this.scheduleForNight();
        return;
      }
    }

    // Proceed with update
    await this.performUpdate();
  }
}
```

## Testing

### Android Testing

1. **Using Internal Test Track**:
```typescript
// Enable internal app sharing for testing
await CapacitorNativeUpdate.enableDebugMode({ 
  enabled: true,
  testMode: 'internal-test'
});
```

2. **Test Different Scenarios**:
```typescript
// Test immediate update
await CapacitorNativeUpdate.simulateUpdate({
  type: 'immediate',
  version: '2.0.0'
});

// Test flexible update
await CapacitorNativeUpdate.simulateUpdate({
  type: 'flexible',
  version: '1.1.0'
});
```

### iOS Testing

1. **TestFlight Testing**:
   - Upload build to TestFlight
   - Install older version on device
   - Check for updates in app

2. **Sandbox Testing**:
   - Use sandbox App Store account
   - Test update flow without affecting production

### Testing Checklist

- [ ] Update available detection
- [ ] Update not available scenario
- [ ] Immediate update flow (Android)
- [ ] Flexible update flow (Android)
- [ ] App Store redirect (iOS)
- [ ] Update cancellation handling
- [ ] Network error handling
- [ ] Update completion verification
- [ ] Rollback scenarios (if applicable)

## Troubleshooting

### Common Issues

#### 1. Update Not Detected
```typescript
// Debug update detection
const debug = await CapacitorNativeUpdate.getDebugInfo();
console.log('Debug info:', {
  currentVersion: debug.currentVersion,
  packageName: debug.packageName,
  lastCheckTime: debug.lastCheckTime,
  playServicesAvailable: debug.playServicesAvailable // Android
});
```

#### 2. Update Fails to Install
```typescript
// Check update state
const state = await CapacitorNativeUpdate.getUpdateState();
if (state.status === 'FAILED') {
  // Clear update data and retry
  await CapacitorNativeUpdate.clearUpdateData();
  await CapacitorNativeUpdate.checkAppUpdate();
}
```

#### 3. iOS App Store Not Opening
```typescript
// Verify App Store ID configuration
const config = await CapacitorNativeUpdate.getConfiguration();
console.log('App Store ID:', config.appStoreId);

// Manual fallback
if (!config.appStoreId) {
  console.error('App Store ID not configured');
}
```

### Platform-Specific Issues

#### Android
- Ensure Google Play Services is updated
- Check Play Store app is installed
- Verify app is signed with release key
- Test on device with Play Store (not emulator)

#### iOS
- Verify App Store ID is correct
- Check iTunes lookup API response
- Ensure app is live on App Store
- Test on real device (not simulator)

## Best Practices Summary

1. **Always provide "Later" option** for non-critical updates
2. **Show release notes** when available
3. **Respect user preferences** for update timing
4. **Handle network conditions** appropriately
5. **Test thoroughly** on both platforms
6. **Monitor update metrics** to improve adoption
7. **Provide fallback options** for update failures

## Next Steps

- Learn about [Live Updates (OTA)](./LIVE_UPDATES_GUIDE.md)
- Implement [App Review Features](./APP_REVIEW_GUIDE.md)
- Review [Security Guidelines](./SECURITY.md)
- Check [API Reference](../API.md)