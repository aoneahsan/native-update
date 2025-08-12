# Events API Reference

Complete documentation for all events emitted by the Capacitor Native Update plugin.

## Event Listeners

### Adding Listeners

```typescript
// Add a listener
const listener = CapacitorNativeUpdate.addListener('eventName', (data) => {
  console.log('Event data:', data);
});

// Remove a listener
listener.remove();

// Remove all listeners for an event
CapacitorNativeUpdate.removeAllListeners('eventName');
```

## Live Update Events

### updateStateChanged

Fired when the update state changes during sync or download.

```typescript
CapacitorNativeUpdate.addListener('updateStateChanged', (state) => {
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
CapacitorNativeUpdate.addListener('downloadProgress', (progress) => {
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

### updateInstalled

Fired when an update has been successfully installed.

```typescript
CapacitorNativeUpdate.addListener('updateInstalled', (update) => {
  console.log('Update installed:', update.version);
});
```

**Event Data:**
```typescript
{
  bundleId: string;
  version: string;
  previousVersion: string;
  installTime: number;
  willRestartApp: boolean;
}
```

### updateFailed

Fired when an update fails to download or install.

```typescript
CapacitorNativeUpdate.addListener('updateFailed', (error) => {
  console.error('Update failed:', error);
});
```

**Event Data:**
```typescript
{
  bundleId?: string;
  version?: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  canRetry: boolean;
  timestamp: number;
}
```

### rollbackOccurred

Fired when the app rolls back to a previous version.

```typescript
CapacitorNativeUpdate.addListener('rollbackOccurred', (rollback) => {
  console.log('Rolled back from:', rollback.failedVersion);
});
```

**Event Data:**
```typescript
{
  failedVersion: string;
  failedBundleId: string;
  rolledBackTo: string;
  reason: string;
  timestamp: number;
}
```

## App Update Events

### appUpdateStateChanged

Fired when native app update state changes. Android only.

```typescript
CapacitorNativeUpdate.addListener('appUpdateStateChanged', (state) => {
  console.log('App update state:', state);
});
```

**Event Data:**
```typescript
{
  installStatus: number;     // Android InstallStatus
  installErrorCode?: number;
  packageName: string;
  availableVersion: string;
}
```

**Install Status Codes:**
- `0` - Unknown
- `1` - Pending
- `2` - Downloading
- `3` - Installing
- `4` - Installed
- `5` - Failed
- `6` - Canceled
- `11` - Downloaded

### appUpdateProgress

Fired during flexible app update download. Android only.

```typescript
CapacitorNativeUpdate.addListener('appUpdateProgress', (progress) => {
  console.log('App update progress:', progress.percentComplete);
});
```

**Event Data:**
```typescript
{
  bytesDownloaded: number;
  totalBytesToDownload: number;
  percentComplete: number;
  downloadSpeed: number;     // Bytes per second
  estimatedTime: number;     // Seconds remaining
}
```

### appUpdateAvailable

Fired when an app update becomes available.

```typescript
CapacitorNativeUpdate.addListener('appUpdateAvailable', (update) => {
  console.log('App update available:', update.version);
});
```

**Event Data:**
```typescript
{
  currentVersion: string;
  availableVersion: string;
  updatePriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
  updateSize?: number;
  releaseNotes?: string;
  storeUrl: string;
}
```

## App Review Events

### reviewPromptDisplayed

Fired when a review prompt is shown to the user.

```typescript
CapacitorNativeUpdate.addListener('reviewPromptDisplayed', (event) => {
  analytics.track('review_prompt_shown');
});
```

**Event Data:**
```typescript
{
  platform: 'ios' | 'android' | 'web';
  method: 'in-app' | 'store-redirect';
  timestamp: number;
  sessionTime: number;       // Time in app before prompt
}
```

### reviewPromptDismissed

Fired when the review prompt is dismissed.

```typescript
CapacitorNativeUpdate.addListener('reviewPromptDismissed', (event) => {
  console.log('Review prompt dismissed');
});
```

**Event Data:**
```typescript
{
  platform: 'ios' | 'android' | 'web';
  userAction?: 'reviewed' | 'dismissed' | 'later';
  timestamp: number;
}
```

## Background Update Events

### backgroundCheckStarted

Fired when a background update check begins.

```typescript
CapacitorNativeUpdate.addListener('backgroundCheckStarted', (event) => {
  console.log('Background check started');
});
```

**Event Data:**
```typescript
{
  checkId: string;
  trigger: 'scheduled' | 'app-resume' | 'manual';
  timestamp: number;
}
```

### backgroundCheckCompleted

Fired when a background update check completes.

```typescript
CapacitorNativeUpdate.addListener('backgroundCheckCompleted', (result) => {
  console.log('Background check result:', result);
});
```

**Event Data:**
```typescript
{
  checkId: string;
  updateAvailable: boolean;
  version?: string;
  downloadStarted: boolean;
  duration: number;          // Check duration in ms
  timestamp: number;
}
```

### backgroundDownloadCompleted

Fired when a background download completes.

```typescript
CapacitorNativeUpdate.addListener('backgroundDownloadCompleted', (result) => {
  console.log('Background download completed');
});
```

**Event Data:**
```typescript
{
  bundleId: string;
  version: string;
  success: boolean;
  error?: string;
  downloadTime: number;      // Total download time
  willInstallOnResume: boolean;
}
```

## Error Events

### error

Generic error event for any plugin errors.

```typescript
CapacitorNativeUpdate.addListener('error', (error) => {
  console.error('Plugin error:', error);
  errorReporting.log(error);
});
```

**Event Data:**
```typescript
{
  code: string;              // Error code
  message: string;           // Human-readable message
  module: 'live-update' | 'app-update' | 'app-review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details?: any;             // Additional error context
  timestamp: number;
  stackTrace?: string;
}
```

## Analytics Events

### analyticsEvent

Fired for analytics tracking.

```typescript
CapacitorNativeUpdate.addListener('analyticsEvent', (event) => {
  // Forward to your analytics provider
  analytics.track(event.name, event.properties);
});
```

**Event Data:**
```typescript
{
  name: string;              // Event name
  properties: Record<string, any>;
  category: 'update' | 'review' | 'error' | 'performance';
  timestamp: number;
}
```

## Best Practices

### 1. Centralized Event Handling

```typescript
class UpdateEventManager {
  private listeners: PluginListenerHandle[] = [];
  
  init() {
    // Register all listeners
    this.listeners.push(
      CapacitorNativeUpdate.addListener('updateStateChanged', this.handleStateChange),
      CapacitorNativeUpdate.addListener('downloadProgress', this.handleProgress),
      CapacitorNativeUpdate.addListener('error', this.handleError)
    );
  }
  
  cleanup() {
    // Remove all listeners
    this.listeners.forEach(listener => listener.remove());
  }
  
  private handleStateChange = (state) => {
    // Centralized state handling
    updateUI(state);
    logEvent('update_state', state);
  };
  
  private handleProgress = (progress) => {
    // Update progress UI
    progressBar.setValue(progress.percent);
  };
  
  private handleError = (error) => {
    // Centralized error handling
    if (error.severity === 'critical') {
      showErrorDialog(error);
    }
    errorReporter.log(error);
  };
}
```

### 2. Event-Driven UI Updates

```typescript
// React example
function useUpdateState() {
  const [state, setState] = useState<UpdateState>('idle');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const listeners = [
      CapacitorNativeUpdate.addListener('updateStateChanged', (event) => {
        setState(event.status);
      }),
      CapacitorNativeUpdate.addListener('downloadProgress', (event) => {
        setProgress(event.percent);
      })
    ];
    
    return () => {
      listeners.forEach(l => l.remove());
    };
  }, []);
  
  return { state, progress };
}
```

### 3. Analytics Integration

```typescript
// Set up analytics forwarding
CapacitorNativeUpdate.addListener('analyticsEvent', (event) => {
  switch (analyticsProvider) {
    case 'firebase':
      firebase.analytics().logEvent(event.name, event.properties);
      break;
    case 'mixpanel':
      mixpanel.track(event.name, event.properties);
      break;
    case 'custom':
      customAnalytics.track(event);
      break;
  }
});
```