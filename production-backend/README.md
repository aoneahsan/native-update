# Production Update Server for Capacitor Native Update

This is a production-grade backend server for managing OTA updates with the Capacitor Native Update plugin.

## Features

- **Version Management**: Track and manage update versions with channels
- **Bundle Storage**: Store and serve update bundles with CDN support
- **Security**: RSA signature verification, checksum validation, API authentication
- **Analytics**: Track update success rates, download metrics, and errors
- **Admin Dashboard**: Web UI for managing updates and monitoring
- **Database**: SQLite for development, easily swappable to PostgreSQL/MySQL
- **API Authentication**: JWT-based authentication for admin operations
- **Rate Limiting**: Protect against abuse
- **Compression**: Automatic response compression
- **Logging**: Structured logging with Winston
- **Health Checks**: Monitoring endpoints

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-secret-key-here
ADMIN_PASSWORD=change-this-password

# Database
DB_PATH=./data/updates.db

# Storage
STORAGE_PATH=./storage/bundles
MAX_BUNDLE_SIZE=104857600  # 100MB

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# CORS
ALLOWED_ORIGINS=https://your-app.com,capacitor://localhost

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log
```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/updates/check/:appId/:platform/:currentVersion` - Check for updates
- `GET /api/bundles/:bundleId` - Download update bundle
- `POST /api/analytics/event` - Track update events

### Admin Endpoints (Requires Authentication)

- `POST /api/auth/login` - Admin login
- `POST /api/updates/create` - Create new update
- `POST /api/updates/upload` - Upload bundle
- `GET /api/updates/list` - List all updates
- `PUT /api/updates/:id` - Update metadata
- `DELETE /api/updates/:id` - Delete update
- `GET /api/analytics/dashboard` - Analytics dashboard data

## Database Schema

The server uses SQLite by default with the following schema:

- **updates**: Version information and metadata
- **bundles**: Bundle file references and checksums
- **channels**: Update channels (production, staging, etc.)
- **download_stats**: Download tracking
- **events**: Analytics events
- **api_keys**: API authentication

## Production Deployment

1. **Environment Setup**
   - Set secure JWT_SECRET
   - Configure production database
   - Set up proper logging

2. **Storage**
   - Configure CDN for bundle serving
   - Set up backup strategy
   - Implement cleanup for old bundles

3. **Security**
   - Enable HTTPS only
   - Configure firewall rules
   - Set up monitoring alerts

4. **Scaling**
   - Use PostgreSQL/MySQL for database
   - Implement Redis for caching
   - Use S3/Cloud Storage for bundles
   - Deploy behind load balancer

## Monitoring

The server provides several monitoring endpoints:

- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/metrics` - Prometheus-compatible metrics

## Security Features

- JWT authentication for admin operations
- Request signature validation
- Bundle checksum verification
- Rate limiting per IP
- CORS configuration
- SQL injection protection
- XSS prevention

## Development

```bash
# Run tests
npm test

# Database migrations
npm run db:migrate

# Generate API documentation
npm run docs
```

## License

MIT