# Live Update API Reference

Complete API documentation for Live/OTA update functionality.

## Methods

### configure(options)

Configure the Live Update plugin with server settings and behavior options.

```typescript
await NativeUpdate.configure({
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

### sync(options?)

Sync with update server and apply updates based on strategy.

```typescript
const result = await NativeUpdate.sync({
  channel?: string;           // Update channel (optional)
  updateMode?: UpdateMode;    // Update mode (optional)
});
// Returns:
{
  status: SyncStatus;         // 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'UPDATE_INSTALLED' | 'ERROR'
  version?: string;           // Version if update available
  description?: string;       // Update description
  mandatory?: boolean;        // Is update mandatory
  error?: UpdateError;        // Error details if status is ERROR
}
```

### download(options)

Download a specific bundle version.

```typescript
const result = await NativeUpdate.download({
  url: string;                // Bundle URL (required)
  version: string;            // Version to download (required)
  checksum: string;           // Expected SHA-256 checksum (required)
  signature?: string;         // Optional bundle signature
  maxRetries?: number;        // Max download retries
  timeout?: number;           // Download timeout in ms
});
// Returns:
{
  bundleId: string;           // Unique bundle ID
  version: string;            // Bundle version
  path: string;              // Local path
  downloadTime: number;       // Download timestamp
  size: number;              // File size
  status: BundleStatus;       // Bundle status
  checksum: string;           // SHA-256 checksum
  signature?: string;         // Bundle signature if provided
  verified: boolean;          // Signature verification status
  metadata?: Record<string, unknown>; // Optional metadata
}
```

### set(bundle)

Set the active bundle.

```typescript
await NativeUpdate.set({
  bundleId: string;
  version: string;
  checksum: string;
});
```

### reload()

Reload the app with current bundle.

```typescript
await NativeUpdate.reload();
```

### current()

Get current bundle info.

```typescript
const bundle = await NativeUpdate.current();
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

### list()

List all downloaded bundles.

```typescript
const bundles = await NativeUpdate.list();
// Returns: Array<BundleInfo>
```

### delete(options)

Delete bundles.

```typescript
await NativeUpdate.delete({
  bundleId?: string;          // Delete specific bundle
  keepVersions?: number;      // Keep N most recent versions
  olderThan?: number;         // Delete bundles older than timestamp
});
```

### reset()

Reset to the original app bundle.

```typescript
await NativeUpdate.reset();
```

### notifyAppReady()

Notify that the app has successfully started with the new bundle.

```typescript
await NativeUpdate.notifyAppReady();
```


### setChannel(channel)

Change the update channel.

```typescript
await NativeUpdate.setChannel(channel: string);
```

### setUpdateUrl(url)

Change the update server URL.

```typescript
await NativeUpdate.setUpdateUrl(url: string);
```

### validateUpdate(options)

Validate a bundle's integrity.

```typescript
const result = await NativeUpdate.validateUpdate({
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
NativeUpdate.addListener('updateStateChanged', (state) => {
  console.log('State:', state.status);
  // state.status: 'CHECKING' | 'DOWNLOADING' | 'READY' | 'FAILED'
});
```

### downloadProgress

Fired during bundle download.

```typescript
NativeUpdate.addListener('downloadProgress', (progress) => {
  console.log(`Progress: ${progress.percent}%`);
});
```

### backgroundUpdateProgress

Fired during background update operations.

```typescript
NativeUpdate.addListener('backgroundUpdateProgress', (progress) => {
  console.log('Background update:', progress.status);
});
```

### backgroundUpdateNotification

Fired when background update notifications are triggered.

```typescript
NativeUpdate.addListener('backgroundUpdateNotification', (notification) => {
  console.log('Update notification:', notification.type);
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