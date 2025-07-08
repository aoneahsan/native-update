# Capacitor Native Update - Server Example

This is a reference implementation of an update server for the Capacitor Native Update plugin.

## Features

- Update manifest management
- Bundle file serving
- Version checking API
- Checksum generation
- Digital signature support
- Channel management
- Update statistics

## Requirements

- Node.js 18+
- PostgreSQL or SQLite database
- S3-compatible storage (or local filesystem)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start server:
```bash
npm start
```

## API Endpoints

### Check for Updates
```
GET /api/v1/check?version=1.0.0&channel=production&appId=com.example.app
```

### Upload Bundle
```
POST /api/v1/bundles
Headers: Authorization: Bearer <admin-token>
Body: multipart/form-data with file and metadata
```

### Download Bundle
```
GET /api/v1/bundles/:bundleId/download
```

### Get Statistics
```
GET /api/v1/stats
```

## Bundle Signing

Generate key pair:
```bash
node bundle-signer.js generate-keys
```

Sign a bundle:
```bash
node bundle-signer.js sign bundle-1.0.0.zip
```

Verify signature:
```bash
node bundle-signer.js verify bundle-1.0.0.zip bundle-1.0.0.zip.sig
```

## Security

- All endpoints use HTTPS
- Admin endpoints require authentication
- Bundles are signed with RSA-SHA256
- CORS configured for your app domain

## Production Deployment

1. Use a proper database (not in-memory)
2. Configure CDN for bundle distribution
3. Set up monitoring and logging
4. Implement rate limiting
5. Use environment variables for secrets

## Support

For questions or issues with the update server:
- Email: aoneahsan@gmail.com
- GitHub: [https://github.com/aoneahsan/capacitor-native-update](https://github.com/aoneahsan/capacitor-native-update)
- Author: Ahsan Mahmood ([Zaions](https://zaions.com))