# Capacitor Native Update - Complete Example

This is a comprehensive example demonstrating all features of the capacitor-native-update plugin with a React frontend and Firebase Functions backend.

## 🚀 Features Demonstrated

### Frontend (React + Capacitor)
- **Live/OTA Updates**: Download and apply JavaScript updates
- **App Store Updates**: Check and prompt for native app updates  
- **App Reviews**: Request in-app reviews at optimal moments
- **Security**: Bundle signature verification and HTTPS enforcement
- **Analytics**: Track update metrics and user behavior
- **Advanced Features**: Background updates, version management, rollback

### Backend (Firebase Functions)
- **Update API**: Serve bundle updates with versioning
- **Bundle Management**: Upload, sign, and manage update bundles
- **Analytics Collection**: Track update performance metrics
- **Security**: JWT authentication and signed URLs
- **Storage**: Firebase Storage for bundle files
- **Database**: Firestore for metadata and analytics

## 📦 Project Structure

```
example-app/
├── src/                    # React app source
│   ├── components/         # Feature demo components
│   ├── context/           # React context for state
│   └── App.tsx            # Main app component
├── firebase-backend/       # Firebase Functions backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth and validation
│   │   └── utils/         # Helper functions
│   ├── firebase.json      # Firebase configuration
│   └── firestore.rules    # Security rules
├── capacitor.config.ts    # Capacitor configuration
└── package.json          # Dependencies
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 22+ (for Firebase Functions)
- Firebase CLI: `npm install -g firebase-tools`
- Capacitor CLI: `npm install -g @capacitor/cli`

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd example-app
yarn install

# Install backend dependencies
cd firebase-backend
yarn install
```

### 2. Configure Firebase

1. Create a new Firebase project at https://console.firebase.google.com

2. Initialize Firebase:
```bash
cd firebase-backend
firebase init
# Select: Functions, Firestore, Storage
# Choose your project
# Select TypeScript
# Use existing files when prompted
```

3. Update Firebase configuration in your app

### 3. Generate Security Keys

```bash
# Generate RSA key pair for bundle signing
cd ..
node tools/bundle-signer.js generate-keys

# Copy the public key to capacitor.config.ts
```

### 4. Deploy Backend

```bash
cd example-app/firebase-backend
npm run deploy
```

### 5. Update Configuration

Edit `capacitor.config.ts`:
```typescript
{
  plugins: {
    CapacitorNativeUpdate: {
      serverUrl: 'https://your-project.cloudfunctions.net/api',
      publicKey: 'YOUR_BASE64_PUBLIC_KEY',
      appStoreId: 'YOUR_APP_STORE_ID'
    }
  }
}
```

### 6. Run the App

```bash
# Web development
yarn start

# iOS
yarn cap:build
yarn ios

# Android
yarn cap:build
yarn android
```

## 📱 Feature Usage

### Live Updates (OTA)

1. **Check for Updates**: Click "Check for Updates" to query the server
2. **Download**: Download available updates with progress tracking
3. **Apply**: Apply the update (app will restart)
4. **Rollback**: Reset to original bundle if needed

### App Store Updates

1. **Check Version**: Compare current app version with store version
2. **Immediate Update**: Force blocking update for critical fixes
3. **Flexible Update**: Background download with user-controlled install
4. **Open Store**: Direct link to app store listing

### App Reviews

1. **Smart Request**: Request review after positive interactions
2. **Rate Limiting**: Respects platform limits (iOS: 3x/year)
3. **Fallback**: Opens store review page if in-app fails

### Security Features

1. **HTTPS Only**: Enforces secure connections
2. **Signature Verification**: Validates bundle authenticity
3. **Certificate Pinning**: Optional enhanced security
4. **Checksum Validation**: Ensures bundle integrity

### Analytics

1. **Automatic Tracking**: Update events tracked automatically
2. **Custom Events**: Track user interactions
3. **Performance Metrics**: Download times and success rates
4. **Export Data**: Download analytics as JSON/CSV

## 🔧 Backend API Endpoints

### Public Endpoints
- `GET /api/v1/updates/check` - Check for updates
- `GET /api/v1/updates/bundle/:id` - Get bundle info
- `POST /api/v1/updates/report` - Report update result
- `POST /api/v1/analytics/track` - Track events

### Admin Endpoints (Requires Auth)
- `POST /api/v1/bundles` - Upload new bundle
- `GET /api/v1/bundles` - List bundles
- `PATCH /api/v1/bundles/:id/status` - Update bundle status
- `POST /api/v1/bundles/:id/sign` - Sign bundle

## 🚀 Creating Updates

1. **Build your web app**:
```bash
yarn build
```

2. **Create bundle**:
```bash
node ../tools/bundle-creator.js create ./dist
```

3. **Sign bundle**:
```bash
node ../tools/bundle-signer.js sign bundle.zip private-key.pem
```

4. **Upload via Admin API** or Firebase Console

## 🔒 Security Best Practices

1. **Never commit keys**: Keep private keys secure
2. **Use HTTPS**: Always use secure connections
3. **Validate bundles**: Check signatures and checksums
4. **Monitor failures**: Track failed update attempts
5. **Test thoroughly**: Test updates on all platforms

## 📊 Monitoring

The Firebase backend includes:
- Real-time analytics dashboard
- Update success/failure rates
- Performance metrics
- Error tracking
- User engagement data

## 🤝 Contributing

See the main project's [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📝 License

MIT - see [LICENSE](../LICENSE) for details.