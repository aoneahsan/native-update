# Capacitor Native Update Example App

⚠️ **IMPORTANT: This example app requires a backend server to function properly!** ⚠️

This example demonstrates all features of the Capacitor Native Update plugin. However, **it will NOT work out of the box** without setting up a compatible update server.

## ⚠️ Backend Server Requirement

**This example app is for demonstration purposes only and shows how to integrate the Capacitor Native Update plugin into your application. To actually test the update functionality, you MUST:**

1. **Set up your own update server** that implements the required API endpoints
2. **Configure the example app** with your server's URL and credentials
3. **Deploy update bundles** to your server

Without a backend server, the following features will NOT work:
- ❌ Live/OTA updates (checking, downloading, installing)
- ❌ Update version checking
- ❌ Bundle downloads
- ❌ Update manifests

**Note:** App reviews and native app store update checks may work without a server, but live updates absolutely require a backend implementation.

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

## Backend Server Options

Since this example app requires a backend server, you have several options:

### Option 1: Use the Server Example (Recommended for Testing)
Check out the `/server-example` directory in this repository for a reference implementation. This provides a basic Node.js server that implements all required endpoints.

### Option 2: Build Your Own Server
Implement your own server following the API specification below. You can use any technology stack (Node.js, Python, Java, etc.).

### Option 3: Use a Commercial Service
Several services provide OTA update capabilities for Capacitor/Cordova apps. Research and choose one that fits your needs.

## Update Server Setup

⚠️ **Remember: Without one of the above server options, this example will not demonstrate live update functionality!**

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
