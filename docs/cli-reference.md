# CLI Reference

The Native Update CLI provides comprehensive tools for managing your update workflow.

## Installation

The CLI is included with the native-update package. You can use it via npx without any additional installation:

```bash
# Use directly with npx (recommended)
npx native-update <command>

# Or install globally
npm install -g native-update

# Or use locally in your project
npm install native-update
npx native-update <command>
```

## Commands

### Bundle Management

#### `bundle create <webDir>`

Creates an update bundle from your web build directory.

```bash
npx native-update bundle create ./www

# Options:
#   -o, --output <path>     Output directory (default: ./update-bundles)
#   -v, --version <version> Bundle version (default: from package.json)
#   -c, --channel <channel> Release channel (default: production)
#   -m, --metadata <json>   Additional metadata as JSON string
```

**Example:**
```bash
npx native-update bundle create ./dist \
  --version 1.2.0 \
  --channel staging \
  --metadata '{"releaseNotes":"Bug fixes"}'
```

#### `bundle sign <bundlePath>`

Signs a bundle with your private key for security verification.

```bash
npx native-update bundle sign ./bundle.zip --key ./keys/private.pem

# Options:
#   -k, --key <path>    Path to private key file (required)
#   -o, --output <path> Output path for signed bundle
```

#### `bundle verify <bundlePath>`

Verifies a signed bundle with the public key.

```bash
npx native-update bundle verify ./bundle.zip --key ./keys/public.pem

# Options:
#   -k, --key <path> Path to public key file (required)
```

### Key Management

#### `keys generate`

Generates a new cryptographic key pair for bundle signing. This is the recommended way to create keys for the Native Update plugin.

```bash
npx native-update keys generate

# Options:
#   -o, --output <dir>  Output directory (default: ./keys)
#   -t, --type <type>   Key type: rsa or ec (default: rsa)
#   -s, --size <size>   Key size - RSA: 2048/4096, EC: 256/384 (default: 2048)
```

**What it creates:**
- `private-{timestamp}.pem` - Private key for signing (keep SECRET on server)
- `public-{timestamp}.pem` - Public key for verification (include in app)
- Sets proper file permissions (600) on private key
- Timestamps prevent accidental overwriting

**Example:**
```bash
# Generate strong RSA keys for production (recommended)
npx native-update keys generate --type rsa --size 4096

# Generate EC keys for smaller signature size
npx native-update keys generate --type ec --size 256

# Generate in custom directory
npx native-update keys generate --output ./my-keys --type rsa --size 4096
```

**Security Notes:**
- NEVER commit private keys to version control
- Store private keys in secure locations with restricted access
- Use environment variables or key management services in production
- See [Key Management Guide](./guides/key-management.md) for best practices

### Backend Templates

#### `backend create <type>`

Creates a backend server template for hosting updates.

```bash
npx native-update backend create express

# Types available:
#   express  - Node.js Express server
#   firebase - Firebase Functions
#   vercel   - Vercel serverless functions

# Options:
#   -o, --output <dir>    Output directory (default: ./native-update-backend)
#   --with-monitoring     Include monitoring setup
#   --with-admin         Include admin dashboard
```

**Examples:**
```bash
# Express server with admin dashboard
npx native-update backend create express --with-admin

# Firebase Functions with monitoring
npx native-update backend create firebase --with-monitoring

# Vercel deployment ready backend
npx native-update backend create vercel
```

### Development Tools

#### `server start`

Starts a local update server for development and testing.

```bash
npx native-update server start

# Options:
#   -p, --port <port> Server port (default: 3000)
#   -d, --dir <dir>   Directory containing bundles (default: ./update-bundles)
#   --cors            Enable CORS (default: true)
```

#### `init`

Initializes Native Update configuration in your project.

```bash
npx native-update init

# Options:
#   --example              Include example code
#   --backend <type>       Backend type: firebase, express, custom (default: custom)
```

### Monitoring

#### `monitor`

Monitors update deployment statistics in real-time.

```bash
npx native-update monitor --server https://your-update-server.com

# Options:
#   -s, --server <url> Backend server URL (required)
#   -k, --key <key>    API key for authentication
```

### Configuration

#### `config check`

Validates your Native Update configuration.

```bash
npx native-update config check
```

### Migration

#### `migrate`

Helps migrate from other OTA solutions.

```bash
npx native-update migrate --from codepush

# Options:
#   --from <solution> Source solution: codepush, appflow (default: codepush)
```

## Complete Workflow Example

Here's a typical workflow using the CLI:

```bash
# 1. Initialize in your project
npx native-update init --example

# 2. Generate signing keys
npx native-update keys generate --type rsa --size 4096

# 3. Create a backend
npx native-update backend create express --with-admin

# 4. Start the backend (in another terminal)
cd native-update-backend
npm install
npm run dev

# 5. Build your app
npm run build

# 6. Create and sign a bundle
npx native-update bundle create ./www --version 1.0.1
npx native-update bundle sign ./update-bundles/bundle-*.zip --key ./keys/private-*.pem

# 7. Upload to your server (use the admin dashboard or API)

# 8. Monitor deployments
npx native-update monitor --server http://localhost:3000
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Create Update Bundle
  run: |
    npx native-update bundle create ./dist \
      --version ${{ github.event.release.tag_name }}
      --channel production

- name: Sign Bundle
  run: |
    npx native-update bundle sign ./update-bundles/*.zip \
      --key ${{ secrets.PRIVATE_KEY }}
```

### Jenkins

```groovy
stage('Create Update') {
    steps {
        sh 'npx native-update bundle create ./www --version ${BUILD_NUMBER}'
        sh 'npx native-update bundle sign ./update-bundles/*.zip --key ${PRIVATE_KEY_PATH}'
    }
}
```

## Environment Variables

The CLI respects these environment variables:

- `NATIVE_UPDATE_SERVER` - Default server URL for commands
- `NATIVE_UPDATE_API_KEY` - Default API key for authentication
- `NATIVE_UPDATE_CHANNEL` - Default release channel
- `NO_COLOR` - Disable colored output

## Troubleshooting

### "Command not found"

Make sure you're using `npx` or have installed the package:
```bash
npx native-update <command>
```

### "EACCES: permission denied"

Key files need proper permissions:
```bash
chmod 600 ./keys/private-*.pem
```

### Bundle creation fails

Ensure your web directory contains built files:
```bash
# Build first
npm run build

# Then create bundle
npx native-update bundle create ./www
```

## Best Practices

1. **Security**
   - Keep private keys secure and never commit them
   - Use strong RSA 4096 keys for production
   - Always sign bundles before deployment

2. **Versioning**
   - Use semantic versioning (1.0.0, 1.0.1, etc.)
   - Increment versions for each update
   - Use channels for staged rollouts

3. **Testing**
   - Test updates locally first using `server start`
   - Verify bundles before deployment
   - Use staging channel before production

4. **Monitoring**
   - Always monitor deployments
   - Set up alerts for failed updates
   - Track adoption rates