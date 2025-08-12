# Migration Guide: From CodePush to Capacitor Native Update

This guide helps you migrate from Microsoft CodePush to Capacitor Native Update.

## Key Differences

### Architecture
- **CodePush**: Centralized Microsoft-hosted service
- **Capacitor Native Update**: Self-hosted solution (you control the infrastructure)

### Features
- **CodePush**: OTA updates only
- **Capacitor Native Update**: OTA + native app updates + app reviews

### Security
- **CodePush**: Microsoft-managed security
- **Capacitor Native Update**: Your own security implementation

## Migration Steps

### 1. Backend Setup

First, you need to set up your own update server:

```bash
# Use our backend template
cd backend-template
npm install
npm start
```

### 2. Update Your App Code

Replace CodePush imports:

```typescript
// Old (CodePush)
import codePush from 'react-native-code-push';

// New (Capacitor Native Update)
import { CapacitorNativeUpdate } from 'capacitor-native-update';
```

### 3. Configure Plugin

Replace CodePush configuration:

```typescript
// Old (CodePush)
const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
  deploymentKey: 'YOUR_DEPLOYMENT_KEY',
};

// New (Capacitor Native Update)
await CapacitorNativeUpdate.configure({
  serverUrl: 'https://your-update-server.com',
  channel: 'production',
  autoCheck: true,
  publicKey: 'YOUR_PUBLIC_KEY',
});
```

### 4. Update Check Logic

Replace update checking:

```typescript
// Old (CodePush)
codePush.sync({
  updateDialog: true,
  installMode: codePush.InstallMode.IMMEDIATE,
});

// New (Capacitor Native Update)
const update = await CapacitorNativeUpdate.checkForUpdate();
if (update.available) {
  await CapacitorNativeUpdate.downloadUpdate();
  await CapacitorNativeUpdate.applyUpdate();
}
```

### 5. Bundle Creation

Replace release process:

```bash
# Old (CodePush)
code-push release-react MyApp ios -d Production

# New (Capacitor Native Update)
node tools/bundle-creator.js create ./www
node tools/bundle-signer.js sign bundle.zip private-key.pem
# Upload to your server
```

## Feature Mapping

| CodePush Feature | Capacitor Native Update |
|-----------------|------------------------|
| sync() | checkForUpdate() + downloadUpdate() + applyUpdate() |
| getUpdateMetadata() | getCurrentVersion() |
| notifyAppReady() | confirmUpdate() |
| restartApp() | applyUpdate() |
| clearUpdates() | rollback() |

## Migration Checklist

- [ ] Set up update server infrastructure
- [ ] Generate RSA key pair for signing
- [ ] Update app dependencies
- [ ] Replace CodePush API calls
- [ ] Update CI/CD pipeline
- [ ] Test update flow
- [ ] Implement rollback strategy
- [ ] Add monitoring

## Benefits After Migration

1. **Full Control**: Own your update infrastructure
2. **No Vendor Lock-in**: Not dependent on Microsoft
3. **Additional Features**: Native updates and app reviews
4. **Custom Analytics**: Implement your own tracking
5. **Flexible Deployment**: Use any CDN or server

## Common Issues

### Issue: Updates Not Downloading
- Check server URL is HTTPS
- Verify CORS configuration
- Ensure bundle is signed correctly

### Issue: Signature Verification Failed
- Verify public key matches private key
- Check bundle hasn't been modified
- Ensure base64 encoding is correct

## Need Help?

- See [Troubleshooting Guide](../guides/troubleshooting.md)
- Check [Server Requirements](../server-requirements.md)
- Review [Security Best Practices](./security-best-practices.md)