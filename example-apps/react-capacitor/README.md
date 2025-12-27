# React + Capacitor Example

A **simple, focused** example demonstrating OTA (Over-The-Air) updates with the `native-update` plugin.

## 🎯 Purpose

This example shows the basic workflow of checking for, downloading, and applying OTA updates in a Capacitor app. **No unnecessary complexity** - just the plugin working.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm installed
- A running backend server (see `example-apps/node-express` or `example-apps/firebase-backend`)

### Installation

```bash
# From the root of the monorepo
pnpm install

# Navigate to this example
cd example-apps/react-capacitor

# Install dependencies (if not already installed from root)
pnpm install
```

### Development

```bash
# Start the dev server
pnpm start

# Open http://localhost:5173
```

### Build for Mobile

```bash
# Build the web assets
pnpm build

# Sync with Capacitor
pnpm cap:sync

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

## 📱 How to Test OTA Updates

### Step 1: Start Backend Server

Choose one of the backend examples and start it:

```bash
# Option 1: Node.js + Express
cd example-apps/node-express
pnpm start

# Option 2: Firebase Functions
cd example-apps/firebase-backend
pnpm serve
```

### Step 2: Configure Server URL

Update the server URL in `src/App.tsx` if your backend is running on a different port:

```typescript
await NativeUpdate.configure({
  serverUrl: 'http://localhost:3000/api',  // Update this
  autoCheck: false,
  channel: 'production',
});
```

### Step 3: Test the Update Flow

1. **Click "Check for Updates"** - Checks if a new version is available
2. **Click "Download Update"** - Downloads the new bundle
3. **Click "Apply Update & Reload"** - Applies the update and reloads the app

### Step 4: Deploy a New Version

To test that updates actually work:

1. **Change the demo text** in `src/App.tsx`:
   ```tsx
   <p>
     ✨ <strong>This is version 2.0!</strong> ✨
   </p>
   ```

2. **Build a new bundle:**
   ```bash
   pnpm build
   ```

3. **Upload to your backend** (see backend README for upload instructions)

4. **Check for updates in the app** - You should see the new text after applying the update!

## 📂 Project Structure

```
react-capacitor/
├── src/
│   ├── App.tsx       # Single component with all logic
│   ├── App.css       # Simple styles
│   └── main.tsx      # Entry point
├── public/           # Static assets
├── capacitor.config.ts
├── package.json
└── README.md
```

## 🎨 Features Demonstrated

- ✅ **Plugin initialization**
- ✅ **Check for updates** manually
- ✅ **Download progress** tracking
- ✅ **Apply updates** and reload app
- ✅ **Error handling**
- ✅ **Status updates** for user feedback

## 🔧 Configuration Options

The plugin is configured with minimal options for simplicity:

```typescript
{
  serverUrl: 'http://localhost:3000/api',  // Backend server URL
  autoCheck: false,                        // Manual check only
  channel: 'production',                   // Update channel
}
```

For all available options, see the main plugin documentation.

## 🐛 Troubleshooting

### "Error: Failed to initialize"

- **Cause:** Backend server not running or unreachable
- **Solution:** Start your backend server and ensure the `serverUrl` is correct

### "No updates available"

- **Cause:** No new version uploaded to backend
- **Solution:** Build and upload a new bundle to your backend server

### App doesn't reload after applying update

- **Cause:** Update might have failed silently
- **Solution:** Check the browser console for errors

## 📚 Next Steps

- Read the [full plugin documentation](../../docs/)
- Try the [Node.js backend example](../node-express/)
- Try the [Firebase backend example](../firebase-backend/)
- Learn about [bundle signing and security](../../docs/BUNDLE_SIGNING.md)

## 💡 Tips

1. **Start simple:** Get basic updates working before adding security features
2. **Use HTTPS in production:** The demo uses HTTP for simplicity, but always use HTTPS in production
3. **Test thoroughly:** Test the complete update flow on actual devices, not just in browser
4. **Monitor backend:** Check your backend logs to see update requests

---

**Built with ❤️ by Ahsan Mahmood** | [aoneahsan.com](https://aoneahsan.com)
