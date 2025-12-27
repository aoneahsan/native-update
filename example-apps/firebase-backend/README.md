# Firebase Functions Backend Example

A **simple, serverless** backend for demonstrating OTA updates with the `native-update` plugin using Firebase.

## 🎯 Purpose

This example provides a serverless backend using Firebase Cloud Functions, Firestore, and Storage. **No complex authentication, no advanced features** - just the essentials for OTA updates.

## 🚀 Quick Start

### Prerequisites

- Node.js 22 and pnpm installed
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project

### Installation

```bash
# From the monorepo root
pnpm install

# Or from this directory
cd example-apps/firebase-backend
pnpm install
```

### Firebase Setup

1. **Create a Firebase project** at https://console.firebase.google.com

2. **Login to Firebase CLI:**
```bash
firebase login
```

3. **Initialize Firebase (if not already):**
```bash
firebase init
# Select: Functions, Firestore, Storage
# Choose your project
# Use TypeScript
# Use existing files when prompted
```

4. **Enable Firestore and Storage** in Firebase Console

### Development

```bash
# Build the functions
pnpm build

# Run locally with emulators
pnpm serve

# The function will be available at http://localhost:5001/YOUR_PROJECT/us-central1/api
```

### Deploy to Firebase

```bash
pnpm deploy
```

After deployment, your function URL will be:
```
https://us-central1-YOUR_PROJECT.cloudfunctions.net/api
```

## 📡 API Endpoints

All endpoints are prefixed with your Cloud Function URL.

### Health Check
```http
GET /health
```

Returns server status.

### Check for Updates
```http
GET /api/updates/check?version=1.0.0&channel=production
```

**Query Parameters:**
- `version` - Current app version
- `channel` - Update channel (default: `production`)

**Response:**
```json
{
  "available": true,
  "latestVersion": "1.1.0",
  "downloadUrl": "https://storage.googleapis.com/...",
  "size": 1024000,
  "releaseNotes": "Bug fixes and improvements"
}
```

### Upload Bundle
```http
POST /api/bundles/upload
```

**Body (multipart/form-data):**
- `bundle` - ZIP file
- `version` - Version number
- `channel` - Channel name (default: "production")
- `releaseNotes` - Optional release notes

**Example with curl:**
```bash
curl -F "bundle=@bundle.zip" \
     -F "version=1.1.0" \
     -F "channel=production" \
     https://YOUR_FUNCTION_URL/api/bundles/upload
```

### List Bundles
```http
GET /api/bundles
```

Returns all bundles from Firestore.

## 📂 Project Structure

```
firebase-backend/
├── src/
│   └── index.ts          # Single file with all Cloud Function logic
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules          # Storage security rules
├── package.json           # Dependencies
└── README.md
```

## 💾 Data Storage

- **Bundles (files):** Firebase Storage in `bundles/{channel}/` path
- **Metadata:** Firestore collection `bundles`
- **Serverless:** Auto-scales with Firebase

## 🔧 Configuration

### Firestore Structure

**Collection: `bundles`**
```typescript
{
  id: string;
  version: string;
  channel: string;
  downloadUrl: string;
  size: number;
  releaseNotes?: string;
  timestamp: Timestamp;
  active: boolean;
}
```

### Required Firestore Index

The function requires an index on:
- Collection: `bundles`
- Fields: `channel` (Ascending), `active` (Ascending), `timestamp` (Descending)

Firebase will prompt you to create this index when you first run the query.

## 🧪 Testing

### 1. Start Emulators
```bash
pnpm serve
```

### 2. Upload a Bundle
```bash
# Build your app first
cd ../react-capacitor
pnpm build
cd dist
zip -r ../bundle.zip .

# Upload (replace URL with your emulator URL)
cd ..
curl -F "bundle=@bundle.zip" \
     -F "version=1.1.0" \
     http://localhost:5001/YOUR_PROJECT/us-central1/api/api/bundles/upload
```

### 3. Check for Updates
```bash
curl "http://localhost:5001/YOUR_PROJECT/us-central1/api/api/updates/check?version=1.0.0"
```

## 📚 Integration with Frontend

In your React app, use the deployed function URL:

```typescript
await NativeUpdate.configure({
  serverUrl: 'https://us-central1-YOUR_PROJECT.cloudfunctions.net/api/api',
  autoCheck: false,
  channel: 'production',
});
```

## 🐛 Troubleshooting

### "Error: Could not load the default credentials"
- Make sure you're logged in: `firebase login`
- Run `firebase init` to set up the project

### "Missing index" error
- Click the link in the error message to create the index
- Or create it manually in Firebase Console

### CORS errors
- The function uses `cors({ origin: true })` which allows all origins
- For production, configure specific origins

### Upload fails
- Check Firebase Storage rules allow writes
- Ensure file size is under 50MB limit

## 💡 Tips

1. **Use emulators:** Develop locally with Firebase emulators before deploying
2. **Monitor costs:** Firebase has generous free tier, but monitor usage
3. **Security rules:** Update Firestore and Storage rules for production
4. **Indexes:** Create required Firestore indexes for better performance

## 📖 Next Steps

- Use this backend with the [React frontend example](../react-capacitor/)
- Learn about [Firebase security rules](https://firebase.google.com/docs/rules)
- Check out the [Node.js backend example](../node-express/) for a self-hosted alternative

---

**Built with ❤️ by Ahsan Mahmood** | [aoneahsan.com](https://aoneahsan.com)
