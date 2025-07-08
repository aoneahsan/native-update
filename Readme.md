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

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';

// Check for live updates
const result = await CapacitorNativeUpdate.sync({
  channel: 'production'
});

// Check for app store updates
const updateInfo = await CapacitorNativeUpdate.getAppUpdateInfo();
if (updateInfo.updateAvailable) {
  await CapacitorNativeUpdate.performImmediateUpdate();
}

// Request app review
await CapacitorNativeUpdate.requestReview();
```

## Configuration

```typescript
const config = {
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://your-update-server.com',
    channel: 'production',
    autoUpdate: true,
    publicKey: 'your-public-key'
  },
  appUpdate: {
    minimumVersion: '1.0.0',
    updatePriority: 3
  },
  appReview: {
    minimumDaysSinceInstall: 7,
    minimumLaunchCount: 3
  }
};

await CapacitorNativeUpdate.configure(config);
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

- [Features Overview](./FEATURES.md)
- [API Reference](./API.md)
- [Migration Guide](./docs/MIGRATION.md)
- [Security Best Practices](./docs/SECURITY.md)

## Example App

Check out the [example app](./example) for a complete implementation demonstrating all features.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/capacitor-native-update/issues)