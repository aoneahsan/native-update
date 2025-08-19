# Background Update API Reference

Complete API documentation for background update functionality.

## Methods

### enableBackgroundUpdates(config)

Enable background update checking.

```typescript
await NativeUpdate.enableBackgroundUpdates({
  checkInterval: 3600000,           // Check every hour (in ms)
  requireWifi: true,                // Only check on WiFi
  requireCharging: false,           // Don't require charging
  updateTypes: ['live', 'native'],  // Check both update types
  notificationConfig: {
    enabled: true,
    title: 'Update Available',
    autoCancel: true
  }
});
```

### disableBackgroundUpdates()

Disable all background update checks.

```typescript
await NativeUpdate.disableBackgroundUpdates();
```

### getBackgroundUpdateStatus()

Get current background update configuration and status.

```typescript
const status = await NativeUpdate.getBackgroundUpdateStatus();
// Returns:
{
  enabled: boolean;
  lastCheckTime?: number;
  nextScheduledCheck?: number;
  checkInterval?: number;
  updateTypes: string[];
  notificationEnabled: boolean;
}
```

### scheduleBackgroundCheck(options)

Schedule a one-time background check.

```typescript
await NativeUpdate.scheduleBackgroundCheck({
  delay: 60000,  // Check in 1 minute
  type: 'live'   // Check for live updates only
});
```

### triggerBackgroundCheck()

Immediately trigger a background update check.

```typescript
const result = await NativeUpdate.triggerBackgroundCheck();
// Returns:
{
  liveUpdateAvailable: boolean;
  nativeUpdateAvailable: boolean;
  error?: string;
}
```

### setNotificationPreferences(preferences)

Configure notification preferences for background updates.

```typescript
await NativeUpdate.setNotificationPreferences({
  enabled: true,
  showProgress: true,
  soundEnabled: false,
  vibrationEnabled: true,
  ledColor: '#00FF00',
  importance: 'HIGH'
});
```

### getNotificationPermissions()

Check current notification permissions.

```typescript
const permissions = await NativeUpdate.getNotificationPermissions();
// Returns:
{
  granted: boolean;
  canRequestPermission: boolean;
  permanentlyDenied: boolean;
}
```

### requestNotificationPermissions()

Request notification permissions from the user.

```typescript
const result = await NativeUpdate.requestNotificationPermissions();
// Returns:
{
  granted: boolean;
  permanentlyDenied: boolean;
}
```

## Events

### backgroundUpdateProgress

Fired during background update operations.

```typescript
NativeUpdate.addListener('backgroundUpdateProgress', (event) => {
  console.log('Background update:', event.status);
  // event.type: 'live' | 'native'
  // event.status: 'checking' | 'downloading' | 'completed' | 'failed'
});
```

### backgroundUpdateNotification

Fired when background check finds an update.

```typescript
NativeUpdate.addListener('backgroundUpdateNotification', (event) => {
  console.log('Update available:', event.updateAvailable);
  // event.type: 'live' | 'native'
  // event.version: string
});
```

## Platform Notes

### Android
- Uses WorkManager for reliable scheduling
- Respects battery optimization settings
- Requires notification permission for user alerts

### iOS
- Uses BackgroundTasks framework
- Limited by iOS background execution policies
- May not run exactly at scheduled times

### Web
- Uses Service Workers when available
- Falls back to periodic checks when app is active