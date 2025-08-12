# Minimal Backend Server Template

This is a minimal backend server for testing Capacitor Native Update plugin.

⚠️ **NOT FOR PRODUCTION USE** - This is only for development and testing!

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start server:
```bash
npm start
```

Server runs on http://localhost:3000

## API Endpoints

### Check for Updates
```
GET /api/v1/check?version=1.0.0&channel=production&appId=com.example.app
```

### Upload Bundle
```
POST /api/v1/bundles
Content-Type: multipart/form-data
Fields:
- bundle: ZIP file
- version: 1.0.1
- appId: com.example.app
- channel: production
- mandatory: false
- releaseNotes: Bug fixes
```

### Download Bundle
```
GET /api/v1/bundles/bundle-1.0.1.zip
```

## Production Requirements

For production, you need:
- Real database (PostgreSQL, MongoDB, etc.)
- Authentication & authorization
- CDN for bundle distribution
- Rate limiting
- Monitoring & logging
- SSL/TLS certificates
- Load balancing
- Backup strategy