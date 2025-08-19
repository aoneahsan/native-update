# App Update API Reference

Complete API documentation for native app store update functionality.

## Methods

### getAppUpdateInfo()

Get information about available app updates in the app store.

```typescript
const result = await NativeUpdate.getAppUpdateInfo();
// Returns:
{
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  updatePriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  releaseNotes?: string;
  updateSize?: number;
  
  // Android specific
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  clientVersionStalenessDays?: number;
  
  // iOS specific
  updateURL?: string;
}
```

### performImmediateUpdate()

Perform an immediate (blocking) update. Android only - shows full-screen update UI.

```typescript
try {
  await NativeUpdate.performImmediateUpdate();
  // App will restart after update
} catch (error) {
  // User cancelled or update failed
}
```

### startFlexibleUpdate()

Start a flexible (background) update. Android only - downloads in background.

```typescript
await NativeUpdate.startFlexibleUpdate();
// Monitor progress with appUpdateProgress event
```

### completeFlexibleUpdate()

Complete a flexible update installation. Android only.

```typescript
await NativeUpdate.completeFlexibleUpdate();
// App will restart
```

### openAppStore()

Open the app store page for updates.

```typescript
await NativeUpdate.openAppStore({
  // Optional: specify app ID for iOS or package name for Android
  appId: 'your-app-id'
});
```

## Events

App update events are available for monitoring the native app update process. See the [Events API Reference](./events-api.md#app-update-events) for complete documentation of the following events:

- `appUpdateStateChanged` - Fired when update state changes
- `appUpdateProgress` - Monitor download progress for flexible updates
- `appUpdateAvailable` - Notified when a new version is available
- `appUpdateReady` - Update downloaded and ready to install
- `appUpdateFailed` - Update process failed
- `appUpdateNotificationClicked` - User clicked update notification
- `appUpdateInstallClicked` - User clicked install in notification

## Platform Differences

### Android (Google Play)

- Supports in-app updates via Play Core Library
- Two update modes: Immediate and Flexible
- Can force critical updates
- Shows native update UI
- Handles download and installation

### iOS (App Store)

- No in-app update API available
- Can only check version and open App Store
- Version checking requires backend service
- Updates handled entirely by App Store app

### Web

- Shows update notification only
- Can redirect to web app URL
- Version checking via backend

## Error Codes

| Code | Description |
|------|-------------|
| `UPDATE_NOT_AVAILABLE` | No update available |
| `UPDATE_IN_PROGRESS` | Update already downloading |
| `UPDATE_FAILED` | Update download/install failed |
| `USER_CANCELLED` | User cancelled the update |
| `PLATFORM_NOT_SUPPORTED` | Feature not supported on platform |
| `STORE_NOT_FOUND` | App store app not installed |
| `NETWORK_ERROR` | Network connection failed |

## Best Practices

1. **Check for updates on app start**
   ```typescript
   async function checkOnStart() {
     const result = await NativeUpdate.getAppUpdateInfo();
     if (result.updateAvailable && result.updatePriority === 'IMMEDIATE') {
       await NativeUpdate.performImmediateUpdate();
     }
   }
   ```

2. **Handle flexible updates**
   ```typescript
   // Start download
   await NativeUpdate.startFlexibleUpdate();
   
   // Note: Progress monitoring for native app updates is handled
   // internally by the platform. For Android, the Play Core library
   // shows its own UI. For custom progress tracking, use Live Updates
   // instead of native app updates.
   ```

3. **Fallback for iOS**
   ```typescript
   if (platform === 'ios') {
     const result = await NativeUpdate.getAppUpdateInfo();
     if (result.updateAvailable) {
       showUpdateDialog(() => {
         NativeUpdate.openAppStore();
       });
     }
   }
   ```