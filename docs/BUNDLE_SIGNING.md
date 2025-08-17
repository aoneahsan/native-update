# Bundle Signing Process

This guide explains how to implement cryptographic signing for update bundles to ensure integrity and authenticity.

## Overview

Bundle signing uses RSA-2048 with SHA-256 to create digital signatures that verify:

- **Integrity**: The bundle hasn't been modified
- **Authenticity**: The bundle comes from a trusted source
- **Non-repudiation**: The signature proves origin

## Key Generation

### 1. Generate RSA Key Pair

```bash
npx native-update keys generate --type rsa --size 4096
```

This creates:

- `private.key` - Keep secure on your server
- `public.key` - Include in your app
- `public.key.b64` - Base64 version for app config

### 2. Secure Private Key

```bash
# Set restrictive permissions
chmod 600 private.key

# Store in secure location
mkdir -p /secure/keys
mv private.key /secure/keys/

# Set environment variable
export SIGNING_PRIVATE_KEY_PATH=/secure/keys/private.key
```

## Server-Side Signing

### 1. Automatic Signing

The update server automatically signs bundles on upload if `SIGNING_PRIVATE_KEY_PATH` is set:

```javascript
// server.js automatically signs on upload
const signature = signBundle(fileBuffer, privateKey);
```

### 2. Manual Signing

Sign bundles manually:

```bash
npx native-update bundle sign bundle-1.0.0.zip --key /secure/keys/private.key
```

This creates `bundle-1.0.0.zip.sig` containing the base64 signature.

### 3. Signature Format

Signatures are:

- RSA-SHA256 algorithm
- Base64 encoded
- Stored as string in bundle metadata

## Client-Side Verification

### 1. Configure Public Key

#### Android

```kotlin
// capacitor.config.json
{
  "plugins": {
    "NativeUpdate": {
      "publicKey": "base64-encoded-public-key",
      "enforceSignature": true
    }
  }
}
```

#### iOS

```swift
// Info.plist
<key>NativeUpdatePublicKey</key>
<string>base64-encoded-public-key</string>
<key>NativeUpdateEnforceSignature</key>
<true/>
```

### 2. Verification Process

The plugin automatically verifies signatures:

```typescript
// Internal verification flow
async function verifyBundle(
  bundle: ArrayBuffer,
  signature: string
): Promise<boolean> {
  const publicKey = await getPublicKey();
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    base64ToArrayBuffer(signature),
    bundle
  );
}
```

### 3. Enforcement Modes

- **Strict Mode** (`enforceSignature: true`): Rejects unsigned/invalid bundles
- **Permissive Mode** (`enforceSignature: false`): Logs warnings but allows installation

## Security Best Practices

### 1. Key Management

**DO:**

- Generate keys on secure, offline machine
- Use hardware security modules (HSM) for production
- Rotate keys periodically (yearly recommended)
- Keep multiple key versions for rollback

**DON'T:**

- Store private keys in version control
- Share private keys across environments
- Use weak key sizes (< 2048 bits)

### 2. Signing Infrastructure

```bash
# Production setup example
├── signing-server/
│   ├── keys/
│   │   ├── private-v1.key  # Current key
│   │   ├── private-v2.key  # Next key (pre-generated)
│   │   └── archive/        # Old keys for verification
│   ├── sign-bundle.sh      # Signing script
│   └── verify-bundle.sh    # Verification script
```

### 3. CI/CD Integration

#### GitHub Actions Example

```yaml
- name: Sign Bundle
  env:
    PRIVATE_KEY: ${{ secrets.BUNDLE_SIGNING_KEY }}
  run: |
    echo "$PRIVATE_KEY" > private.key
    npx native-update bundle sign dist/bundle.zip --key private.key
    rm private.key
```

#### Jenkins Example

```groovy
withCredentials([file(credentialsId: 'bundle-signing-key', variable: 'KEY_FILE')]) {
    sh 'npx native-update bundle sign dist/bundle.zip --key $KEY_FILE'
}
```

## Troubleshooting

### Common Issues

1. **"Invalid signature" error**
   - Verify public key matches private key
   - Check base64 encoding/decoding
   - Ensure bundle wasn't modified after signing

2. **"Missing signature" error**
   - Confirm server includes signature in response
   - Check `enforceSignature` setting
   - Verify signing process completed

3. **Performance issues**
   - Use SHA-256 for checksum verification first
   - Only verify signature on checksum match
   - Cache verification results

### Verification Tools

Test signature verification:

```bash
# Verify manually
npx native-update bundle verify bundle.zip --key public.key

# Check signature format
cat bundle.zip.sig | base64 -d | xxd | head

# Compare checksums
shasum -a 256 bundle.zip
```

## Migration Guide

### From Unsigned Bundles

1. Generate keys and configure server
2. Deploy app update with public key
3. Enable permissive mode initially
4. Monitor adoption via analytics
5. Switch to strict mode after 90%+ adoption

### Key Rotation

1. Generate new key pair
2. Update server to sign with new key
3. Deploy app update with both keys
4. Monitor old key usage
5. Remove old key after full migration

## API Reference

### Server Endpoints

```http
GET /api/v1/check?version=1.0.0&channel=production
Response: {
  "signature": "base64-signature",
  "checksum": "sha256:hex-checksum"
}
```

### Plugin Methods

```typescript
// Signature verification is handled automatically during sync/download
// Use validateUpdate for manual verification
const result = await NativeUpdate.validateUpdate({
  bundlePath: '/path/to/bundle.zip',
  checksum: 'expected-sha256-checksum',
  signature: 'base64-signature' // Optional
});

console.log('Validation result:', result.isValid);
if (!result.isValid) {
  console.log('Validation details:', result.details);
}
```

## Compliance

Bundle signing helps meet security requirements for:

- **PCI DSS**: Integrity monitoring
- **HIPAA**: Data authenticity
- **SOC 2**: Change management
- **ISO 27001**: Cryptographic controls

## Additional Resources

- [NIST Guidelines on Digital Signatures](https://csrc.nist.gov/publications/detail/fips/186/5/final)
- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [RSA Cryptography Specifications](https://www.rfc-editor.org/rfc/rfc8017)
