# Live Update API Reference

Complete API documentation for Live/OTA update functionality.

## Methods

### configure(options)

Configure the Live Update plugin with server settings and behavior options.

```typescript
await CapacitorNativeUpdate.configure({
  serverUrl: string;           // Update server URL (required)
  channel?: string;            // Update channel (default: "production")
  autoCheck?: boolean;         // Auto-check for updates (default: true)
  checkInterval?: number;      // Check interval in seconds (default: 3600)
  publicKey?: string;          // Base64 public key for signatures
  maxRetries?: number;         // Max download retries (default: 3)
  security?: {
    enforceHttps?: boolean;    // Require HTTPS (default: true)
    validateSignatures?: boolean; // Verify signatures (default: true)
    pinCertificates?: boolean; // Certificate pinning (default: false)
    certificateHashes?: string[]; // Certificate SHA-256 hashes
  };
});
```

### checkForUpdate()

Check if a new update is available.

```typescript
const result = await CapacitorNativeUpdate.checkForUpdate();
// Returns:
{
  available: boolean;          // Update available?
  version?: string;            // Available version
  url?: string;               // Download URL
  notes?: string;             // Release notes
  size?: number;              // Bundle size in bytes
  mandatoryUpdate?: boolean;  // Force update?
  checksum?: string;          // SHA-256 checksum
  signature?: string;         // RSA signature
}
```

### downloadUpdate(options?)

Download an available update with progress tracking.

```typescript
const result = await CapacitorNativeUpdate.downloadUpdate({
  onProgress?: (progress: {
    percent: number;          // 0-100
    bytesDownloaded: number;
    totalBytes: number;
  }) => void;
});
// Returns:
{
  bundleId: string;           // Unique bundle ID
  version: string;            // Bundle version
  path: string;              // Local path
  size: number;              // File size
  downloadTime: number;      // Download duration (ms)
}
```

### applyUpdate()

Apply a downloaded update (restarts the app).

```typescript
await CapacitorNativeUpdate.applyUpdate();
```

### sync(options?)

Sync with server and apply updates based on strategy.

```typescript
const result = await CapacitorNativeUpdate.sync({
  installMode?: 'IMMEDIATE' | 'ON_NEXT_RESTART' | 'ON_NEXT_RESUME';
  minimumBackgroundDuration?: number; // Minimum background time (ms)
});
// Returns:
{
  status: 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'UPDATE_INSTALLED' | 'ERROR';
  version?: string;
  error?: { code: string; message: string; };
}
```

### getCurrentBundle()

Get information about the currently active bundle.

```typescript
const bundle = await CapacitorNativeUpdate.getCurrentBundle();
// Returns:
{
  bundleId: string;
  version: string;
  path: string;
  downloadTime: number;
  size: number;
  status: 'ACTIVE' | 'PENDING' | 'FAILED';
  checksum: string;
  verified: boolean;
}
```

### getBundles()

List all downloaded bundles.

```typescript
const result = await CapacitorNativeUpdate.getBundles();
// Returns:
{
  bundles: Array<{
    bundleId: string;
    version: string;
    status: string;
    size: number;
    downloadTime: number;
  }>;
}
```

### setBundle(bundleId)

Set a specific bundle as active.

```typescript
await CapacitorNativeUpdate.setBundle(bundleId: string);
```

### deleteBundle(bundleId)

Delete a specific bundle or clean up old bundles.

```typescript
// Delete specific bundle
await CapacitorNativeUpdate.deleteBundle(bundleId: string);

// Or cleanup old bundles
await CapacitorNativeUpdate.deleteBundle({ 
  keepVersions: number // Keep N most recent versions
});
```

### reset()

Reset to the original app bundle.

```typescript
await CapacitorNativeUpdate.reset();
```

### notifyAppReady()

Notify that the app has successfully started with the new bundle.

```typescript
await CapacitorNativeUpdate.notifyAppReady();
```

### pauseAutoUpdates()

Temporarily pause automatic update checks.

```typescript
await CapacitorNativeUpdate.pauseAutoUpdates();
```

### resumeAutoUpdates()

Resume automatic update checks.

```typescript
await CapacitorNativeUpdate.resumeAutoUpdates();
```

### setChannel(channel)

Change the update channel.

```typescript
await CapacitorNativeUpdate.setChannel(channel: string);
```

### setUpdateUrl(url)

Change the update server URL.

```typescript
await CapacitorNativeUpdate.setUpdateUrl(url: string);
```

### validateUpdate(options)

Validate a bundle's integrity.

```typescript
const result = await CapacitorNativeUpdate.validateUpdate({
  bundlePath: string;
  checksum: string;
  signature?: string;
});
// Returns:
{
  isValid: boolean;
  details: {
    checksumValid: boolean;
    signatureValid?: boolean;
  };
}
```

## Events

### updateStateChanged

Fired when update state changes.

```typescript
CapacitorNativeUpdate.addListener('updateStateChanged', (state) => {
  console.log('State:', state.status);
  // state.status: 'CHECKING' | 'DOWNLOADING' | 'READY' | 'FAILED'
});
```

### downloadProgress

Fired during bundle download.

```typescript
CapacitorNativeUpdate.addListener('downloadProgress', (progress) => {
  console.log(`Progress: ${progress.percent}%`);
});
```

### error

Fired when an error occurs.

```typescript
CapacitorNativeUpdate.addListener('error', (error) => {
  console.error('Update error:', error.code, error.message);
});
```

## Error Codes

| Code | Description |
|------|-------------|
| `NETWORK_ERROR` | Network connection failed |
| `DOWNLOAD_ERROR` | Bundle download failed |
| `CHECKSUM_ERROR` | Checksum validation failed |
| `SIGNATURE_ERROR` | Signature verification failed |
| `STORAGE_ERROR` | Insufficient storage space |
| `PARSE_ERROR` | Invalid bundle format |
| `VERSION_ERROR` | Invalid version format |
| `INSECURE_URL` | HTTP URL when HTTPS required |