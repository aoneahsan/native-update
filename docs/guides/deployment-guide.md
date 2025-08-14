# Deployment Guide

This guide covers deploying the Capacitor Native Update plugin to production.

## Prerequisites

- Capacitor Native Update plugin configured
- Update server deployed
- SSL certificates configured
- CDN setup (optional but recommended)

## Server Deployment

### 1. Environment Setup

```bash
# Clone production backend
cd production-backend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with production values
```

### 2. Database Setup

```bash
# Initialize production database
npm run db:init

# For PostgreSQL (recommended for production)
# Update DB_PATH in .env to PostgreSQL connection string
```

### 3. Security Configuration

```env
# .env production settings
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
ADMIN_PASSWORD=<strong-password>

# Enable HTTPS only
ALLOWED_ORIGINS=https://your-app.com,capacitor://localhost

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 4. Deploy to Cloud

#### Option A: Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t update-server .
docker run -p 3000:3000 update-server
```

#### Option B: PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start src/index.js --name update-server

# Save PM2 config
pm2 save
pm2 startup
```

## App Configuration

### 1. Production Keys

```typescript
// Generate RSA keys for production
const keys = await generateKeyPair();
// Store private key securely on server
// Embed public key in app
```

### 2. Configure Plugin

```typescript
await NativeUpdate.configure({
  serverUrl: 'https://updates.your-domain.com',
  publicKey: PRODUCTION_PUBLIC_KEY,
  channel: 'production',
  autoCheck: true,
  checkInterval: 3600000, // 1 hour
});
```

## CDN Setup

### 1. CloudFront Configuration

```json
{
  "Origins": [{
    "DomainName": "update-server.your-domain.com",
    "OriginPath": "/api/bundles"
  }],
  "DefaultCacheBehavior": {
    "TargetOriginId": "update-bundles",
    "ViewerProtocolPolicy": "https-only",
    "CachePolicyId": "658327ea-f89e-4fab-a63d-7e88639e58f6"
  }
}
```

### 2. Update Server Config

```javascript
// Return CDN URLs for bundles
const cdnUrl = process.env.CDN_URL;
bundle.downloadUrl = `${cdnUrl}/${bundle.id}`;
```

## Monitoring Setup

### 1. Application Monitoring

```bash
# Install monitoring dependencies
npm install @opentelemetry/api @opentelemetry/sdk-node

# Configure in server
const { NodeSDK } = require('@opentelemetry/sdk-node');
const sdk = new NodeSDK();
sdk.start();
```

### 2. Health Checks

```bash
# Monitor endpoints
curl https://updates.your-domain.com/api/health
curl https://updates.your-domain.com/api/health/detailed
```

### 3. Alerts Configuration

```yaml
# CloudWatch alarms example
HighErrorRate:
  MetricName: 4XXError
  Threshold: 10
  Period: 300

ServerDown:
  MetricName: HealthCheck
  Threshold: 1
  Period: 60
```

## Release Process

### 1. Create Update Bundle

```bash
# Build your app
npm run build

# Create bundle
node tools/bundle-creator.js create ./www

# Sign bundle
node tools/bundle-signer.js sign bundle.zip private-key.pem
```

### 2. Upload to Server

```bash
# Create update record
curl -X POST https://updates.your-domain.com/api/updates/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "com.your.app",
    "platform": "web",
    "version": "1.1.0",
    "channel": "production",
    "description": "Bug fixes and improvements"
  }'

# Upload bundle
curl -X POST https://updates.your-domain.com/api/bundles/upload/$UPDATE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -F "bundle=@bundle.zip" \
  -F "signature=@bundle.sig"
```

### 3. Gradual Rollout

```bash
# Start with 10% rollout
curl -X PUT https://updates.your-domain.com/api/updates/$UPDATE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rolloutPercentage": 10}'

# Monitor metrics, then increase
# 10% -> 25% -> 50% -> 100%
```

## Security Checklist

- [ ] HTTPS enforced on all endpoints
- [ ] API authentication configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Bundle signatures verified
- [ ] SSL certificates valid
- [ ] Secrets stored securely
- [ ] Database backups configured
- [ ] Access logs enabled
- [ ] Security headers configured

## Performance Optimization

### 1. Enable Compression

```javascript
// Already included in production server
app.use(compression());
```

### 2. Database Indexing

```sql
-- Ensure indexes exist
CREATE INDEX idx_updates_lookup 
  ON updates(app_id, platform, channel, enabled);
```

### 3. Bundle Optimization

```bash
# Compress bundles before upload
zip -r -9 bundle.zip www/

# Consider differential updates
# Only include changed files
```

## Backup Strategy

### 1. Database Backups

```bash
# Daily backups
0 2 * * * pg_dump update_db > backup_$(date +\%Y\%m\%d).sql

# Keep 30 days of backups
find ./backups -name "*.sql" -mtime +30 -delete
```

### 2. Bundle Storage

```bash
# Sync bundles to S3
aws s3 sync ./storage/bundles s3://your-backup-bucket/bundles
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   - Verify certificate chain
   - Check certificate expiration
   - Ensure proper domain configuration

2. **CORS Issues**
   - Add app origin to ALLOWED_ORIGINS
   - Check preflight requests

3. **Download Failures**
   - Check CDN configuration
   - Verify bundle permissions
   - Monitor server logs

### Debug Mode

```typescript
// Enable debug logging in production
NativeUpdate.configure({
  debug: process.env.NODE_ENV !== 'production',
  serverUrl: 'https://updates.your-domain.com',
});
```

## Maintenance

### Regular Tasks

- [ ] Weekly: Check server health
- [ ] Monthly: Review analytics
- [ ] Monthly: Clean old bundles
- [ ] Quarterly: Update dependencies
- [ ] Yearly: Rotate certificates

### Update Server

```bash
# Update dependencies
npm update

# Restart server
pm2 restart update-server

# Check logs
pm2 logs update-server
```