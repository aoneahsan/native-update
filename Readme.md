# Capacitor Native Update Plugin

> ⚠️ **IMPORTANT: Production-Ready with Complete Examples** ⚠️
>
> This package is now **feature-complete** with significant improvements:
>
> - ✅ **pnpm Workspace Monorepo** - Seamless development with workspace:* references
> - ✅ **3 Complete Examples** - React+Capacitor frontend, Node.js+Express and Firebase backends in `example-apps/`
> - ✅ **Native Implementations Complete** - iOS (Swift) and Android (Kotlin) fully implemented
> - ✅ **Comprehensive Test Suite** - Unit and integration tests with Vitest
> - ✅ **Development Tools Included** - Bundle creator, signer, and CLI tools
> - ✅ **Security Features Implemented** - HTTPS enforcement, signatures, checksums
>
> **🚀 Try the example apps in `example-apps/` to see all features in action!**

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
- **[Migration Guide](./docs/MIGRATION.md)** - Migrate from other solutions
- **[Production Readiness](./docs/production-readiness.md)** - Production deployment checklist
- **[Bundle Signing](./docs/BUNDLE_SIGNING.md)** - Cryptographic signing guide

### API Reference

- **[Live Update API](./docs/api/live-update-api.md)** - Complete API for OTA updates
- **[App Update API](./docs/api/app-update-api.md)** - Native app update methods
- **[App Review API](./docs/api/app-review-api.md)** - Review request methods
- **[Events API](./docs/api/events-api.md)** - Event listeners and handlers
- **[CLI Reference](./docs/cli-reference.md)** - Command-line tools documentation

### Examples

- **[Basic Usage](./docs/examples/basic-usage.md)** - Simple implementation examples
- **[Advanced Scenarios](./docs/examples/advanced-scenarios.md)** - Complex use cases

---

A **foundation package** for building a comprehensive update management plugin for Capacitor that combines Live/OTA updates, native app store updates, and in-app review capabilities. This package provides the architecture, interfaces, and documentation but requires additional implementation work.

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
npm install native-update
npx cap sync
```

## Quick Start

### 1. Basic Setup

```typescript
import { NativeUpdate } from 'native-update';

// Initialize on app start
async function initializeApp() {
  // Configure the plugin
  await NativeUpdate.configure({
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
    const result = await NativeUpdate.sync();

    if (result.status === 'UPDATE_AVAILABLE') {
      // Download update with progress tracking
      const listener = NativeUpdate.addListener('downloadProgress', (progress) => {
        console.log(`Downloading: ${progress.percent}%`);
      });

      // Download the update
      const bundle = await NativeUpdate.download({
        url: result.url,
        version: result.version,
        checksum: result.checksum
      });

      // Set the bundle and reload
      await NativeUpdate.set(bundle);
      await NativeUpdate.reload();
      
      listener.remove();
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
  const result = await NativeUpdate.getAppUpdateInfo();

  if (result.updateAvailable) {
    if (result.immediateUpdateAllowed) {
      // Critical update - must install
      await NativeUpdate.startImmediateUpdate();
    } else if (result.flexibleUpdateAllowed) {
      // Optional update - download in background
      await NativeUpdate.startFlexibleUpdate();
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
    const result = await NativeUpdate.requestReview();
    if (result.displayed) {
      console.log('Review prompt was shown');
    }
  }
}
```

## Real-World Example

```typescript
import { Component, OnInit } from '@angular/core';
import { NativeUpdate } from 'native-update';
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
    const liveUpdate = await NativeUpdate.sync();
    if (liveUpdate.status === 'UPDATE_AVAILABLE' || liveUpdate.status === 'UPDATE_INSTALLED') {
      await this.promptLiveUpdate(liveUpdate);
      return; // Don't check native if live update is available
    }

    // 2. Check native updates
    const nativeUpdate = await NativeUpdate.getAppUpdateInfo();
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
    // The sync method already handles download if needed
    // Just reload to apply the update
    await NativeUpdate.reload(); // App restarts
  }

  // Request review after positive events
  async onPositiveEvent() {
    setTimeout(() => {
      NativeUpdate.requestReview();
    }, 2000);
  }
}
```

## Configuration

### capacitor.config.json

```json
{
  "plugins": {
    "NativeUpdate": {
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

## 🎯 Complete Example Implementations

This repository uses **pnpm workspace** for seamless development. All examples reference the local plugin via `workspace:*` - no need to publish to npm for testing!

### Frontend Example: React + Capacitor

**[example-apps/react-capacitor](./example-apps/react-capacitor)**

- ✅ Simple, focused demonstration of OTA updates
- ✅ Single-page app with "change this text and deploy" example
- ✅ Capacitor integration (iOS + Android)
- ✅ TypeScript + Vite for modern development
- ✅ Uses local plugin via workspace reference

### Backend Examples

#### 1. Node.js + Express Backend

**[example-apps/node-express](./example-apps/node-express)**

- ✅ Production-ready update server
- ✅ Bundle management API
- ✅ SQLite database for bundle tracking
- ✅ Authentication & security
- ✅ Rate limiting and compression
- ✅ Signature verification

#### 2. Firebase Functions Backend

**[example-apps/firebase-backend](./example-apps/firebase-backend)**

- ✅ Serverless architecture with Firebase
- ✅ Cloud Functions for bundle management
- ✅ Firestore for bundle metadata
- ✅ Firebase Storage for bundle hosting
- ✅ Auto-scaling infrastructure

**🚀 Get started:** Each example app has its own README with setup instructions.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 🛠️ CLI Tools & Utilities

### Zero-Install CLI Access

All tools are available via `npx` without cloning the repo:

```bash
# Quick start
npx native-update init --example
npx native-update backend create express --with-admin
```

### Available Commands

✅ **Bundle Management**
- Create bundles: `npx native-update bundle create ./www`
- Sign bundles: `npx native-update bundle sign bundle.zip --key private.pem`
- Verify signatures: `npx native-update bundle verify bundle.zip --key public.pem`

✅ **Key Management**
- Generate keys: `npx native-update keys generate --type rsa --size 4096`
- Supports RSA (2048/4096) and EC (256/384) keys
- Creates timestamped key pairs with proper permissions
- See [Key Management Guide](./docs/guides/key-management.md) for detailed instructions

✅ **Backend Templates**
- Express.js: `npx native-update backend create express --with-admin`
- Firebase: `npx native-update backend create firebase --with-monitoring`
- Vercel: `npx native-update backend create vercel`

✅ **Development Tools**
- Start dev server: `npx native-update server start --port 3000`
- Monitor updates: `npx native-update monitor --server https://your-server.com`
- Validate config: `npx native-update config check`

✅ **Migration Tools**
- From CodePush: `npx native-update migrate --from codepush`

See [CLI Reference](./docs/cli-reference.md) for complete documentation.

## 🏗️ Development Status

### What This Package Provides

✅ **Architecture & Design**
- Well-designed TypeScript interfaces and plugin structure
- Modular architecture for live updates, app updates, and reviews
- Security-first design patterns

✅ **Documentation**
- Comprehensive API documentation
- Security best practices guide
- Implementation examples and guides

✅ **Foundation Code**
- TypeScript/Web implementation
- Plugin interfaces and definitions
- Basic native platform stubs

### What You Need to Build

❌ **Backend Infrastructure**
- Update server with API endpoints
- Bundle storage and CDN
- Version management system
- Signing and encryption services

❌ **Complete Native Implementation**
- Verify and complete iOS implementation
- Verify and complete Android implementation
- Platform-specific testing

❌ **Testing & Quality Assurance**
- Unit tests for all modules
- Integration tests
- End-to-end testing
- Security testing

❌ **Tooling & Utilities**
- Bundle creation tools
- Signing utilities
- Deployment scripts
- Monitoring solutions

## 🚀 Getting Started with Development

1. **Understand the Architecture**:
   - Review the documentation in `/docs/`
   - Study the TypeScript interfaces in `/src/definitions.ts`
   - Check the [ROADMAP.md](./ROADMAP.md) for development priorities

2. **Build Required Infrastructure**:
   - Set up an update server (see [server requirements](./docs/server-requirements.md))
   - Implement bundle storage solution
   - Create signing infrastructure

3. **Complete Native Implementation**:
   - Test and verify iOS implementation
   - Test and verify Android implementation
   - Ensure all plugin methods work correctly

4. **Create Testing Suite**:
   - Add unit tests for TypeScript code
   - Create integration tests for native platforms
   - Implement end-to-end testing scenarios

## 💡 Key Benefits

- **Zero Downtime Updates**: Deploy fixes instantly without app store delays
- **Native Integration**: Seamless platform-specific implementations
- **Developer Friendly**: Comprehensive TypeScript support and documentation
- **Community Driven**: Open-source with active community support
- **Professional Support**: Enterprise support options available

## 🤝 Community & Support

This package is **open-source** and created by **Ahsan Mahmood** for the developer community. We welcome contributions, feedback, and collaboration.

### Community Resources

- **[GitHub Repository](https://github.com/aoneahsan/native-update)** - Source code and issues
- **[Documentation](./docs/README.md)** - Comprehensive documentation
- **[Examples](./docs/examples/)** - Real-world usage examples
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

### Professional Support

- **Custom Implementation**: Tailored solutions for your needs
- **Security Audits**: Professional security assessments
- **Performance Optimization**: Performance tuning and optimization
- **Training and Consulting**: Team training and consultation

## 📈 Why Use This Foundation?

- **Solid Architecture**: Well-designed plugin structure and interfaces
- **Platform Agnostic**: Works with any JavaScript framework
- **Security-First**: Built with security best practices in mind
- **Comprehensive Documentation**: Detailed guides for implementation

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 📧 Email: aoneahsan@gmail.com
- 🌐 Website: [Ahsan Mahmood](https://aoneahsan.com)
- 💼 LinkedIn: [Ahsan Mahmood](https://linkedin.com/in/aoneahsan)
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/native-update/issues)

## Author

**Ahsan Mahmood**

- Portfolio: [aoneahsan.com](https://aoneahsan.com)
- GitHub: [aoneahsan](https://github.com/aoneahsan)
- Email: aoneahsan@gmail.com
- Phone: +923046619706
