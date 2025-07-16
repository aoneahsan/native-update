# Installation Guide

This guide will walk you through installing and setting up the Capacitor Native Update plugin in your project.

## Prerequisites

Before installing the plugin, ensure you have:

- **Capacitor 7.0.0** or higher installed in your project
- **Node.js 18+** and npm/yarn installed
- **iOS Requirements**: Xcode 14+ and iOS 13.0+ deployment target
- **Android Requirements**: Android Studio and minimum SDK 21 (Android 5.0)

## Installation Steps

### 1. Install the Plugin

Using npm:
```bash
npm install capacitor-native-update
```

Using yarn:
```bash
yarn add capacitor-native-update
```

### 2. Sync Native Projects

After installation, sync the plugin with your native projects:

```bash
npx cap sync
```

This command will:
- Copy the web assets to native projects
- Install the native dependencies
- Update native project configurations

### 3. Platform-Specific Setup

#### iOS Setup

1. Open your iOS project in Xcode:
   ```bash
   npx cap open ios
   ```

2. Ensure your deployment target is set to iOS 13.0 or higher:
   - Select your project in Xcode
   - Go to the "General" tab
   - Set "Minimum Deployments" to iOS 13.0

3. Add required permissions to `Info.plist` (if not already present):
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <false/>
   </dict>
   ```

#### Android Setup

1. Open your Android project:
   ```bash
   npx cap open android
   ```

2. Ensure your `minSdkVersion` is 21 or higher in `android/variables.gradle`:
   ```gradle
   ext {
       minSdkVersion = 21
       targetSdkVersion = 34
       compileSdkVersion = 34
   }
   ```

3. The plugin automatically adds required permissions to the manifest:
   - `INTERNET` - For downloading updates
   - `ACCESS_NETWORK_STATE` - For checking network availability

#### Web Setup

No additional setup is required for web platform. The plugin provides fallback implementations for all features.

### 4. Initialize the Plugin

In your app's initialization code (e.g., `main.ts`, `app.component.ts`, or `App.jsx`):

```typescript
import { CapacitorNativeUpdate } from 'capacitor-native-update';

// Basic initialization
await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://your-update-server.com',
    channel: 'production',
    autoUpdate: true
  }
});
```

## Verification

To verify the installation:

1. Build and run your app:
   ```bash
   npx cap run ios
   # or
   npx cap run android
   ```

2. Check the console logs for initialization messages

3. Test basic functionality:
   ```typescript
   // Get current bundle info
   const currentBundle = await CapacitorNativeUpdate.LiveUpdate.current();
   console.log('Current bundle:', currentBundle);
   
   // Check for updates
   const latest = await CapacitorNativeUpdate.LiveUpdate.getLatest();
   console.log('Latest version available:', latest);
   ```

## TypeScript Support

The plugin includes comprehensive TypeScript definitions. Your IDE should provide full autocompletion and type checking.

To import types:
```typescript
import type { 
  UpdateConfig, 
  BundleInfo, 
  SyncResult 
} from 'capacitor-native-update';
```

## Troubleshooting Installation

### Common Issues

1. **"Module not found" error**
   - Run `npm install` or `yarn install` again
   - Delete `node_modules` and reinstall
   - Ensure you've run `npx cap sync`

2. **iOS build errors**
   - Clean build folder: `Product > Clean Build Folder` in Xcode
   - Delete `DerivedData` folder
   - Run `pod install` in the `ios/App` directory

3. **Android build errors**
   - Clean and rebuild: `./gradlew clean` in Android Studio
   - Sync project with Gradle files
   - Ensure Android Gradle Plugin is up to date

4. **TypeScript errors**
   - Update TypeScript to 4.0 or higher
   - Restart your TypeScript language server
   - Check `tsconfig.json` includes the plugin types

## Next Steps

After successful installation:

1. Read the [Quick Start Guide](./quick-start.md) for basic usage
2. Configure the plugin with your [update server settings](./configuration.md)
3. Implement [security best practices](../guides/security-best-practices.md)
4. Set up your [update server](../examples/server-setup.md)

## Support

If you encounter any issues during installation:

- Check our [Troubleshooting Guide](../guides/troubleshooting.md)
- Search existing [GitHub Issues](https://github.com/aoneahsan/capacitor-native-update/issues)
- Create a new issue with detailed information about your setup

---

Made with ❤️ by Ahsan Mahmood