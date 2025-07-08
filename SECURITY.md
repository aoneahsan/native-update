# Security Guidelines for Capacitor Native Update Plugin

This document outlines the security measures and best practices implemented in the Capacitor Native Update plugin, following the official [Capacitor Security Guidelines](https://capacitorjs.com/docs/guides/security).

## Table of Contents
- [Security Principles](#security-principles)
- [Secure Update Process](#secure-update-process)
- [Platform-Specific Security](#platform-specific-security)
- [Data Protection](#data-protection)
- [Network Security](#network-security)
- [Input Validation](#input-validation)
- [Permission Management](#permission-management)
- [Security Configuration](#security-configuration)
- [Security Checklist](#security-checklist)

## Security Principles

### 1. No Embedded Secrets
- **Never** embed API keys, encryption keys, or certificates in the plugin code
- All sensitive configuration must be provided at runtime by the host application
- Use environment-specific configuration files that are not committed to version control

### 2. Defense in Depth
- Multiple layers of security validation
- Fail securely - deny by default
- Comprehensive error handling without exposing sensitive information

### 3. Principle of Least Privilege
- Request only necessary permissions
- Minimize access to system resources
- Isolate update processes from main application

## Secure Update Process

### Bundle Verification
```typescript
// Example of secure update verification
const verifyUpdate = async (bundle: UpdateBundle): Promise<boolean> => {
  // 1. Verify HTTPS URL
  if (!bundle.url.startsWith('https://')) {
    throw new SecurityError('INSECURE_URL', 'Updates must use HTTPS');
  }
  
  // 2. Verify checksum
  const calculatedChecksum = await calculateSHA256(bundle.data);
  if (calculatedChecksum !== bundle.expectedChecksum) {
    throw new SecurityError('INVALID_CHECKSUM', 'Bundle integrity check failed');
  }
  
  // 3. Verify signature (if configured)
  if (config.requireSignature) {
    const isValidSignature = await verifySignature(bundle.data, bundle.signature, publicKey);
    if (!isValidSignature) {
      throw new SecurityError('INVALID_SIGNATURE', 'Bundle signature verification failed');
    }
  }
  
  return true;
};
```

### Version Validation
- Prevent downgrade attacks by default
- Semantic version comparison
- Minimum native version requirements

## Platform-Specific Security

### iOS Security

#### Keychain Usage
```swift
// Store sensitive data in Keychain, not UserDefaults
let keychain = KeychainWrapper()
keychain.set(updateKey, forKey: "UpdateEncryptionKey")
```

#### File System Security
```swift
// Validate file operations stay within app sandbox
guard let documentsPath = FileManager.default.urls(for: .documentDirectory, 
                                                   in: .userDomainMask).first else {
    throw UpdateError.invalidPath
}

let updatePath = documentsPath.appendingPathComponent("updates")
// Ensure path doesn't escape sandbox
guard updatePath.path.hasPrefix(documentsPath.path) else {
    throw UpdateError.pathTraversal
}
```

### Android Security

#### Android Keystore
```kotlin
// Use Android Keystore for sensitive data
val keyAlias = "UpdateKeyAlias"
val keyStore = KeyStore.getInstance("AndroidKeyStore")
keyStore.load(null)

// Generate or retrieve key
if (!keyStore.containsAlias(keyAlias)) {
    val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    val keyGenParameterSpec = KeyGenParameterSpec.Builder(
        keyAlias,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
    ).build()
    keyGenerator.init(keyGenParameterSpec)
    keyGenerator.generateKey()
}
```

#### Permission Handling
```java
@Permission(strings = { 
    Manifest.permission.INTERNET,
    Manifest.permission.ACCESS_NETWORK_STATE 
}, alias = "network")
@Permission(strings = { 
    Manifest.permission.WRITE_EXTERNAL_STORAGE 
}, alias = "storage")
public class NativeUpdatePlugin extends Plugin {
    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        if (!hasPermission("network")) {
            requestPermissionForAlias("network", call, "handleNetworkPermission");
            return;
        }
        // Proceed with download
    }
}
```

## Data Protection

### Secure Storage
1. **Sensitive Data**: Store in platform-specific secure storage (Keychain/Keystore)
2. **Update Metadata**: Store in app-specific directories with restricted permissions
3. **Temporary Files**: Use system temp directories and clean up immediately

### Encryption
```typescript
// Example encryption configuration
export interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 100000;
  saltLength: 32;
}
```

## Network Security

### HTTPS Enforcement
```typescript
// Validate URLs before making requests
const validateUpdateUrl = (url: string): void => {
  const parsedUrl = new URL(url);
  
  if (parsedUrl.protocol !== 'https:') {
    throw new SecurityError('INSECURE_PROTOCOL', 'Only HTTPS URLs are allowed');
  }
  
  // Optional: Validate against whitelist
  if (config.allowedHosts && !config.allowedHosts.includes(parsedUrl.host)) {
    throw new SecurityError('UNAUTHORIZED_HOST', 'Update host not in whitelist');
  }
};
```

### Certificate Pinning
```typescript
// Certificate pinning configuration
export interface CertificatePinning {
  enabled: boolean;
  certificates: string[]; // Base64 encoded certificates
  includeSubdomains: boolean;
  maxAge: number; // Seconds
}
```

## Input Validation

### JavaScript to Native Bridge
```typescript
// Validate all inputs from JavaScript
const validateUpdateOptions = (options: any): UpdateOptions => {
  // Type validation
  if (typeof options !== 'object' || options === null) {
    throw new ValidationError('Invalid options object');
  }
  
  // URL validation
  if (typeof options.url !== 'string' || !options.url) {
    throw new ValidationError('URL must be a non-empty string');
  }
  
  // Version validation
  if (options.version && !isValidSemver(options.version)) {
    throw new ValidationError('Invalid version format');
  }
  
  // File size validation
  if (options.maxSize && (typeof options.maxSize !== 'number' || options.maxSize <= 0)) {
    throw new ValidationError('maxSize must be a positive number');
  }
  
  return options as UpdateOptions;
};
```

### Path Validation
```typescript
// Prevent directory traversal attacks
const sanitizePath = (path: string): string => {
  // Remove any path traversal attempts
  const cleaned = path.replace(/\.\./g, '').replace(/\/\//g, '/');
  
  // Ensure path is within allowed directory
  if (!cleaned.startsWith(ALLOWED_UPDATE_PATH)) {
    throw new SecurityError('PATH_TRAVERSAL', 'Invalid update path');
  }
  
  return cleaned;
};
```

## Permission Management

### Android Permissions
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- Request at runtime for Android 6.0+ -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                 android:maxSdkVersion="28" />
```

### iOS Permissions
```xml
<!-- Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Only allow HTTPS connections -->
    <key>NSAllowsArbitraryLoads</key>
    <false/>
</dict>
```

## Security Configuration

### Recommended Configuration
```typescript
const secureConfig: UpdateSecurityConfig = {
  // Network Security
  enforceHttps: true,
  certificatePinning: {
    enabled: true,
    certificates: ['sha256/...'],
    maxAge: 60 * 60 * 24 * 30 // 30 days
  },
  
  // Update Security
  requireSignature: true,
  allowDowngrade: false,
  checksumAlgorithm: 'SHA-256',
  
  // Storage Security
  encryptStorage: true,
  secureStorageKeys: ['updateKey', 'serverConfig'],
  
  // Validation
  maxBundleSize: 50 * 1024 * 1024, // 50MB
  allowedHosts: ['updates.example.com'],
  
  // Error Handling
  exposeDetailedErrors: false,
  logSecurityEvents: true
};
```

## Security Checklist

### Development Phase
- [ ] No hardcoded secrets or keys in code
- [ ] All network requests use HTTPS
- [ ] Input validation on all public methods
- [ ] Proper error handling without exposing internals
- [ ] Secure storage for sensitive data
- [ ] Permission requests are minimal and justified

### Before Release
- [ ] Security audit of all native code
- [ ] Penetration testing of update mechanism
- [ ] Certificate pinning configured for production
- [ ] All debug logs removed from production builds
- [ ] Documentation of security features complete
- [ ] Security configuration examples provided

### Ongoing Maintenance
- [ ] Regular dependency updates
- [ ] Security patch monitoring
- [ ] Incident response plan
- [ ] Regular security audits
- [ ] User security guidance updates

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

Please do **not** file public issues for security vulnerabilities.