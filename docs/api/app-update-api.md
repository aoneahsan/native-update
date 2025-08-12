# App Update API Reference

Complete API documentation for native app store update functionality.

## Methods

### checkAppUpdate()

Check if a native app update is available in the app store.

```typescript
const result = await CapacitorNativeUpdate.checkAppUpdate();
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

### startImmediateUpdate()

Start an immediate (blocking) update. Android only - shows full-screen update UI.

```typescript
try {
  await CapacitorNativeUpdate.startImmediateUpdate();
  // App will restart after update
} catch (error) {
  // User cancelled or update failed
}
```

### startFlexibleUpdate()

Start a flexible (background) update. Android only - downloads in background.

```typescript
await CapacitorNativeUpdate.startFlexibleUpdate();
// Monitor progress with appUpdateProgress event
```

### completeFlexibleUpdate()

Complete a flexible update installation. Android only.

```typescript
await CapacitorNativeUpdate.completeFlexibleUpdate();
// App will restart
```

### getVersionInfo()

Get detailed version information.

```typescript
const info = await CapacitorNativeUpdate.getVersionInfo();
// Returns:
{
  currentVersion: string;      // e.g., "1.2.3"
  buildNumber: string;         // e.g., "123"
  packageName: string;         // e.g., "com.example.app"
  platform: 'ios' | 'android' | 'web';
  availableVersion?: string;   // From app store
  minimumVersion?: string;     // Minimum required version
}
```

### isMinimumVersionMet()

Check if the app meets minimum version requirements.

```typescript
const result = await CapacitorNativeUpdate.isMinimumVersionMet();
// Returns:
{
  isMet: boolean;
  currentVersion: string;
  minimumVersion: string;
  updateRequired: boolean;
}
```

### openAppStore()

Open the app store page for updates.

```typescript
await CapacitorNativeUpdate.openAppStore();
```

### getAppStoreUrl()

Get the app store URL without opening it.

```typescript
const result = await CapacitorNativeUpdate.getAppStoreUrl();
// Returns:
{
  url: string;  // e.g., "https://apps.apple.com/app/id123456789"
  platform: 'ios' | 'android' | 'web';
}
```

### getUpdateInstallState()

Get the current install state of a flexible update. Android only.

```typescript
const state = await CapacitorNativeUpdate.getUpdateInstallState();
// Returns:
{
  installStatus: number;    // Android InstallStatus code
  bytesDownloaded: number;
  totalBytesToDownload: number;
  percentComplete: number;
}
```

## Events

### appUpdateStateChanged

Fired when app update state changes. Android only.

```typescript
CapacitorNativeUpdate.addListener('appUpdateStateChanged', (state) => {
  console.log('Install status:', state.installStatus);
  // InstallStatus codes:
  // 0: Unknown
  // 1: Pending
  // 2: Downloading
  // 3: Installing
  // 4: Installed
  // 5: Failed
  // 6: Canceled
  // 11: Downloaded
});
```

### appUpdateProgress

Fired during flexible update download. Android only.

```typescript
CapacitorNativeUpdate.addListener('appUpdateProgress', (progress) => {
  console.log(`Downloaded: ${progress.bytesDownloaded}/${progress.totalBytesToDownload}`);
  console.log(`Progress: ${progress.percentComplete}%`);
});
```

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
     const result = await CapacitorNativeUpdate.checkAppUpdate();
     if (result.updateAvailable && result.updatePriority === 'IMMEDIATE') {
       await CapacitorNativeUpdate.startImmediateUpdate();
     }
   }
   ```

2. **Handle flexible updates**
   ```typescript
   // Start download
   await CapacitorNativeUpdate.startFlexibleUpdate();
   
   // Monitor progress
   const listener = CapacitorNativeUpdate.addListener('appUpdateProgress', (progress) => {
     updateProgressBar(progress.percentComplete);
   });
   
   // Complete when ready
   const stateListener = CapacitorNativeUpdate.addListener('appUpdateStateChanged', (state) => {
     if (state.installStatus === 11) { // Downloaded
       showUpdateReadyPrompt();
     }
   });
   ```

3. **Fallback for iOS**
   ```typescript
   if (platform === 'ios') {
     const result = await CapacitorNativeUpdate.checkAppUpdate();
     if (result.updateAvailable) {
       showUpdateDialog(() => {
         CapacitorNativeUpdate.openAppStore();
       });
     }
   }
   ```