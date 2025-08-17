# Installation Guide

> **⚠️ WARNING: What's NOT Included**
>
> Installing this plugin gives you **client-side functionality only**. You will NOT get:
>
> - ❌ An update server (you must build your own)
> - ❌ Bundle generation tools (requires custom CI/CD setup)
> - ❌ Ready-to-use backend API (implement from scratch)
> - ❌ Admin dashboard or management UI
> - ❌ Bundle hosting or CDN setup
> - ❌ Security infrastructure (certificates, signing keys)
> - ❌ Analytics or monitoring systems
>
> **Before proceeding**, ensure you have the technical resources to build the complete backend infrastructure. This plugin is only useful if you can implement the extensive server-side requirements.

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
npm install native-update
```

Using yarn:

```bash
yarn add native-update
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
   - **`INTERNET`** - Required for downloading update bundles from your server
   - **`ACCESS_NETWORK_STATE`** - Required to check network availability before downloading
   - **`WAKE_LOCK`** - Required to keep the device awake during background downloads
   - **`FOREGROUND_SERVICE`** - Required for showing download progress notifications
   - **`POST_NOTIFICATIONS`** - Required for update notifications on Android 13+ ([API 33](https://developer.android.com/develop/ui/views/notifications/notification-permission))
   - **`RECEIVE_BOOT_COMPLETED`** - Required to resume interrupted downloads after device restart

4. **CRITICAL: Android Manifest Configuration for Background Updates**

   If you're using background updates, you **MUST** add these elements to your app's `AndroidManifest.xml` inside the `<application>` tag. Without these, background updates will fail silently:

   ```xml
   <application>
       <!-- Your existing application configuration -->
       
       <!-- WorkManager Foreground Service (REQUIRED for background downloads) -->
       <!-- Without this: Background downloads will be killed by the system after ~10 minutes -->
       <!-- Documentation: https://developer.android.com/topic/libraries/architecture/workmanager/advanced/long-running -->
       <service
           android:name="androidx.work.impl.foreground.SystemForegroundService"
           android:foregroundServiceType="dataSync"
           tools:node="merge" />

       <!-- Notification Action Receiver (REQUIRED for update notifications) -->
       <!-- Without this: "Update Now" and "Dismiss" buttons in notifications won't work -->
       <!-- The receiver handles user actions from update notifications -->
       <receiver
           android:name="com.aoneahsan.nativeupdate.NotificationActionReceiver"
           android:exported="false">
           <intent-filter>
               <action android:name="com.aoneahsan.nativeupdate.UPDATE_NOW" />
               <action android:name="com.aoneahsan.nativeupdate.UPDATE_LATER" />
               <action android:name="com.aoneahsan.nativeupdate.DISMISS" />
           </intent-filter>
       </receiver>
   </application>
   ```

   **What happens if you skip this step:**
   - ❌ Background downloads will be terminated by Android after ~10 minutes
   - ❌ Update notifications won't display progress
   - ❌ Notification action buttons won't respond to taps
   - ❌ Downloads won't resume after app restart
   - ❌ Users will experience failed or incomplete updates

   **Detailed Explanation of Each Component:**

   - **SystemForegroundService**: Android's WorkManager service that handles long-running background tasks
     - **Purpose**: Keeps downloads alive when app is backgrounded or device is locked
     - **`foregroundServiceType="dataSync"`**: Tells Android this service downloads/syncs data
     - **What breaks without it**: Background downloads crash with `ServiceNotFoundException`
     - **Reference**: [WorkManager Long-running Workers](https://developer.android.com/topic/libraries/architecture/workmanager/advanced/long-running)

   - **NotificationActionReceiver**: Handles user interactions with update notifications
     - **`UPDATE_NOW`**: Triggered when user taps "Update Now" - starts immediate installation
     - **`UPDATE_LATER`**: Triggered when user taps "Update Later" - schedules for later
     - **`DISMISS`**: Triggered when user dismisses notification - cancels pending update
     - **What breaks without it**: Buttons appear in notifications but don't do anything when tapped
     - **Reference**: [Notification Actions](https://developer.android.com/develop/ui/views/notifications/notification-actions)

   - **Security Attributes Explained**:
     - **`android:exported="false"`**: Prevents other apps from sending intents to your receiver (security best practice)
     - **`tools:node="merge"`**: Handles conflicts if multiple libraries define the same service

   **Note:** If you're only using immediate (foreground) updates, these additions are optional.

   📋 **[View Complete Android Manifest Example](../examples/android-manifest-example.xml)** - Shows the correct placement of all elements

#### Web Setup

No additional setup is required for web platform. The plugin provides fallback implementations for all features.

### 4. Initialize the Plugin

In your app's initialization code (e.g., `main.ts`, `app.component.ts`, or `App.jsx`):

```typescript
import { NativeUpdate } from 'native-update';

// Basic initialization
await NativeUpdate.configure({
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://your-update-server.com',
    channel: 'production',
    autoUpdate: true,
  },
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
   const currentBundle = await NativeUpdate.current();
   console.log('Current bundle:', currentBundle);

   // Check for updates
   const latest = await NativeUpdate.getLatest();
   console.log('Latest version available:', latest);
   ```

## TypeScript Support

The plugin includes comprehensive TypeScript definitions. Your IDE should provide full autocompletion and type checking.

To import types:

```typescript
import type {
  UpdateConfig,
  BundleInfo,
  SyncResult,
} from 'native-update';
```

## Troubleshooting Installation

### Android Manifest Errors

1. **"AAPT: error: unexpected element <service> found in <manifest>"**
   - **Cause**: Service/receiver elements placed outside `<application>` tag or in wrong manifest
   - **Fix**: Add to your **app's** manifest at `android/app/src/main/AndroidManifest.xml`, NOT the plugin's manifest
   - **Example of CORRECT placement**:
     ```xml
     <manifest>
         <uses-permission ... />
         <application>
             <!-- HERE is where service and receiver go -->
             <service ... />
             <receiver ... />
         </application>
     </manifest>
     ```

2. **"ServiceNotFoundException" when downloading updates**
   - **Cause**: Missing WorkManager service declaration
   - **Symptoms**: App crashes when starting background download
   - **Fix**: Add the SystemForegroundService to your app's manifest as shown above
   - **Log message**: `java.lang.IllegalArgumentException: Service not registered: androidx.work.impl.foreground.SystemForegroundService`

3. **Notification buttons don't work**
   - **Cause**: Missing NotificationActionReceiver declaration
   - **Symptoms**: Update notification appears but buttons don't respond
   - **Fix**: Add the receiver with all three action filters to your app's manifest
   - **Test**: Send a test notification and verify buttons trigger actions

4. **"Permission denied" errors on Android 13+**
   - **Cause**: Missing runtime permission request for notifications
   - **Fix**: Request `POST_NOTIFICATIONS` permission at runtime
   - **Reference**: [Android 13 Notification Permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)

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
4. Set up your update server (see backend-template folder)

## Support

If you encounter any issues during installation:

- Check our [Testing Guide](../guides/testing-guide.md)
- Search existing [GitHub Issues](https://github.com/aoneahsan/native-update/issues)
- Create a new issue with detailed information about your setup

---

Made with ❤️ by Ahsan Mahmood
