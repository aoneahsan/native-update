# Migration Guide

## Migrating from Other Update Solutions

### From Capacitor Live Updates (Official)

If you're migrating from the official Capacitor Live Updates plugin:

1. **Update imports**:

```typescript
// Before
import { LiveUpdates } from '@capacitor/live-updates';

// After
import { CapacitorNativeUpdate } from 'capacitor-native-update';
```

2. **Update configuration**:

```typescript
// Before
await LiveUpdates.configure({
  appId: 'your-app-id',
  channel: 'production',
  autoUpdateMethod: 'background',
});

// After
await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'your-app-id',
    serverUrl: 'https://your-server.com',
    channel: 'production',
    updateStrategy: 'background',
    publicKey: 'your-public-key',
  },
});
```

3. **Update method calls**:

```typescript
// Before
const result = await LiveUpdates.sync();

// After
const result = await CapacitorNativeUpdate.sync();
```

### From Capgo Capacitor Updater

If you're migrating from @capgo/capacitor-updater:

1. **Bundle management differences**:
   - Our plugin uses a different bundle storage mechanism
   - You'll need to re-download any active bundles
   - Bundle IDs are generated differently

2. **API differences**:

```typescript
// Capgo
import { CapacitorUpdater } from '@capgo/capacitor-updater';
await CapacitorUpdater.download({ url, version });

// Capacitor Native Update
import { CapacitorNativeUpdate } from 'capacitor-native-update';
await CapacitorNativeUpdate.download({
  url,
  version,
  checksum: 'required-checksum',
});
```

3. **Security enhancements**:
   - Checksum is now required for all downloads
   - HTTPS is enforced by default
   - Public key verification is built-in

### From Ionic Appflow

If you're migrating from Ionic Appflow:

1. **Self-hosted server required**:
   - Unlike Appflow, this plugin requires your own update server
   - See our server implementation guide for details

2. **Channel management**:

```typescript
// Similar channel concept
await CapacitorNativeUpdate.setChannel('production');
```

3. **Additional features**:
   - Native app update checks
   - In-app review integration
   - More granular security controls

## Breaking Changes

### Version 1.0.0

This is the initial release, but here are key differences from similar plugins:

1. **Required parameters**:
   - `checksum` is required for all bundle downloads
   - `serverUrl` must use HTTPS (unless explicitly disabled)

2. **Security by default**:
   - HTTPS enforcement is on by default
   - Signature verification is recommended
   - Input validation cannot be disabled

3. **Unified API**:
   - All update types (live, native, reviews) in one plugin
   - Single configuration object
   - Consistent error handling

## Data Migration

If you have existing bundles from another solution:

```typescript
// Clear old data and start fresh
await CapacitorNativeUpdate.reset();

// Or manually migrate bundles
const oldBundles = getOldBundles(); // Your migration logic
for (const bundle of oldBundles) {
  // Re-download with new security requirements
  await CapacitorNativeUpdate.download({
    url: bundle.url,
    version: bundle.version,
    checksum: await calculateChecksum(bundle.url),
  });
}
```

## Configuration Migration

### Old Configuration Patterns

```typescript
// CodePush style
codePush.sync({
  deploymentKey: 'key',
  installMode: codePush.InstallMode.IMMEDIATE,
});

// Convert to:
await CapacitorNativeUpdate.sync({
  updateMode: 'immediate',
});
```

### Environment-Specific Config

```typescript
const config = {
  liveUpdate: {
    serverUrl: process.env.UPDATE_SERVER_URL,
    channel: process.env.UPDATE_CHANNEL || 'production',
    publicKey: process.env.UPDATE_PUBLIC_KEY,
  },
};

await CapacitorNativeUpdate.configure(config);
```

## Troubleshooting Migration

### Common Issues

1. **"Checksum required" error**:
   - Calculate SHA-256 checksum of your bundles
   - Include in download request

2. **"HTTPS required" error**:
   - Update server URLs to use HTTPS
   - Or disable enforcement (not recommended)

3. **Bundle compatibility**:
   - Bundles from other systems won't work directly
   - Re-package and sign your bundles

### Getting Help

- Check our [example app](../example) for implementation patterns
- Review the [API documentation](../API.md)
- File issues on GitHub for migration problems
