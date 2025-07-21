# Live Updates (OTA) Implementation Guide

This comprehensive guide explains how to implement Live Updates (Over-The-Air updates) in your Capacitor application using the CapacitorNativeUpdate plugin.

## Table of Contents

- [Overview](#overview)
- [How Live Updates Work](#how-live-updates-work)
- [Setup Guide](#setup-guide)
- [Implementation Steps](#implementation-steps)
- [Update Server Setup](#update-server-setup)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Live Updates allow you to push JavaScript, HTML, CSS, and asset updates to your app without going through the app store review process. This enables:

- 🚀 Instant bug fixes
- ✨ Feature toggles
- 🎨 UI/UX improvements
- 📊 A/B testing
- 🔧 Quick configuration changes

### What Can Be Updated

✅ **Can Update:**

- JavaScript bundles
- HTML files
- CSS stylesheets
- Images and assets
- JSON configuration
- Web fonts

❌ **Cannot Update:**

- Native code (Java/Kotlin/Swift/Objective-C)
- Native plugins
- Platform-specific configurations
- App permissions

## How Live Updates Work

```mermaid
sequenceDiagram
    participant App
    participant Plugin
    participant Server
    participant Storage

    App->>Plugin: checkForUpdate()
    Plugin->>Server: GET /check?version=1.0.0
    Server-->>Plugin: Update available (1.0.1)
    Plugin->>App: Update found
    App->>Plugin: downloadUpdate()
    Plugin->>Server: Download bundle
    Server-->>Plugin: Bundle data
    Plugin->>Storage: Save & extract
    Plugin->>App: Download complete
    App->>Plugin: applyUpdate()
    Plugin->>App: Restart required
    App->>App: Reload with new bundle
```

## Setup Guide

### 1. Install the Plugin

```bash
npm install capacitor-native-update
npx cap sync
```

### 2. Configure the Plugin

#### capacitor.config.json

```json
{
  "appId": "com.example.app",
  "appName": "My App",
  "plugins": {
    "CapacitorNativeUpdate": {
      "updateUrl": "https://updates.yourdomain.com/api/v1",
      "enabled": true,
      "autoCheck": true,
      "checkInterval": 3600,
      "channel": "production",
      "publicKey": "your-base64-public-key",
      "enforceSignature": true,
      "updateStrategy": "immediate",
      "maxVersions": 3
    }
  }
}
```

### 3. iOS Additional Setup

Add to `Info.plist`:

```xml
<key>CapacitorNativeUpdateEnabled</key>
<true/>
<key>CapacitorNativeUpdateURL</key>
<string>https://updates.yourdomain.com/api/v1</string>
```

### 4. Android Additional Setup

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Implementation Steps

### Step 1: Basic Implementation

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';

export class UpdateManager {
  async checkAndUpdate() {
    try {
      // Check for updates
      const { available, version } =
        await CapacitorNativeUpdate.checkForUpdate();

      if (available) {
        console.log(`Update available: ${version}`);

        // Download the update
        const { success } = await CapacitorNativeUpdate.downloadUpdate({
          onProgress: (progress) => {
            console.log(`Download progress: ${progress.percent}%`);
          },
        });

        if (success) {
          // Apply the update
          await CapacitorNativeUpdate.applyUpdate();
          // App will restart automatically
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  }
}
```

### Step 2: Advanced Implementation with UI

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { AlertController, LoadingController } from '@ionic/angular';

export class UpdateService {
  constructor(
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  async checkForUpdates(silent = false) {
    try {
      const { available, version, mandatory, notes } =
        await CapacitorNativeUpdate.checkForUpdate();

      if (!available) {
        if (!silent) {
          await this.showAlert('No Updates', 'Your app is up to date!');
        }
        return;
      }

      // Show update dialog
      const alert = await this.alertCtrl.create({
        header: 'Update Available',
        message: `Version ${version} is available.\n\n${notes || 'Bug fixes and improvements'}`,
        buttons: [
          {
            text: mandatory ? 'Update Now' : 'Later',
            role: 'cancel',
            handler: () => {
              if (mandatory) {
                // Force update for mandatory updates
                this.downloadAndApplyUpdate();
                return false;
              }
            },
          },
          {
            text: 'Update',
            handler: () => {
              this.downloadAndApplyUpdate();
            },
          },
        ],
        backdropDismiss: !mandatory,
      });

      await alert.present();
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  private async downloadAndApplyUpdate() {
    const loading = await this.loadingCtrl.create({
      message: 'Downloading update...',
      backdropDismiss: false,
    });

    await loading.present();

    try {
      // Download with progress
      await CapacitorNativeUpdate.downloadUpdate({
        onProgress: (progress) => {
          loading.message = `Downloading... ${Math.round(progress.percent)}%`;
        },
      });

      loading.message = 'Applying update...';

      // Apply the update
      await CapacitorNativeUpdate.applyUpdate();

      // The app will restart automatically
    } catch (error) {
      await loading.dismiss();
      await this.showAlert('Update Failed', error.message);
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
```

### Step 3: Auto-Update on App Start

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { UpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private updateService: UpdateService
  ) {}

  async ngOnInit() {
    await this.platform.ready();

    // Check for updates on app start
    await this.updateService.checkForUpdates(true);

    // Set up periodic checks
    setInterval(
      () => {
        this.updateService.checkForUpdates(true);
      },
      60 * 60 * 1000
    ); // Every hour
  }
}
```

### Step 4: Update Strategies

```typescript
// Different update strategies
export class UpdateStrategies {
  // Immediate update (default)
  async immediateUpdate() {
    const { available } = await CapacitorNativeUpdate.checkForUpdate();
    if (available) {
      await CapacitorNativeUpdate.downloadUpdate();
      await CapacitorNativeUpdate.applyUpdate(); // Restarts immediately
    }
  }

  // Update on next restart
  async updateOnRestart() {
    const { available } = await CapacitorNativeUpdate.checkForUpdate();
    if (available) {
      await CapacitorNativeUpdate.downloadUpdate();
      await CapacitorNativeUpdate.applyUpdate({
        reloadStrategy: 'on-next-restart',
      });
      // Update will be applied next time app starts
    }
  }

  // Update with confirmation
  async updateWithConfirmation() {
    const { available } = await CapacitorNativeUpdate.checkForUpdate();
    if (available) {
      await CapacitorNativeUpdate.downloadUpdate();

      // Show confirmation dialog
      const confirmed = await this.showUpdateReadyDialog();
      if (confirmed) {
        await CapacitorNativeUpdate.applyUpdate();
      }
    }
  }
}
```

## Update Server Setup

### Option 1: Use Our Example Server

```bash
cd server-example
npm install
npm start
```

### Option 2: Implement Your Own

#### Bundle Structure

```
bundle-1.0.1.zip
├── www/
│   ├── index.html
│   ├── js/
│   │   └── app.bundle.js
│   ├── css/
│   │   └── styles.css
│   └── assets/
│       └── images/
└── manifest.json
```

#### manifest.json

```json
{
  "version": "1.0.1",
  "minNativeVersion": "1.0.0",
  "timestamp": "2023-12-01T00:00:00Z",
  "files": ["www/index.html", "www/js/app.bundle.js", "www/css/styles.css"]
}
```

#### Server API Requirements

**Check Endpoint:**

```http
GET /api/v1/check?version=1.0.0&channel=production&appId=com.example.app
```

Response:

```json
{
  "available": true,
  "version": "1.0.1",
  "url": "https://updates.example.com/bundles/1.0.1.zip",
  "mandatory": false,
  "notes": "Bug fixes and performance improvements",
  "size": 2048576,
  "checksum": "sha256:abc123...",
  "signature": "base64signature...",
  "minNativeVersion": "1.0.0"
}
```

### Creating Update Bundles

```bash
# 1. Build your web app
npm run build

# 2. Create bundle
cd dist
zip -r ../bundle-1.0.1.zip www/

# 3. Sign the bundle (optional but recommended)
cd ..
node server-example/bundle-signer.js sign bundle-1.0.1.zip

# 4. Upload to server
curl -X POST https://updates.example.com/api/v1/bundles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@bundle-1.0.1.zip" \
  -F "version=1.0.1" \
  -F "channel=production" \
  -F "notes=Bug fixes"
```

## Advanced Features

### 1. Update Channels

```typescript
// Development channel for testing
await CapacitorNativeUpdate.setChannel({ channel: 'development' });

// Production channel for users
await CapacitorNativeUpdate.setChannel({ channel: 'production' });

// Beta channel for early adopters
await CapacitorNativeUpdate.setChannel({ channel: 'beta' });
```

### 2. Delta Updates

```typescript
// Enable delta updates to reduce download size
await CapacitorNativeUpdate.configureDeltaUpdates({
  enabled: true,
  threshold: 0.3, // Use delta if size < 30% of full bundle
});
```

### 3. Rollback Support

```typescript
// List available versions
const { versions } = await CapacitorNativeUpdate.getVersions();

// Rollback to previous version
if (versions.length > 1) {
  await CapacitorNativeUpdate.rollback();
}

// Rollback to specific version
await CapacitorNativeUpdate.switchVersion({
  version: '1.0.0',
});
```

### 4. Update Metrics

```typescript
// Track update success
await CapacitorNativeUpdate.reportUpdateSuccess({
  version: '1.0.1',
  duration: 5000,
});

// Track update failure
await CapacitorNativeUpdate.reportUpdateFailure({
  version: '1.0.1',
  error: 'DOWNLOAD_FAILED',
  details: 'Network timeout',
});
```

### 5. Custom Update UI

```typescript
// Disable auto-check
await CapacitorNativeUpdate.configure({
  autoCheck: false,
});

// Implement custom UI
class CustomUpdateUI {
  async showUpdateFlow() {
    // Custom check
    const update = await CapacitorNativeUpdate.checkForUpdate();

    if (update.available) {
      // Show custom UI
      const modal = await this.modalCtrl.create({
        component: UpdateModalComponent,
        componentProps: { update },
      });

      await modal.present();
    }
  }
}
```

## Best Practices

### 1. Version Management

```typescript
// Semantic versioning
const versions = {
  major: '2.0.0', // Breaking changes
  minor: '1.1.0', // New features
  patch: '1.0.1', // Bug fixes
};

// Skip versions if needed
const skipVersions = ['1.0.2', '1.0.3']; // Known bad versions
```

### 2. Error Handling

```typescript
class RobustUpdateManager {
  async safeUpdate() {
    try {
      await CapacitorNativeUpdate.checkForUpdate();
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') {
        // Retry with exponential backoff
        await this.retryWithBackoff();
      } else if (error.code === 'INVALID_SIGNATURE') {
        // Security issue - don't apply
        await this.reportSecurityIssue(error);
      } else {
        // Generic error handling
        console.error('Update failed:', error);
      }
    }
  }
}
```

### 3. Testing Updates

```typescript
// Test in development
if (environment.development) {
  // Force check against staging server
  await CapacitorNativeUpdate.configure({
    updateUrl: 'https://staging-updates.yourdomain.com',
    channel: 'development',
  });
}

// A/B testing
const testGroup = user.id % 2 === 0 ? 'A' : 'B';
await CapacitorNativeUpdate.setChannel({
  channel: `production-${testGroup}`,
});
```

### 4. Performance Optimization

```typescript
// Download during off-peak hours
const now = new Date().getHours();
if (now >= 2 && now <= 6) {
  await CapacitorNativeUpdate.downloadUpdate({
    priority: 'low',
  });
}

// Pause/resume downloads
const downloadId = await CapacitorNativeUpdate.startDownload();
await CapacitorNativeUpdate.pauseDownload({ id: downloadId });
await CapacitorNativeUpdate.resumeDownload({ id: downloadId });
```

## Troubleshooting

### Common Issues

1. **Update not applying**

   ```typescript
   // Check if update was downloaded
   const { ready } = await CapacitorNativeUpdate.isUpdateReady();
   if (ready) {
     // Force apply
     await CapacitorNativeUpdate.applyUpdate({ force: true });
   }
   ```

2. **Signature verification fails**

   ```typescript
   // Verify public key configuration
   const config = await CapacitorNativeUpdate.getConfiguration();
   console.log('Public key:', config.publicKey);
   ```

3. **Storage issues**
   ```typescript
   // Clear old versions
   await CapacitorNativeUpdate.cleanup({
     keepVersions: 1,
   });
   ```

### Debug Mode

```typescript
// Enable debug logging
await CapacitorNativeUpdate.setDebugMode({ enabled: true });

// Monitor update events
CapacitorNativeUpdate.addListener('updateDownloadProgress', (progress) => {
  console.log('Download progress:', progress);
});

CapacitorNativeUpdate.addListener('updateStateChange', (state) => {
  console.log('Update state:', state);
});
```

### Health Checks

```typescript
// Verify update system health
const health = await CapacitorNativeUpdate.getHealth();
console.log('Update system health:', {
  enabled: health.enabled,
  lastCheck: health.lastCheck,
  lastUpdate: health.lastUpdate,
  currentVersion: health.currentVersion,
  availableSpace: health.availableSpace,
});
```

## Security Considerations

1. **Always use HTTPS** for update servers
2. **Implement bundle signing** to prevent tampering
3. **Validate checksums** before applying updates
4. **Use certificate pinning** for extra security
5. **Implement rollback** mechanisms for safety
6. **Monitor update metrics** to detect issues

## Next Steps

- Read the [Native App Updates Guide](./NATIVE_UPDATES_GUIDE.md)
- Learn about [App Review Integration](./APP_REVIEW_GUIDE.md)
- Check out [Security Best Practices](./SECURITY.md)
- See [Bundle Signing Documentation](./BUNDLE_SIGNING.md)
