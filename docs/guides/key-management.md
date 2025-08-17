# Key Management Guide

This guide explains how to generate, manage, and use cryptographic keys for bundle signing in the Native Update plugin.

## Overview

The Native Update plugin uses public key cryptography to ensure the security and integrity of update bundles. This system prevents tampering and ensures updates come from trusted sources.

### Why Use Cryptographic Signing?

1. **Integrity**: Ensures bundles haven't been modified during transmission
2. **Authenticity**: Verifies bundles come from your trusted server
3. **Non-repudiation**: Proves the origin of updates
4. **Security**: Prevents man-in-the-middle attacks and bundle injection

## Key Generation

### Using the CLI Tool (Recommended)

The easiest way to generate keys is using our CLI tool:

```bash
# Generate RSA 4096-bit keys (recommended for production)
npx native-update keys generate --type rsa --size 4096

# Generate RSA 2048-bit keys (faster, still secure)
npx native-update keys generate --type rsa --size 2048

# Generate EC keys (smaller signatures, modern)
npx native-update keys generate --type ec --size 256

# Specify output directory
npx native-update keys generate --output ./my-keys
```

This will create:
- `private-{timestamp}.pem` - Keep this SECRET on your server
- `public-{timestamp}.pem` - Include this in your app

### Manual Key Generation

If you prefer to generate keys manually, you can use OpenSSL:

#### RSA Keys

```bash
# Generate 4096-bit RSA private key
openssl genrsa -out private.pem 4096

# Extract public key from private key
openssl rsa -in private.pem -pubout -out public.pem
```

#### Elliptic Curve Keys

```bash
# Generate EC private key (P-256 curve)
openssl ecparam -genkey -name prime256v1 -out private-ec.pem

# Extract public key
openssl ec -in private-ec.pem -pubout -out public-ec.pem
```

## Key Usage

### 1. Store Private Key Securely

The private key must be kept secure on your server:

```bash
# Set restrictive permissions
chmod 600 private-*.pem

# Store in secure location
sudo mv private-*.pem /secure/keys/
```

**Security Tips:**
- Never commit private keys to version control
- Use environment variables or key management services
- Rotate keys periodically
- Keep backup copies in secure storage

### 2. Configure Public Key in App

Add the public key to your Capacitor configuration:

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  plugins: {
    NativeUpdate: {
      publicKey: 'YOUR_BASE64_PUBLIC_KEY_HERE',
      // ... other config
    }
  }
};

export default config;
```

To get the base64 version of your public key:

```bash
# Convert public key to base64
cat public-*.pem | base64 -w 0 > public-key.b64

# On macOS
cat public-*.pem | base64 > public-key.b64
```

### 3. Sign Bundles

Use the private key to sign update bundles:

```bash
# Sign a bundle
npx native-update bundle sign ./bundle.zip --key /secure/keys/private.pem

# This creates a signature file alongside the bundle
```

### 4. Verify Signatures

The plugin automatically verifies signatures using the configured public key. You can manually verify:

```bash
# Verify a signed bundle
npx native-update bundle verify ./bundle.zip --key ./public.pem
```

## Security Best Practices

### Key Storage

1. **Server Side (Private Key)**:
   - Store in hardware security module (HSM) if possible
   - Use encrypted storage
   - Implement access controls
   - Never expose via API or logs

2. **Client Side (Public Key)**:
   - Embed in app configuration
   - Can be safely distributed
   - Consider certificate pinning for extra security

### Key Rotation

Implement a key rotation strategy:

1. Generate new key pair
2. Start signing new bundles with new key
3. Update app with both old and new public keys
4. Phase out old key after all users update
5. Remove old public key in future release

### Environment-Specific Keys

Use different keys for different environments:

```typescript
const config: CapacitorConfig = {
  plugins: {
    NativeUpdate: {
      publicKey: process.env.NODE_ENV === 'production' 
        ? 'PRODUCTION_PUBLIC_KEY_BASE64'
        : 'STAGING_PUBLIC_KEY_BASE64',
    }
  }
};
```

## Implementation Details

### How Signing Works

1. **Bundle Creation**: Your web assets are packaged into a ZIP file
2. **Hash Generation**: SHA-256 hash of the bundle is calculated
3. **Signing**: Hash is signed with your private key using RSA-SHA256
4. **Distribution**: Bundle + signature are uploaded to your server

### How Verification Works

1. **Download**: App downloads bundle and signature
2. **Hash Calculation**: App calculates SHA-256 hash of downloaded bundle
3. **Signature Verification**: App uses public key to verify signature matches hash
4. **Installation**: Bundle is only installed if verification succeeds

### Signature Format

Signatures are base64-encoded for transport:

```json
{
  "bundle": "bundle-1.0.1.zip",
  "signature": "MEUCIQDp3...base64...==",
  "algorithm": "RSA-SHA256",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Troubleshooting

### Common Issues

1. **"Signature verification failed"**
   - Ensure public key in app matches private key used for signing
   - Check bundle hasn't been modified after signing
   - Verify base64 encoding is correct

2. **"Invalid key format"**
   - Keys must be in PEM format
   - Check for proper headers/footers in key files
   - Ensure no extra whitespace or characters

3. **"Permission denied" when accessing keys**
   - Set proper file permissions: `chmod 600 private-*.pem`
   - Store in accessible location for your server process

### Testing Key Pairs

Test your keys are properly paired:

```bash
# Create test message
echo "test message" > test.txt

# Sign with private key
openssl dgst -sha256 -sign private.pem -out test.sig test.txt

# Verify with public key
openssl dgst -sha256 -verify public.pem -signature test.sig test.txt
# Should output: "Verified OK"
```

## Advanced Topics

### Hardware Security Modules (HSM)

For maximum security, use HSM for key storage:

```javascript
// Example using AWS KMS
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

async function signWithHSM(data) {
  const params = {
    KeyId: 'arn:aws:kms:...',
    Message: data,
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256'
  };
  
  const result = await kms.sign(params).promise();
  return result.Signature;
}
```

### Certificate Chains

For enterprise deployments, use certificate chains:

```bash
# Create certificate chain
cat intermediate.crt root.crt > chain.pem

# Configure in app
{
  "certificateChain": "base64_encoded_chain",
  "publicKey": "base64_encoded_public_key"
}
```

## Next Steps

- Review [Security Best Practices](./security-best-practices.md)
- Implement [Bundle Signing](../BUNDLE_SIGNING.md)
- Set up [CI/CD Integration](../ci-cd-integration.md)

---

Made with ❤️ by Ahsan Mahmood