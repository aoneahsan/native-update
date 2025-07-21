# Capacitor Native Update Example App

This example demonstrates all features of the Capacitor Native Update plugin.

## Features Demonstrated

### 1. Live Updates (OTA)

- Check for updates
- Download and install updates
- Background update strategy
- Rollback functionality
- Update channels

### 2. App Store Updates

- Check for native app updates
- Prompt for immediate updates
- Open app store

### 3. App Reviews

- Request in-app reviews
- Smart triggering logic
- Review eligibility checking

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure the plugin with your update server:

```typescript
// Edit src/services/update-service.ts
const UPDATE_CONFIG = {
  serverUrl: 'https://your-update-server.com',
  appId: 'your-app-id',
  publicKey: 'your-public-key',
};
```

3. Build and run:

```bash
npm run build
npx cap sync
npx cap run ios
# or
npx cap run android
```

## Update Server Setup

You'll need an update server that implements the following endpoints:

### Check for Updates

```
GET /check?channel={channel}&version={version}&appId={appId}
```

Response:

```json
{
  "available": true,
  "version": "1.1.0",
  "url": "https://your-server.com/bundles/1.1.0.zip",
  "mandatory": false,
  "notes": "Bug fixes and improvements",
  "checksum": "sha256:...",
  "signature": "base64..."
}
```

### Download Bundle

```
GET /bundles/{version}.zip
```

## Testing Live Updates

1. Build your web app
2. Create a ZIP bundle of your dist folder
3. Calculate SHA-256 checksum of the bundle
4. Upload to your update server
5. Use the example app to check and install updates

## Security Notes

- Always use HTTPS for update server
- Implement bundle signing for production
- Store public key securely in the app
- Never expose private keys
