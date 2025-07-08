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

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
npm run db:migrate
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Check for Updates
```
GET /api/v1/check?channel={channel}&version={version}&appId={appId}

Response:
{
  "available": true,
  "version": "1.1.0",
  "url": "https://cdn.example.com/bundles/app-1.1.0.zip",
  "mandatory": false,
  "notes": "Bug fixes and improvements",
  "size": 5242880,
  "checksum": "sha256:abc123...",
  "signature": "base64:xyz789...",
  "minNativeVersion": "1.0.0"
}
```

### Upload Bundle
```
POST /api/v1/bundles
Authorization: Bearer {admin-token}
Content-Type: multipart/form-data

Fields:
- file: bundle.zip
- version: 1.1.0
- channel: production
- notes: Release notes
- mandatory: false
- minNativeVersion: 1.0.0
```

### Get Bundle Info
```
GET /api/v1/bundles/{bundleId}

Response:
{
  "id": "bundle-123",
  "version": "1.1.0",
  "channel": "production",
  "checksum": "sha256:...",
  "signature": "base64:...",
  "size": 5242880,
  "downloadCount": 150,
  "createdAt": "2024-01-08T10:00:00Z"
}
```

### Bundle Statistics
```
GET /api/v1/stats?from={date}&to={date}

Response:
{
  "downloads": {
    "total": 1000,
    "byVersion": {
      "1.0.0": 100,
      "1.1.0": 900
    },
    "byChannel": {
      "production": 800,
      "staging": 200
    }
  },
  "activeVersions": ["1.0.0", "1.1.0"],
  "rollbacks": 5
}
```

## Bundle Preparation

### 1. Build your web app
```bash
npm run build
```

### 2. Create bundle
```bash
cd dist
zip -r ../bundle-1.1.0.zip .
cd ..
```

### 3. Generate checksum
```bash
shasum -a 256 bundle-1.1.0.zip | cut -d' ' -f1 > bundle-1.1.0.checksum
```

### 4. Sign bundle (optional)
```bash
openssl dgst -sha256 -sign private.key -out bundle-1.1.0.sig bundle-1.1.0.zip
base64 bundle-1.1.0.sig > bundle-1.1.0.sig.b64
```

### 5. Upload bundle
```bash
curl -X POST https://your-server.com/api/v1/bundles \
  -H "Authorization: Bearer your-token" \
  -F "file=@bundle-1.1.0.zip" \
  -F "version=1.1.0" \
  -F "channel=production" \
  -F "notes=Bug fixes and improvements"
```

## Security

### Generate Key Pair
```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate public key
openssl rsa -in private.key -pubout -out public.key

# Convert public key to base64 for app config
base64 public.key > public.key.b64
```

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost/updates

# Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET=your-bucket
AWS_REGION=us-east-1

# Security
ADMIN_TOKEN=secure-admin-token
SIGNING_PRIVATE_KEY_PATH=./private.key
CORS_ORIGIN=https://app.example.com

# CDN (optional)
CDN_URL=https://cdn.example.com
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db/updates
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=updates
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Monitoring

The server includes built-in monitoring endpoints:

- `/health` - Health check
- `/metrics` - Prometheus metrics
- `/api/v1/stats` - Update statistics

## Best Practices

1. **Version Management**
   - Use semantic versioning
   - Test updates thoroughly before deployment
   - Keep old versions for rollback

2. **Security**
   - Always use HTTPS
   - Implement rate limiting
   - Validate all inputs
   - Monitor for suspicious activity

3. **Performance**
   - Use CDN for bundle distribution
   - Implement caching headers
   - Compress bundles
   - Monitor server resources

4. **Reliability**
   - Implement health checks
   - Set up monitoring and alerts
   - Regular backups
   - Disaster recovery plan