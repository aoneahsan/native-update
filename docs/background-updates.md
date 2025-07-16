# Background Update Feature

The Background Update feature allows your app to check for updates automatically while running in the background, providing a seamless user experience with native notifications.

## Features

### Core Functionality
- **Background Update Checking**: Automatically check for app and live updates while the app is not active
- **Native Notifications**: Send native device notifications when updates are available
- **Configurable Intervals**: Set custom check intervals and update types
- **Battery Optimization**: Respect system battery saving modes and constraints
- **Cross-Platform**: Works on iOS (BGTaskScheduler) and Android (WorkManager)

### Platform-Specific Implementation
- **iOS**: Uses BGTaskScheduler for background tasks and UNUserNotificationCenter for notifications
- **Android**: Uses WorkManager for background processing and NotificationManager for notifications
- **Web**: Uses Notification API and intervals for fallback functionality

## Configuration

### Basic Setup

```typescript
import { CapacitorNativeUpdate, BackgroundUpdateType } from 'capacitor-native-update';

// Configure the plugin with background updates
await CapacitorNativeUpdate.configure({
  backgroundUpdate: {
    enabled: true,
    checkInterval: 24 * 60 * 60 * 1000, // 24 hours
    updateTypes: [BackgroundUpdateType.BOTH],
    autoInstall: false,
    respectBatteryOptimization: true,
    requireWifi: false,
    notificationPreferences: {
      title: 'App Update Available',
      description: 'A new version is ready to install',
      soundEnabled: true,
      vibrationEnabled: true,
      showActions: true,
      actionLabels: {
        updateNow: 'Update Now',
        updateLater: 'Later',
        dismiss: 'Not Now'
      }
    }
  }
});
```

### Advanced Configuration

```typescript
// Advanced background update configuration
await CapacitorNativeUpdate.configure({
  backgroundUpdate: {
    enabled: true,
    checkInterval: 12 * 60 * 60 * 1000, // 12 hours
    updateTypes: [BackgroundUpdateType.APP_UPDATE, BackgroundUpdateType.LIVE_UPDATE],
    autoInstall: true, // Only for live updates
    respectBatteryOptimization: true,
    allowMeteredConnection: false,
    minimumBatteryLevel: 20,
    requireWifi: true,
    maxRetries: 3,
    retryDelay: 5000,
    notificationPreferences: {
      title: 'MyApp Update',
      description: 'New features and improvements are available',
      iconName: 'update_icon',
      soundEnabled: true,
      vibrationEnabled: true,
      showActions: true,
      channelId: 'app_updates',
      channelName: 'App Updates',
      priority: 'high',
      actionLabels: {
        updateNow: 'Install Now',
        updateLater: 'Remind Me Later',
        dismiss: 'Skip This Version'
      }
    }
  }
});
```

## API Methods

### Enable Background Updates

```typescript
await CapacitorNativeUpdate.enableBackgroundUpdates({
  enabled: true,
  checkInterval: 24 * 60 * 60 * 1000,
  updateTypes: [BackgroundUpdateType.BOTH]
});
```

### Disable Background Updates

```typescript
await CapacitorNativeUpdate.disableBackgroundUpdates();
```

### Get Background Update Status

```typescript
const status = await CapacitorNativeUpdate.getBackgroundUpdateStatus();
console.log('Background updates enabled:', status.enabled);
console.log('Last check:', new Date(status.lastCheckTime));
console.log('Next check:', new Date(status.nextCheckTime));
```

### Trigger Manual Check

```typescript
const result = await CapacitorNativeUpdate.triggerBackgroundCheck();
if (result.updatesFound) {
  console.log('Updates found!', result.appUpdate, result.liveUpdate);
}
```

### Configure Notifications

```typescript
// Set notification preferences
await CapacitorNativeUpdate.setNotificationPreferences({
  title: 'Custom Update Title',
  description: 'Custom update message',
  soundEnabled: true,
  vibrationEnabled: true,
  showActions: true,
  actionLabels: {
    updateNow: 'Install',
    updateLater: 'Later',
    dismiss: 'Skip'
  }
});

// Request notification permissions
const granted = await CapacitorNativeUpdate.requestNotificationPermissions();
if (granted) {
  console.log('Notification permissions granted');
}

// Check permission status
const permissions = await CapacitorNativeUpdate.getNotificationPermissions();
console.log('Permissions granted:', permissions.granted);
```

## Event Listeners

### Background Update Progress

```typescript
CapacitorNativeUpdate.addListener('backgroundUpdateProgress', (event) => {
  console.log('Background update progress:', event.status, event.percent);
});
```

### Background Update Notifications

```typescript
CapacitorNativeUpdate.addListener('backgroundUpdateNotification', (event) => {
  console.log('Notification action:', event.action);
  
  switch (event.action) {
    case 'tapped':
      // User tapped notification
      break;
    case 'update_now':
      // User chose to update now
      break;
    case 'update_later':
      // User chose to update later
      break;
    case 'dismiss':
      // User dismissed notification
      break;
  }
});
```

## Platform-Specific Setup

### iOS Setup

Add to your `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>background-app-refresh</string>
  <string>background-processing</string>
</array>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
  <string>com.capacitor.native.update.background</string>
</array>
```

### Android Setup

Add to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

## Best Practices

### Battery Optimization
- Set `respectBatteryOptimization: true` to work within system constraints
- Use reasonable check intervals (not less than 15 minutes)
- Consider `requireWifi: true` for large updates

### User Experience
- Always request notification permissions before enabling background updates
- Provide clear notification messages and actions
- Handle notification actions appropriately
- Allow users to disable background updates in settings

### Performance
- Use `BackgroundUpdateType.APP_UPDATE` for critical updates only
- Use `BackgroundUpdateType.LIVE_UPDATE` for content updates
- Use `BackgroundUpdateType.BOTH` sparingly to avoid excessive battery usage

## Error Handling

```typescript
try {
  await CapacitorNativeUpdate.enableBackgroundUpdates(config);
} catch (error) {
  console.error('Failed to enable background updates:', error);
}

// Listen for background update errors
CapacitorNativeUpdate.addListener('backgroundUpdateProgress', (event) => {
  if (event.status === 'failed' && event.error) {
    console.error('Background update failed:', event.error);
  }
});
```

## Configuration Options

### BackgroundUpdateConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable background updates |
| `checkInterval` | number | `86400000` | Check interval in milliseconds (24 hours) |
| `updateTypes` | BackgroundUpdateType[] | `['both']` | Types of updates to check for |
| `autoInstall` | boolean | `false` | Auto-install updates (live updates only) |
| `respectBatteryOptimization` | boolean | `true` | Respect system battery optimization |
| `allowMeteredConnection` | boolean | `false` | Allow updates on metered connections |
| `minimumBatteryLevel` | number | `20` | Minimum battery level (%) |
| `requireWifi` | boolean | `false` | Require WiFi connection |
| `maxRetries` | number | `3` | Maximum retry attempts |
| `retryDelay` | number | `5000` | Retry delay in milliseconds |

### NotificationPreferences

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `'App Update Available'` | Notification title |
| `description` | string | `'A new version is available'` | Notification description |
| `soundEnabled` | boolean | `true` | Enable notification sound |
| `vibrationEnabled` | boolean | `true` | Enable notification vibration |
| `showActions` | boolean | `true` | Show notification action buttons |
| `priority` | string | `'default'` | Notification priority |
| `actionLabels` | object | See defaults | Custom action button labels |

## Troubleshooting

### iOS Issues
- Ensure background app refresh is enabled in device settings
- Check that the app has notification permissions
- Verify BGTaskScheduler identifiers in Info.plist

### Android Issues
- Check that the app is not in battery optimization whitelist
- Ensure notification permissions are granted
- Verify WorkManager dependencies are included

### Common Issues
- Background tasks may be limited by the OS
- Notifications may not work without proper permissions
- Battery optimization can prevent background execution

## Example Implementation

```typescript
class BackgroundUpdateManager {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Request notification permissions first
    const granted = await CapacitorNativeUpdate.requestNotificationPermissions();
    if (!granted) {
      console.warn('Notification permissions not granted');
      return;
    }

    // Configure background updates
    await CapacitorNativeUpdate.configure({
      backgroundUpdate: {
        enabled: true,
        checkInterval: 24 * 60 * 60 * 1000, // 24 hours
        updateTypes: [BackgroundUpdateType.BOTH],
        autoInstall: false,
        respectBatteryOptimization: true,
        notificationPreferences: {
          title: 'MyApp Update',
          description: 'New features are available',
          showActions: true,
          actionLabels: {
            updateNow: 'Install Now',
            updateLater: 'Later',
            dismiss: 'Skip'
          }
        }
      }
    });

    // Set up event listeners
    CapacitorNativeUpdate.addListener('backgroundUpdateNotification', (event) => {
      this.handleNotificationAction(event.action);
    });

    this.isInitialized = true;
  }

  private handleNotificationAction(action: string) {
    switch (action) {
      case 'update_now':
        this.performUpdate();
        break;
      case 'update_later':
        this.scheduleReminder();
        break;
      case 'dismiss':
        this.dismissUpdate();
        break;
    }
  }

  private async performUpdate() {
    // Implement your update logic here
    console.log('Performing update...');
  }

  private scheduleReminder() {
    // Schedule a reminder for later
    console.log('Scheduling reminder...');
  }

  private dismissUpdate() {
    // Handle dismissal
    console.log('Update dismissed');
  }
}

// Usage
const updateManager = new BackgroundUpdateManager();
await updateManager.initialize();
```

This comprehensive background update feature provides a robust solution for keeping your app updated automatically while providing excellent user experience through native notifications and proper system integration.