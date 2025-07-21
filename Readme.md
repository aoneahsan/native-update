# Capacitor Native Update Plugin

## 📚 Documentation

### Getting Started
- **[Installation Guide](./docs/getting-started/installation.md)** - Step-by-step installation instructions
- **[Quick Start Guide](./docs/getting-started/quick-start.md)** - Get up and running in minutes
- **[Configuration Guide](./docs/getting-started/configuration.md)** - Detailed configuration options

### Features Documentation
- **[Live Updates (OTA)](./docs/features/live-updates.md)** - Deploy web updates instantly
- **[App Updates](./docs/features/app-updates.md)** - Native app store update management
- **[App Reviews](./docs/features/app-reviews.md)** - In-app review integration
- **[Background Updates](./docs/background-updates.md)** - Background update management

### Guides & Best Practices
- **[Security Best Practices](./docs/guides/security-best-practices.md)** - Implement secure updates
- **[Migration Guide](./docs/guides/migration-guide.md)** - Migrate from other solutions
- **[Production Readiness](./docs/production-readiness.md)** - Production deployment checklist
- **[Bundle Signing](./docs/BUNDLE_SIGNING.md)** - Cryptographic signing guide

### API Reference
- **[Live Update API](./docs/api/live-update-api.md)** - Complete API for OTA updates
- **[App Update API](./docs/api/app-update-api.md)** - Native app update methods
- **[App Review API](./docs/api/app-review-api.md)** - Review request methods
- **[Events API](./docs/api/events-api.md)** - Event listeners and handlers

### Examples
- **[Basic Usage](./docs/examples/basic-usage.md)** - Simple implementation examples
- **[Advanced Scenarios](./docs/examples/advanced-scenarios.md)** - Complex use cases
- **[Integration Examples](./docs/examples/integration-examples.md)** - Framework integrations

---

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
    publicKey: 'your-public-key-for-security',
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
        },
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
  templateUrl: 'app.component.html',
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
          handler: () => this.installLiveUpdate(),
        },
      ],
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
| -------- | ------------ | ----------- | ----------- |
| iOS      | ✅           | ✅          | ✅          |
| Android  | ✅           | ✅          | ✅          |
| Web      | ✅           | ⚠️          | ⚠️          |

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


## 🏆 Production Ready

This package is **production-ready** and includes:

### ✅ Enterprise-Grade Security

- End-to-end encryption and signature verification
- Certificate pinning and HTTPS enforcement
- Input validation and sanitization
- Secure storage for sensitive data

### ✅ High Performance

- Optimized bundle management
- Background downloads with resume capability
- Efficient caching strategies
- Memory-conscious implementation

### ✅ Comprehensive Testing

- Unit tests with >85% coverage
- Integration tests across platforms
- Security vulnerability testing
- Performance benchmarks

### ✅ Complete Documentation

- Detailed API documentation
- Security best practices guide
- Production deployment checklist
- Troubleshooting and support guides

### ✅ Enterprise Support

- Professional support available
- Security updates and patches
- Performance optimization
- Custom implementation assistance

## 🚀 Quick Production Deployment

1. **Install and Configure**:

   ```bash
   npm install capacitor-native-update
   npx cap sync
   ```

2. **Follow Security Guide**: Implement [Security Best Practices](./docs/guides/security-best-practices.md)

3. **Production Checklist**: Complete the [Production Readiness](./docs/production-readiness.md) checklist

4. **Deploy with Confidence**: Your app is ready for production!

## 💡 Key Benefits

- **Zero Downtime Updates**: Deploy fixes instantly without app store delays
- **Native Integration**: Seamless platform-specific implementations
- **Developer Friendly**: Comprehensive TypeScript support and documentation
- **Community Driven**: Open-source with active community support
- **Professional Support**: Enterprise support options available

## 🤝 Community & Support

This package is **open-source** and created by **Ahsan Mahmood** for the developer community. We welcome contributions, feedback, and collaboration.

### Community Resources

- **[GitHub Repository](https://github.com/aoneahsan/capacitor-native-update)** - Source code and issues
- **[Documentation](./docs/README.md)** - Comprehensive documentation
- **[Examples](./docs/examples/)** - Real-world usage examples
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

### Professional Support

- **Custom Implementation**: Tailored solutions for your needs
- **Security Audits**: Professional security assessments
- **Performance Optimization**: Performance tuning and optimization
- **Training and Consulting**: Team training and consultation

## 📈 Trusted by Developers

- **Production Tested**: Used in production apps worldwide
- **Platform Agnostic**: Works with any JavaScript framework
- **Scalable**: Handles apps from startups to enterprise
- **Secure**: Built with security-first approach

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 📧 Email: aoneahsan@gmail.com
- 🌐 Website: [Ahsan Mahmood](https://aoneahsan.com)
- 💼 LinkedIn: [Ahsan Mahmood](https://linkedin.com/in/aoneahsan)
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/capacitor-native-update/issues)

## Author

**Ahsan Mahmood**

- Portfolio: [aoneahsan.com](https://aoneahsan.com)
- GitHub: [aoneahsan](https://github.com/aoneahsan)
- Email: aoneahsan@gmail.com
- Phone: +923046619706
