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

### sync()

Sync with update server and apply updates based on strategy.

```typescript
const result = await NativeUpdate.sync({
  installMode?: 'IMMEDIATE' | 'ON_NEXT_RESTART' | 'ON_NEXT_RESUME';
  minimumBackgroundDuration?: number; // Minimum background time (ms)
});
// Returns:
{
  status: 'UP_TO_DATE' | 'UPDATE_AVAILABLE' | 'UPDATE_INSTALLED' | 'ERROR';
  bundle?: BundleInfo;        // Bundle information if update available/installed
  error?: { code: string; message: string; };
}
```

### download(options)

Download a specific bundle version.

```typescript
const result = await NativeUpdate.download({
  version: string;            // Version to download
});
// Returns:
{
  bundleId: string;           // Unique bundle ID
  version: string;            // Bundle version
  path: string;              // Local path
  size: number;              // File size
  checksum: string;           // SHA-256 checksum
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
  keepLatest?: number;        // Keep N most recent versions
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

### pauseAutoUpdates()

Temporarily pause automatic update checks.

```typescript
await NativeUpdate.pauseAutoUpdates();
```

### resumeAutoUpdates()

Resume automatic update checks.

```typescript
await NativeUpdate.resumeAutoUpdates();
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

### error

Fired when an error occurs.

```typescript
NativeUpdate.addListener('error', (error) => {
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