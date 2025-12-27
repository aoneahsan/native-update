# Firebase Functions Deployment Guide

## Prerequisites

1. **Node.js**: Ensure you have Node.js 22 installed
   ```bash
   node --version  # Should show v22.x.x
   ```

2. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

3. **Firebase Project**: Ensure you have a Firebase project set up
   - Go to https://console.firebase.google.com/
   - Create or select your project

## Initial Setup

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Initialize Firebase (if not already done)**
   ```bash
   cd /path/to/website
   firebase init functions
   ```
   - Select existing project or create new one
   - Choose TypeScript
   - Do NOT overwrite existing files

3. **Install Dependencies**
   ```bash
   cd functions
   pnpm install
   ```

## Local Development

### Run Emulator

```bash
pnpm run serve
```

This starts the Firebase emulator at `http://localhost:5001/your-project-id/us-central1/api`

### Test Endpoints

```bash
# Health check
curl http://localhost:5001/your-project-id/us-central1/api/health

# Create app (with auth token)
curl -X POST http://localhost:5001/your-project-id/us-central1/api/apps \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"appId":"test-app","name":"Test App","bundleId":"com.test.app","platforms":["ios"]}'
```

## Deployment to Production

### 1. Build Functions

```bash
pnpm build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 2. Test Build Output

Verify the build succeeded:
```bash
ls -la lib/
```

You should see compiled JavaScript files.

### 3. Deploy to Firebase

```bash
pnpm deploy
```

Or using Firebase CLI directly:
```bash
firebase deploy --only functions
```

### 4. Verify Deployment

After deployment, Firebase will provide the function URL:
```
✔  functions[us-central1-api]: Successful create operation.
Function URL (api): https://us-central1-your-project-id.cloudfunctions.net/api
```

Test the deployed function:
```bash
curl https://us-central1-your-project-id.cloudfunctions.net/api/health
```

## Environment Variables

Firebase Functions automatically use Firebase project credentials. No additional environment variables are needed.

### Custom Environment Variables (Optional)

If you need custom environment variables:

```bash
# Set environment variable
firebase functions:config:set someservice.key="THE_KEY"

# Get environment variables
firebase functions:config:get

# Deploy after setting
firebase deploy --only functions
```

Access in code:
```typescript
const config = functions.config();
const key = config.someservice.key;
```

## Monitoring and Logs

### View Logs in Console

```bash
pnpm logs
```

Or:
```bash
firebase functions:log
```

### Real-time Logs

```bash
firebase functions:log --only api
```

### Firebase Console

View detailed logs and metrics at:
https://console.firebase.google.com/project/your-project-id/functions

## Troubleshooting

### Node Version Mismatch

Error: `Unsupported environment (bad pnpm and/or Node.js version)`

Solution: Use Node.js 22
```bash
nvm install 22
nvm use 22
```

### Build Errors

Error: TypeScript compilation errors

Solution:
```bash
# Check for errors
pnpm build

# Fix linting issues
pnpm lint:fix

# Rebuild
pnpm build
```

### Deployment Fails

Error: `HTTP Error: 403, The caller does not have permission`

Solution: Ensure you're logged in and have proper permissions
```bash
firebase login --reauth
firebase projects:list
```

### CORS Issues

If frontend gets CORS errors, verify allowed origins in `src/index.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:5900',
  'https://your-domain.web.app',
  'https://your-domain.firebaseapp.com',
];
```

## Security Checklist

- [ ] All routes require authentication (except health check)
- [ ] Input validation on all endpoints
- [ ] Resource ownership checks implemented
- [ ] CORS configured with specific origins
- [ ] Error messages don't leak sensitive information
- [ ] Firebase Admin SDK initialized properly

## Performance Optimization

### Cold Start Optimization

1. Keep function code minimal
2. Use lazy loading for heavy dependencies
3. Reuse Firebase Admin instances

### Memory Management

Current settings (in `src/index.ts`):
```typescript
export const api = onRequest({
  memory: '256MiB',      // Adjust based on usage
  timeoutSeconds: 60,    // Adjust based on needs
  maxInstances: 10,      // Limit concurrent executions
});
```

### Cost Optimization

Monitor usage:
- Firebase Console → Functions → Usage tab
- Set up billing alerts
- Use Firebase emulator for development

## Rollback

If deployment causes issues:

```bash
# View previous deployments
firebase functions:list

# Rollback is not directly supported
# Deploy previous version from git:
git checkout previous-commit
pnpm build
pnpm deploy
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy Functions

on:
  push:
    branches: [main]
    paths:
      - 'website/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.4
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      - run: cd website/functions && pnpm install
      - run: cd website/functions && pnpm build
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Support

For issues or questions:
- Email: aoneahsan@gmail.com
- Check Firebase Functions docs: https://firebase.google.com/docs/functions
