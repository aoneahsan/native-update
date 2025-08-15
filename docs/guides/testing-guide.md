# Comprehensive Testing Guide

This guide covers all testing approaches for the Capacitor Native Update plugin.

## Testing Levels

### 1. Unit Testing

The plugin includes unit tests for core functionality:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### Test Structure

```
src/__tests__/
├── security.test.ts      # Security validation tests
├── version-manager.test.ts # Version comparison tests
├── bundle-manager.test.ts  # Bundle management tests
├── config.test.ts         # Configuration tests
└── integration.test.ts    # Integration tests
```

### 2. Integration Testing

#### Web Platform Testing

1. **Setup Test Environment**
   ```bash
   # Start the test server
   cd production-backend
   npm install
   npm run db:init
   npm start
   ```

2. **Configure Plugin**
   ```typescript
   await NativeUpdate.configure({
     serverUrl: 'http://localhost:3000',
     channel: 'development',
     autoCheck: true,
   });
   ```

3. **Test Update Flow**
   ```typescript
   // Check for updates
   const update = await NativeUpdate.sync();
   
   // Update will be downloaded and applied based on sync result
   if (update.status === 'UPDATE_INSTALLED') {
     await NativeUpdate.reload();
   }
   ```

#### iOS Testing

1. **Simulator Testing**
   ```bash
   # Build and run in iOS simulator
   npx cap sync ios
   npx cap run ios
   ```

2. **Device Testing**
   - Connect iOS device
   - Enable developer mode
   - Run via Xcode

3. **Test Cases**
   - HTTPS enforcement
   - Bundle download progress
   - Checksum validation
   - App store redirect

#### Android Testing

1. **Emulator Testing**
   ```bash
   # Build and run in Android emulator
   npx cap sync android
   npx cap run android
   ```

2. **Device Testing**
   - Enable USB debugging
   - Connect Android device
   - Run via Android Studio

3. **Test Cases**
   - Permission handling
   - Background updates
   - In-app update UI
   - Rollback functionality

### 3. Security Testing

#### Certificate Validation
```typescript
// Test HTTPS enforcement
try {
  await NativeUpdate.configure({
    serverUrl: 'http://insecure.com', // Should fail
  });
} catch (error) {
  console.log('HTTPS enforcement working');
}
```

#### Signature Verification
```bash
# Create signed bundle
node tools/bundle-signer.js sign test-bundle.zip private-key.pem

# Verify in app
const isValid = await NativeUpdate.LiveUpdate.validateUpdate({
  bundlePath: 'bundle-path',
  checksum: 'bundle-checksum',
  signature: signature
});
```

### 4. Performance Testing

#### Download Performance
```typescript
// Monitor download speed
NativeUpdate.LiveUpdate.addListener('downloadProgress', (progress) => {
  console.log(`Speed: ${progress.speed} MB/s`);
  console.log(`Progress: ${progress.percent}%`);
});
```

#### Memory Usage
- Monitor app memory during updates
- Test with large bundles (50MB+)
- Verify cleanup of old bundles

### 5. End-to-End Testing

#### Complete Update Cycle

1. **Prepare Test Bundle**
   ```bash
   # Create bundle
   node tools/bundle-creator.js create ./www
   
   # Sign bundle
   node tools/bundle-signer.js sign bundle.zip private-key.pem
   
   # Upload to server
   curl -X POST http://localhost:3000/api/updates/upload/update-id \
     -H "Authorization: ApiKey your-api-key" \
     -F "bundle=@bundle.zip" \
     -F "signature=@bundle.sig"
   ```

2. **Test Update Flow**
   ```typescript
   // Full update test
   async function testCompleteUpdate() {
     // Configure
     await NativeUpdate.configure({
       serverUrl: 'https://your-server.com',
       publicKey: 'your-public-key',
     });
     
     // Sync will check, download and apply update
     const result = await NativeUpdate.sync();
     
     if (result.status === 'UPDATE_INSTALLED') {
       // Reload to apply update
       await NativeUpdate.reload();
     }
     
     // Verify
     const current = await NativeUpdate.current();
     console.log('Updated to:', current.version);
   }
   ```

### 6. Error Handling Testing

#### Network Failures
```typescript
// Test offline behavior
await NativeUpdate.sync()
  .catch(error => {
    expect(error.code).toBe('NETWORK_ERROR');
  });
```

#### Corrupted Bundles
```typescript
// Test checksum validation
await NativeUpdate.download({
  version: 'corrupted-version'
})
  .catch(error => {
    expect(error.code).toBe('CHECKSUM_ERROR');
  });
```

### 7. Rollback Testing

```typescript
// Test rollback mechanism
async function testRollback() {
  // Set bad update
  await NativeUpdate.set(badUpdate);
  
  // Simulate app crash
  await simulateCrash();
  
  // Verify rollback on restart
  const version = await NativeUpdate.current();
  expect(version.version).toBe(previousVersion);
}
```

### 8. Platform-Specific Testing

#### iOS Specific
- Test with different iOS versions (13+)
- Verify App Store redirect
- Test StoreKit integration
- Check background fetch

#### Android Specific
- Test with different Android versions (5.0+)
- Verify Play Core integration
- Test notification permissions
- Check WorkManager scheduling

### 9. Automated Testing

#### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:e2e
```

### 10. Manual Testing Checklist

- [ ] **Configuration**
  - [ ] Valid HTTPS URL required
  - [ ] Invalid configs rejected
  - [ ] Channel switching works

- [ ] **Update Sync**
  - [ ] Returns correct sync status
  - [ ] Respects version constraints
  - [ ] Handles network errors

- [ ] **Download**
  - [ ] Progress updates work
  - [ ] Pause/resume functionality
  - [ ] Checksum validation
  - [ ] Signature verification

- [ ] **Installation**
  - [ ] Update applies correctly
  - [ ] App restarts properly
  - [ ] Rollback on failure

- [ ] **Native Updates**
  - [ ] App store redirect works
  - [ ] Version comparison accurate
  - [ ] Update UI displays correctly

- [ ] **App Reviews**
  - [ ] Review prompt appears
  - [ ] Rate limiting works
  - [ ] Platform APIs called correctly

## Testing Tools

### Bundle Testing
```bash
# Create test bundle
node tools/bundle-creator.js create ./test-www

# Verify bundle
unzip -t test-bundle.zip

# Check signature
openssl dgst -sha256 -verify public-key.pem -signature bundle.sig bundle.zip
```

### Server Testing
```bash
# Test update check
curl http://localhost:3000/api/updates/check/com.example.app/web/1.0.0

# Test analytics
curl -X POST http://localhost:3000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{"appId":"com.example.app","eventType":"update_check"}'
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 \
  http://localhost:3000/api/updates/check/app/web/1.0.0
```

## Debugging

### Enable Debug Logging
```typescript
NativeUpdate.configure({
  debug: true,
  logLevel: 'verbose',
});
```

### Native Platform Debugging

**iOS:**
- Use Xcode console
- Enable network debugging
- Check device logs

**Android:**
- Use Logcat in Android Studio
- Enable USB debugging
- Monitor network traffic

## Common Issues

### Issue: Updates Not Detected
- Verify server is running
- Check version numbers
- Ensure HTTPS is used
- Check CORS configuration

### Issue: Download Fails
- Check network connectivity
- Verify bundle URL
- Check file permissions
- Monitor server logs

### Issue: Signature Verification Fails
- Ensure keys match
- Check base64 encoding
- Verify bundle integrity
- Update public key in app