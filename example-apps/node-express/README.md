# Node.js + Express Backend Example

A **simple, minimal** backend server for demonstrating OTA updates with the `native-update` plugin.

## 🎯 Purpose

This example provides the essential API endpoints needed to serve OTA updates. **No database, no complex authentication, no production features** - just file-based storage for demonstration.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and pnpm installed

### Installation

```bash
# From the monorepo root
pnpm install

# Or from this directory
cd example-apps/node-express
pnpm install
```

### Start the Server

```bash
pnpm start
```

The server will start on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```http
GET /api/health
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
  "downloadUrl": "http://localhost:3000/api/updates/download/bundle-123",
  "size": 1024000,
  "releaseNotes": "Bug fixes and improvements"
}
```

### Download Bundle
```http
GET /api/updates/download/:id
```

Downloads the bundle file.

### Upload Bundle (For Testing)
```http
POST /api/bundles/upload
```

**Body (multipart/form-data):**
- `bundle` - ZIP file
- `version` - Version number (e.g., "1.1.0")
- `channel` - Channel name (default: "production")
- `releaseNotes` - Optional release notes

**Example with curl:**
```bash
curl -F "bundle=@bundle.zip" \
     -F "version=1.1.0" \
     -F "channel=production" \
     -F "releaseNotes=Bug fixes" \
     http://localhost:3000/api/bundles/upload
```

### List Bundles
```http
GET /api/bundles
```

Returns all uploaded bundles with metadata.

## 📂 Project Structure

```
node-express/
├── index.js          # Single file with all server logic
├── bundles/          # Stored bundle files (created automatically)
├── metadata.json     # Bundle metadata (created automatically)
├── package.json      # Dependencies
├── .env.example      # Environment variables template
└── README.md
```

## 💾 Data Storage

- **Bundles:** Stored as files in `bundles/` directory
- **Metadata:** Stored in `metadata.json` file
- **No database required!**

## 🧪 Testing the Server

### 1. Start the Server
```bash
pnpm start
```

### 2. Check Health
```bash
curl http://localhost:3000/api/health
```

### 3. Upload a Bundle
```bash
# First, create a test bundle (zip your built app)
cd ../react-capacitor
pnpm build
cd dist
zip -r ../bundle.zip .

# Upload it
cd ..
curl -F "bundle=@bundle.zip" \
     -F "version=1.1.0" \
     -F "channel=production" \
     http://localhost:3000/api/bundles/upload
```

### 4. Check for Updates
```bash
curl "http://localhost:3000/api/updates/check?version=1.0.0&channel=production"
```

### 5. Download Bundle
```bash
# Use the ID from the previous response
curl "http://localhost:3000/api/updates/download/bundle-123" -o downloaded.zip
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):
```env
PORT=3000
```

## 📚 Integration with Frontend

In your React app (`example-apps/react-capacitor`), configure the plugin:

```typescript
await NativeUpdate.configure({
  serverUrl: 'http://localhost:3000/api',
  autoCheck: false,
  channel: 'production',
});
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in .env or run with custom port
PORT=3001 pnpm start
```

### Cannot upload files
- Ensure the server has write permissions
- Check that the `bundles/` directory can be created

### CORS errors
- The server uses `cors()` with no restrictions for development
- For production, configure allowed origins properly

## 🚀 Creating and Uploading Bundles

### Method 1: Using curl (Easiest)
```bash
# Build your app
cd ../react-capacitor
pnpm build

# Create bundle
cd dist
zip -r ../bundle.zip .

# Upload
cd ..
curl -F "bundle=@bundle.zip" \
     -F "version=1.1.0" \
     http://localhost:3000/api/bundles/upload
```

### Method 2: Using Postman
1. Create a POST request to `http://localhost:3000/api/bundles/upload`
2. Set body type to `form-data`
3. Add fields:
   - `bundle` (file) - Select your ZIP file
   - `version` (text) - e.g., "1.1.0"
   - `channel` (text) - e.g., "production"

## 💡 Tips

1. **Simple is better:** This example focuses on demonstrating the update flow, not production features
2. **File-based storage:** Perfect for local development and testing
3. **No authentication:** Add authentication before deploying to production
4. **Version format:** Use semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0)

## 📖 Next Steps

- Use this backend with the [React frontend example](../react-capacitor/)
- Learn about [bundle signing](../../docs/BUNDLE_SIGNING.md) for production
- Check out the [Firebase backend example](../firebase-backend/) for a serverless alternative

---

**Built with ❤️ by Ahsan Mahmood** | [aoneahsan.com](https://aoneahsan.com)
