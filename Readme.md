# Capacitor Native Update Plugin

A comprehensive update management plugin for Capacitor that combines Live/OTA updates, native app store updates, and in-app review capabilities in a single, unified solution.

## Features

### 🚀 Live Updates (OTA)
Deploy JavaScript, HTML, and CSS updates instantly without going through app store approval:
- **Multiple update strategies**: Immediate, background, or manual updates
- **Delta updates**: Only download changed files for faster updates
- **Automatic rollback**: Revert to previous version if update fails
- **Update channels**: Support for production, staging, and development environments
- **Security**: End-to-end encryption and signature verification

### 📱 Native App Updates
Seamlessly manage app store updates with native UI integration:
- **Version checking**: Detect when newer versions are available
- **Flexible updates**: Background download with user-controlled installation
- **Immediate updates**: Force critical updates with blocking UI
- **Platform integration**: Google Play Core (Android) and App Store (iOS) support

### ⭐ App Reviews
Increase user engagement with intelligent review prompts:
- **In-app reviews**: Native review dialogs without leaving the app
- **Smart triggering**: Request reviews at optimal moments
- **Rate limiting**: Respect platform limits (iOS: 3x/year)
- **Analytics**: Track review request performance

## Installation

```bash
npm install capacitor-native-update
npx cap sync
```

## Quick Start

### 1. Basic Setup

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';

// Initialize on app start
async function initializeApp() {
  // Configure the plugin
  await CapacitorNativeUpdate.configure({
    updateUrl: 'https://updates.yourdomain.com/api/v1',
    autoCheck: true,
    publicKey: 'your-public-key-for-security'
  });
}
```

### 2. Live Updates (OTA)

```typescript
// Check and apply live updates
async function checkLiveUpdates() {
  try {
    const { available, version } = await CapacitorNativeUpdate.checkForUpdate();
    
    if (available) {
      // Download update with progress
      await CapacitorNativeUpdate.downloadUpdate({
        onProgress: (progress) => {
          console.log(`Downloading: ${progress.percent}%`);
        }
      });
      
      // Apply update (app will restart)
      await CapacitorNativeUpdate.applyUpdate();
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

### 3. Native App Updates

```typescript
// Check for app store updates
async function checkNativeUpdates() {
  const result = await CapacitorNativeUpdate.checkAppUpdate();
  
  if (result.updateAvailable) {
    if (result.immediateUpdateAllowed) {
      // Critical update - must install
      await CapacitorNativeUpdate.startImmediateUpdate();
    } else if (result.flexibleUpdateAllowed) {
      // Optional update - download in background
      await CapacitorNativeUpdate.startFlexibleUpdate();
    }
  }
}
```

### 4. App Reviews

```typescript
// Request app review at the right moment
async function requestAppReview() {
  // Only ask after positive interactions
  const shouldAsk = await checkIfGoodMoment();
  
  if (shouldAsk) {
    const result = await CapacitorNativeUpdate.requestReview();
    if (result.displayed) {
      console.log('Review prompt was shown');
    }
  }
}
```

## Real-World Example

```typescript
import { Component, OnInit } from '@angular/core';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private alertCtrl: AlertController) {}

  async ngOnInit() {
    // Check for updates on app start
    await this.checkAllUpdates();
    
    // Set up periodic checks
    setInterval(() => this.checkAllUpdates(), 3600000); // Every hour
  }

  async checkAllUpdates() {
    // 1. Check live updates first (fastest)
    const liveUpdate = await CapacitorNativeUpdate.checkForUpdate();
    if (liveUpdate.available) {
      await this.promptLiveUpdate(liveUpdate);
      return; // Don't check native if live update is available
    }
    
    // 2. Check native updates
    const nativeUpdate = await CapacitorNativeUpdate.checkAppUpdate();
    if (nativeUpdate.updateAvailable) {
      await this.promptNativeUpdate(nativeUpdate);
    }
  }

  async promptLiveUpdate(update: any) {
    const alert = await this.alertCtrl.create({
      header: 'Update Available',
      message: `Version ${update.version} is ready to install`,
      buttons: [
        { text: 'Later', role: 'cancel' },
        { 
          text: 'Update',
          handler: () => this.installLiveUpdate()
        }
      ]
    });
    await alert.present();
  }

  async installLiveUpdate() {
    // Download and apply
    await CapacitorNativeUpdate.downloadUpdate();
    await CapacitorNativeUpdate.applyUpdate(); // App restarts
  }

  // Request review after positive events
  async onPositiveEvent() {
    setTimeout(() => {
      CapacitorNativeUpdate.requestReview();
    }, 2000);
  }
}
```

## Configuration

### capacitor.config.json

```json
{
  "plugins": {
    "CapacitorNativeUpdate": {
      "updateUrl": "https://updates.yourdomain.com/api/v1",
      "autoCheck": true,
      "checkInterval": 3600,
      "channel": "production",
      "publicKey": "YOUR_BASE64_PUBLIC_KEY",
      "appStoreId": "123456789",
      "enforceMinVersion": true
    }
  }
}
```

## Platform Support

| Platform | Live Updates | App Updates | App Reviews |
|----------|-------------|-------------|-------------|
| iOS      | ✅          | ✅          | ✅          |
| Android  | ✅          | ✅          | ✅          |
| Web      | ✅          | ⚠️           | ⚠️           |

⚠️ = Graceful fallback with limited functionality

## Requirements

- Capacitor 5.0+
- iOS 13.0+
- Android 5.0+ (API 21+)

## Security

This plugin implements multiple security layers:
- **HTTPS enforcement** for all update downloads
- **Public key signature verification** for bundle integrity
- **Checksum validation** before applying updates
- **Certificate pinning** support for enhanced security

## Documentation

### Getting Started
- 🚀 [Quick Start Guide](./docs/QUICK_START.md) - Get up and running in 5 minutes
- 📖 [Features Overview](./FEATURES.md) - Detailed feature descriptions
- 🔧 [API Reference](./API.md) - Complete API documentation

### Implementation Guides
- 📱 [Live Updates Guide](./docs/LIVE_UPDATES_GUIDE.md) - Complete OTA implementation
- 🏪 [Native Updates Guide](./docs/NATIVE_UPDATES_GUIDE.md) - App store updates
- ⭐ [App Review Guide](./docs/APP_REVIEW_GUIDE.md) - Maximize review rates

### Advanced Topics
- 🔐 [Security Best Practices](./docs/SECURITY.md) - Security implementation
- 🔏 [Bundle Signing](./docs/BUNDLE_SIGNING.md) - Cryptographic signing
- 📊 [Migration Guide](./docs/MIGRATION.md) - Migrate from other solutions

## Example Implementation

### Complete Example App
Check out the [example app](./example) for a full implementation with:
- React + TypeScript setup
- All three features integrated
- Production-ready UI components
- Error handling and analytics

### Update Server Example
The [server example](./server-example) includes:
- Express.js update server
- Bundle upload and management
- Signature generation tools
- Channel-based deployments

```bash
# Run the example server
cd server-example
npm install
npm start
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 📧 Email: aoneahsan@gmail.com
- 🌐 Website: [Zaions](https://zaions.com)
- 💼 LinkedIn: [Ahsan Mahmood](https://linkedin.com/in/aoneahsan)
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/capacitor-native-update/issues)

## Author

**Ahsan Mahmood**
- Portfolio: [aoneahsan.com](https://aoneahsan.com)
- Company: [Zaions](https://zaions.com)
- Email: aoneahsan@gmail.com
- Phone: +923046619706