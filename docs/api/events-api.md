# Events API Reference

Complete documentation for all events emitted by the Capacitor Native Update plugin.

## Event Listeners

### Adding Listeners

```typescript
// Add a listener
const listener = NativeUpdate.addListener('eventName', (data) => {
  console.log('Event data:', data);
});

// Remove a listener
listener.remove();

// Remove all listeners for an event
NativeUpdate.removeAllListeners('eventName');
```

## Live Update Events

### updateStateChanged

Fired when the update state changes during sync or download.

```typescript
NativeUpdate.addListener('updateStateChanged', (state) => {
  console.log('Update state:', state);
});
```

**Event Data:**
```typescript
{
  status: 'CHECKING' | 'DOWNLOADING' | 'READY' | 'FAILED' | 'INSTALLING';
  bundleId?: string;
  version?: string;
  previousState?: string;
  timestamp: number;
}
```

### downloadProgress

Fired periodically during bundle download.

```typescript
NativeUpdate.addListener('downloadProgress', (progress) => {
  console.log(`Download: ${progress.percent}%`);
});
```

**Event Data:**
```typescript
{
  percent: number;           // 0-100
  bytesDownloaded: number;   // Bytes downloaded so far
  totalBytes: number;        // Total bundle size
  bytesPerSecond: number;    // Download speed
  estimatedTime: number;     // Seconds remaining
  bundleId: string;          // Bundle being downloaded
}
```

## App Update Events

### appUpdateStateChanged

Fired when the native app update state changes.

```typescript
NativeUpdate.addListener('appUpdateStateChanged', (state) => {
  console.log('App update state:', state.status);
});
```

**Event Data:**
```typescript
{
  status: InstallStatus; // See InstallStatus enum
  installErrorCode?: number; // Error code if status is FAILED
}
```

### appUpdateProgress

Fired during app update download progress.

```typescript
NativeUpdate.addListener('appUpdateProgress', (progress) => {
  console.log(`Download progress: ${progress.percent}%`);
});
```

**Event Data:**
```typescript
{
  percent: number; // Download percentage (0-100)
  bytesDownloaded: number; // Bytes downloaded so far
  totalBytes: number; // Total download size
}
```

### appUpdateAvailable

Fired when a new app update is detected.

```typescript
NativeUpdate.addListener('appUpdateAvailable', (info) => {
  console.log(`Update available: ${info.availableVersion}`);
});
```

**Event Data:**
```typescript
{
  currentVersion: string;
  availableVersion: string;
  updatePriority: number; // 0-5, where 5 is critical
  updateSize?: number; // Update size in bytes
  releaseNotes?: string[]; // Release notes array
  storeUrl?: string; // App store URL
}
```

### appUpdateReady

Fired when the app update is downloaded and ready to install.

```typescript
NativeUpdate.addListener('appUpdateReady', (event) => {
  console.log('Update ready to install');
  // Prompt user to restart/install
});
```

**Event Data:**
```typescript
{
  message: string; // "Update downloaded and ready to install"
}
```

### appUpdateFailed

Fired when an app update fails.

```typescript
NativeUpdate.addListener('appUpdateFailed', (error) => {
  console.error('Update failed:', error.error);
});
```

**Event Data:**
```typescript
{
  error: string; // Error message
  code: string; // Error code
}
```

### appUpdateNotificationClicked

Fired when the user clicks on an update notification.

```typescript
NativeUpdate.addListener('appUpdateNotificationClicked', () => {
  console.log('User clicked update notification');
  // Navigate to update screen
});
```

**Event Data:** Empty object `{}`

### appUpdateInstallClicked

Fired when the user clicks the install button in an update notification.

```typescript
NativeUpdate.addListener('appUpdateInstallClicked', () => {
  console.log('User clicked install in notification');
  // Start update installation
});
```

**Event Data:** Empty object `{}`

## Background Update Events

### backgroundUpdateProgress

Fired during background update operations.

```typescript
NativeUpdate.addListener('backgroundUpdateProgress', (event) => {
  console.log('Background update status:', event.status);
});
```

**Event Data:**
```typescript
{
  type: BackgroundUpdateType;
  status: 'checking' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
```

### backgroundUpdateNotification

Fired when background update has a notification to show.

```typescript
NativeUpdate.addListener('backgroundUpdateNotification', (event) => {
  console.log('Update available:', event.updateAvailable);
});
```

**Event Data:**
```typescript
{
  type: BackgroundUpdateType;
  updateAvailable: boolean;
  version?: string;
  description?: string;
}
```

## Event Best Practices

### 1. Always Remove Listeners

```typescript
class UpdateManager {
  private listeners: PluginListenerHandle[] = [];

  setupListeners() {
    // Store listener references
    this.listeners.push(
      NativeUpdate.addListener('updateStateChanged', (state) => {
        this.handleStateChange(state);
      })
    );

    this.listeners.push(
      NativeUpdate.addListener('downloadProgress', (progress) => {
        this.updateProgressBar(progress.percent);
      })
    );
  }

  cleanup() {
    // Remove all listeners
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
  }
}
```

### 2. Handle All States

```typescript
function handleStateChange(state: UpdateStateChangedEvent) {
  switch (state.status) {
    case 'CHECKING':
      showLoader('Checking for updates...');
      break;
    case 'DOWNLOADING':
      showLoader('Downloading update...');
      break;
    case 'READY':
      hideLoader();
      promptUserToRestart();
      break;
    case 'FAILED':
      hideLoader();
      showError('Update failed. Please try again.');
      break;
    case 'INSTALLING':
      showLoader('Installing update...');
      break;
  }
}
```

### 3. Progress Updates

```typescript
function setupProgressTracking() {
  let lastUpdate = 0;

  NativeUpdate.addListener('downloadProgress', (progress) => {
    // Update UI at most once per second
    const now = Date.now();
    if (now - lastUpdate > 1000) {
      updateUI({
        percent: progress.percent,
        speed: formatBytes(progress.bytesPerSecond) + '/s',
        remaining: formatTime(progress.estimatedTime)
      });
      lastUpdate = now;
    }
  });
}
```

## Platform-Specific Notes

### iOS
- All events are supported
- Review events may not fire if StoreKit decides not to show the prompt

### Android
- All events are supported
- App update events only fire when using Google Play

### Web
- Limited event support
- No native app update events
- Review events will not fire