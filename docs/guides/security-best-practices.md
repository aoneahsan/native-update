# Security Best Practices

Security is paramount when implementing update mechanisms in mobile applications. This guide covers comprehensive security measures to protect your app and users from potential threats while maintaining a seamless update experience.

## Security Overview

The plugin implements multiple layers of security:

- **Transport Security**: HTTPS enforcement and certificate pinning
- **Content Security**: Cryptographic signatures and checksums
- **Input Validation**: Sanitization and validation of all inputs
- **Storage Security**: Secure storage of sensitive data
- **Access Control**: Permission-based security model

## Core Security Principles

### 1. Never Trust Input

```typescript
// Always validate and sanitize inputs
class SecurityValidator {
  static validateVersion(version: string): boolean {
    // Semantic version regex
    const versionRegex =
      /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

    if (!versionRegex.test(version)) {
      throw new Error('Invalid version format');
    }

    // Check for suspicious patterns
    if (
      version.includes('..') ||
      version.includes('/') ||
      version.includes('\\')
    ) {
      throw new Error('Version contains invalid characters');
    }

    return true;
  }

  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Only allow HTTPS in production
      if (
        parsed.protocol !== 'https:' &&
        process.env.NODE_ENV === 'production'
      ) {
        throw new Error('Only HTTPS URLs are allowed in production');
      }

      // Check against allowlist
      if (!this.isAllowedHost(parsed.hostname)) {
        throw new Error('Host not in allowlist');
      }

      return true;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  static validateBundleId(bundleId: string): boolean {
    // Bundle ID should be alphanumeric with hyphens
    const bundleRegex = /^[a-zA-Z0-9-]+$/;

    if (!bundleRegex.test(bundleId)) {
      throw new Error('Invalid bundle ID format');
    }

    // Prevent path traversal
    if (bundleId.includes('..') || bundleId.includes('/')) {
      throw new Error('Bundle ID contains invalid characters');
    }

    return true;
  }
}
```

### 2. Implement Defense in Depth

```typescript
// Multiple security layers
class SecurityManager {
  async validateUpdate(bundle: BundleInfo): Promise<ValidationResult> {
    const validations = [
      () => this.validateChecksum(bundle),
      () => this.validateSignature(bundle),
      () => this.validateSize(bundle),
      () => this.validateMetadata(bundle),
      () => this.validateContent(bundle),
    ];

    for (const validation of validations) {
      const result = await validation();
      if (!result.valid) {
        return {
          valid: false,
          reason: result.reason,
          securityLevel: 'HIGH',
        };
      }
    }

    return { valid: true };
  }

  private async validateChecksum(
    bundle: BundleInfo
  ): Promise<ValidationResult> {
    try {
      const calculatedHash = await this.calculateChecksum(bundle.path);

      if (calculatedHash !== bundle.checksum) {
        // Log security event
        await this.logSecurityEvent('CHECKSUM_MISMATCH', {
          bundleId: bundle.bundleId,
          expected: bundle.checksum,
          actual: calculatedHash,
        });

        return {
          valid: false,
          reason: 'Checksum validation failed',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Checksum validation error: ${error.message}`,
      };
    }
  }

  private async validateSignature(
    bundle: BundleInfo
  ): Promise<ValidationResult> {
    if (!bundle.signature) {
      return {
        valid: false,
        reason: 'No signature provided',
      };
    }

    try {
      const publicKey = await this.getPublicKey();
      const verified = await this.verifySignature(bundle, publicKey);

      if (!verified) {
        await this.logSecurityEvent('SIGNATURE_VERIFICATION_FAILED', {
          bundleId: bundle.bundleId,
        });

        return {
          valid: false,
          reason: 'Signature verification failed',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Signature validation error: ${error.message}`,
      };
    }
  }
}
```

## Transport Security

### HTTPS Enforcement

```typescript
// Always use HTTPS in production
const secureConfig = {
  liveUpdate: {
    serverUrl: 'https://updates.yourserver.com', // Never use HTTP
    enforceHttps: true,
  },
  security: {
    enforceHttps: true,
    allowInsecureConnections: false, // Only for development
  },
};

// URL validation
class TransportSecurity {
  static validateUpdateUrl(url: string): boolean {
    const parsed = new URL(url);

    // Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs are allowed');
    }

    // Check for suspicious patterns
    if (
      url.includes('..') ||
      (url.includes('localhost') && process.env.NODE_ENV === 'production')
    ) {
      throw new Error('Suspicious URL pattern detected');
    }

    return true;
  }
}
```

### Certificate Pinning

```typescript
// Implement certificate pinning for maximum security
const certificatePinningConfig = {
  security: {
    certificatePinning: {
      enabled: true,
      certificates: [
        // SHA-256 hash of your server's certificate
        'sha256/YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=',
        // Backup certificate
        'sha256/Vjs8r4z+80wjNcr1YKepWQboSIRi63WsWXhIMN+eWys=',
      ],
      includeSubdomains: true,
      maxAge: 31536000, // 1 year
      reportUri: 'https://yourserver.com/hpkp-report',
    },
  },
};

// Certificate validation
class CertificatePinning {
  private pinnedCertificates: string[] = [];

  async validateCertificate(
    hostname: string,
    certificate: string
  ): Promise<boolean> {
    // Calculate SHA-256 hash of certificate
    const certHash = await this.calculateSHA256(certificate);
    const formattedHash = `sha256/${certHash}`;

    // Check against pinned certificates
    if (!this.pinnedCertificates.includes(formattedHash)) {
      // Log security incident
      await this.logSecurityIncident('CERTIFICATE_PIN_MISMATCH', {
        hostname,
        expectedCerts: this.pinnedCertificates,
        actualCert: formattedHash,
      });

      return false;
    }

    return true;
  }
}
```

## Content Security

### Cryptographic Signatures

```typescript
// Implement RSA-PSS signature verification
class SignatureVerification {
  private publicKey: CryptoKey | null = null;

  async initialize(publicKeyPem: string) {
    try {
      // Import public key
      this.publicKey = await crypto.subtle.importKey(
        'spki',
        this.pemToArrayBuffer(publicKeyPem),
        {
          name: 'RSA-PSS',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );
    } catch (error) {
      throw new Error(`Failed to import public key: ${error.message}`);
    }
  }

  async verifyBundle(bundle: BundleInfo): Promise<boolean> {
    if (!this.publicKey) {
      throw new Error('Public key not initialized');
    }

    if (!bundle.signature) {
      throw new Error('No signature provided');
    }

    try {
      // Create message to verify (bundle metadata + content hash)
      const message = this.createSignatureMessage(bundle);
      const messageBuffer = new TextEncoder().encode(message);

      // Decode signature
      const signatureBuffer = this.base64ToArrayBuffer(bundle.signature);

      // Verify signature
      const verified = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        this.publicKey,
        signatureBuffer,
        messageBuffer
      );

      return verified;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  private createSignatureMessage(bundle: BundleInfo): string {
    // Create deterministic message for signature
    return JSON.stringify({
      bundleId: bundle.bundleId,
      version: bundle.version,
      checksum: bundle.checksum,
      size: bundle.size,
      timestamp: bundle.downloadTime,
    });
  }
}
```

### Checksum Validation

```typescript
// Implement strong checksum validation
class ChecksumValidator {
  async validateBundle(bundle: BundleInfo): Promise<boolean> {
    try {
      // Calculate SHA-512 checksum
      const calculatedChecksum = await this.calculateSHA512(bundle.path);

      // Compare with provided checksum
      if (calculatedChecksum !== bundle.checksum) {
        await this.logSecurityEvent('CHECKSUM_MISMATCH', {
          bundleId: bundle.bundleId,
          expected: bundle.checksum,
          calculated: calculatedChecksum,
        });

        return false;
      }

      return true;
    } catch (error) {
      console.error('Checksum validation failed:', error);
      return false;
    }
  }

  private async calculateSHA512(filePath: string): Promise<string> {
    // Platform-specific implementation
    if (this.isWeb()) {
      return this.calculateWebChecksum(filePath);
    } else {
      return this.calculateNativeChecksum(filePath);
    }
  }

  private async calculateWebChecksum(filePath: string): Promise<string> {
    const response = await fetch(filePath);
    const buffer = await response.arrayBuffer();

    const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
    return this.arrayBufferToHex(hashBuffer);
  }
}
```

## Input Validation and Sanitization

### Comprehensive Input Validation

```typescript
class InputValidator {
  static validateUpdateRequest(request: UpdateRequest): ValidationResult {
    const validations = [
      () => this.validateVersion(request.version),
      () => this.validateChannel(request.channel),
      () => this.validateAppId(request.appId),
      () => this.validateHeaders(request.headers),
      () => this.validateParameters(request.parameters),
    ];

    for (const validation of validations) {
      const result = validation();
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  private static validateVersion(version: string): ValidationResult {
    // Check format
    if (!version || typeof version !== 'string') {
      return { valid: false, reason: 'Version must be a string' };
    }

    // Check length
    if (version.length > 50) {
      return { valid: false, reason: 'Version too long' };
    }

    // Check semantic version format
    const semverRegex =
      /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    if (!semverRegex.test(version)) {
      return { valid: false, reason: 'Invalid semantic version format' };
    }

    // Check for dangerous patterns
    const dangerousPatterns = ['..', '/', '\\', '<', '>', '&', '"', "'"];
    for (const pattern of dangerousPatterns) {
      if (version.includes(pattern)) {
        return {
          valid: false,
          reason: 'Version contains dangerous characters',
        };
      }
    }

    return { valid: true };
  }

  private static validateChannel(channel: string): ValidationResult {
    // Allowlist of valid channels
    const validChannels = [
      'production',
      'staging',
      'beta',
      'alpha',
      'development',
    ];

    if (!validChannels.includes(channel)) {
      return { valid: false, reason: 'Invalid channel' };
    }

    return { valid: true };
  }

  private static validateAppId(appId: string): ValidationResult {
    // App ID format: com.company.app
    const appIdRegex = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/;

    if (!appIdRegex.test(appId)) {
      return { valid: false, reason: 'Invalid app ID format' };
    }

    // Check length
    if (appId.length > 100) {
      return { valid: false, reason: 'App ID too long' };
    }

    return { valid: true };
  }
}
```

### SQL Injection Prevention

```typescript
// Prevent SQL injection in server-side queries
class DatabaseSecurity {
  async getUpdateInfo(
    appId: string,
    version: string
  ): Promise<UpdateInfo | null> {
    // Use parameterized queries
    const query = `
      SELECT * FROM app_updates 
      WHERE app_id = ? AND version = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // Validate inputs before query
    if (!InputValidator.validateAppId(appId).valid) {
      throw new Error('Invalid app ID');
    }

    if (!InputValidator.validateVersion(version).valid) {
      throw new Error('Invalid version');
    }

    // Execute with parameters
    const result = await this.database.query(query, [appId, version]);
    return result[0] || null;
  }
}
```

## Storage Security

### Secure Key Management

```typescript
class SecureKeyManager {
  private static readonly KEY_ALIAS = 'update_keys';

  async storePrivateKey(privateKey: string): Promise<void> {
    if (this.isAndroid()) {
      // Use Android Keystore
      await this.storeInAndroidKeystore(privateKey);
    } else if (this.isIOS()) {
      // Use iOS Keychain
      await this.storeInKeychainServices(privateKey);
    } else {
      // Web - use secure storage if available
      await this.storeInSecureStorage(privateKey);
    }
  }

  async getPrivateKey(): Promise<string | null> {
    try {
      if (this.isAndroid()) {
        return await this.getFromAndroidKeystore();
      } else if (this.isIOS()) {
        return await this.getFromKeychainServices();
      } else {
        return await this.getFromSecureStorage();
      }
    } catch (error) {
      console.error('Failed to retrieve private key:', error);
      return null;
    }
  }

  private async storeInAndroidKeystore(privateKey: string): Promise<void> {
    // Use Android Keystore for secure storage
    const keyStore = await this.getAndroidKeyStore();
    await keyStore.store(this.KEY_ALIAS, privateKey, {
      requireAuthentication: true,
      encryptionRequired: true,
    });
  }

  private async storeInKeychainServices(privateKey: string): Promise<void> {
    // Use iOS Keychain Services
    const keychain = await this.getIOSKeychain();
    await keychain.store(this.KEY_ALIAS, privateKey, {
      accessibility: 'kSecAttrAccessibleWhenUnlockedThisDeviceOnly',
      synchronizable: false,
    });
  }
}
```

### Secure Bundle Storage

```typescript
class SecureBundleStorage {
  private readonly BUNDLE_DIR = 'secure_bundles';

  async storeBundleSecurely(
    bundle: BundleInfo,
    content: ArrayBuffer
  ): Promise<string> {
    // Generate unique file name
    const fileName = await this.generateSecureFileName(bundle);
    const filePath = path.join(this.BUNDLE_DIR, fileName);

    // Encrypt content before storage
    const encryptedContent = await this.encryptBundle(content);

    // Store with proper permissions
    await this.storeWithRestrictedPermissions(filePath, encryptedContent);

    // Create metadata file
    await this.createMetadataFile(bundle, fileName);

    return filePath;
  }

  private async encryptBundle(content: ArrayBuffer): Promise<ArrayBuffer> {
    // Generate random encryption key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt content
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      content
    );

    // Store key securely
    await this.storeEncryptionKey(key);

    // Combine IV and encrypted content
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result.buffer;
  }

  private async storeWithRestrictedPermissions(
    filePath: string,
    content: ArrayBuffer
  ): Promise<void> {
    // Platform-specific secure storage
    if (this.isAndroid()) {
      await this.storeAndroidSecure(filePath, content);
    } else if (this.isIOS()) {
      await this.storeIOSSecure(filePath, content);
    } else {
      await this.storeWebSecure(filePath, content);
    }
  }
}
```

## Access Control and Permissions

### Permission-Based Security

```typescript
class PermissionManager {
  private permissions: Map<string, Permission> = new Map();

  async requestUpdatePermission(context: UpdateContext): Promise<boolean> {
    // Check if permission is already granted
    if (await this.hasPermission('update', context)) {
      return true;
    }

    // Request permission based on platform
    if (this.isAndroid()) {
      return await this.requestAndroidPermission(context);
    } else if (this.isIOS()) {
      return await this.requestIOSPermission(context);
    } else {
      return await this.requestWebPermission(context);
    }
  }

  private async requestAndroidPermission(
    context: UpdateContext
  ): Promise<boolean> {
    // Request necessary Android permissions
    const permissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ];

    for (const permission of permissions) {
      const granted = await this.requestSystemPermission(permission);
      if (!granted) {
        return false;
      }
    }

    return true;
  }

  async validatePermission(
    action: string,
    context: UpdateContext
  ): Promise<boolean> {
    const permission = this.permissions.get(action);

    if (!permission) {
      throw new Error(`Permission not found: ${action}`);
    }

    // Check conditions
    for (const condition of permission.conditions) {
      if (!(await condition.check(context))) {
        return false;
      }
    }

    return true;
  }
}
```

## Security Monitoring and Logging

### Security Event Logging

```typescript
class SecurityLogger {
  private logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' = 'INFO';

  async logSecurityEvent(eventType: string, details: any): Promise<void> {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      severity: this.getSeverity(eventType),
      details: this.sanitizeDetails(details),
      deviceInfo: await this.getDeviceInfo(),
      appVersion: await this.getAppVersion(),
      userId: await this.getUserId(), // Hash or anonymize
    };

    // Store locally
    await this.storeLogLocally(event);

    // Send to security monitoring service
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.sendToMonitoringService(event);
    }
  }

  private getSeverity(
    eventType: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap = {
      CHECKSUM_MISMATCH: 'HIGH',
      SIGNATURE_VERIFICATION_FAILED: 'CRITICAL',
      CERTIFICATE_PIN_MISMATCH: 'CRITICAL',
      INVALID_INPUT: 'MEDIUM',
      PERMISSION_DENIED: 'HIGH',
      SUSPICIOUS_ACTIVITY: 'HIGH',
      RATE_LIMIT_EXCEEDED: 'MEDIUM',
    };

    return severityMap[eventType] || 'LOW';
  }

  private sanitizeDetails(details: any): any {
    // Remove sensitive information
    const sanitized = { ...details };

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'privateKey'];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
```

### Intrusion Detection

```typescript
class IntrusionDetection {
  private suspiciousActivity: Map<string, number> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly TIME_WINDOW = 300000; // 5 minutes

  async checkSuspiciousActivity(
    clientId: string,
    action: string
  ): Promise<boolean> {
    const key = `${clientId}:${action}`;
    const attempts = this.suspiciousActivity.get(key) || 0;

    if (attempts >= this.MAX_ATTEMPTS) {
      await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        clientId,
        action,
        attempts,
      });

      return true; // Suspicious
    }

    // Increment attempts
    this.suspiciousActivity.set(key, attempts + 1);

    // Reset after time window
    setTimeout(() => {
      this.suspiciousActivity.delete(key);
    }, this.TIME_WINDOW);

    return false;
  }

  async detectAnomalies(updateRequest: UpdateRequest): Promise<boolean> {
    const anomalies = [
      this.checkFrequency(updateRequest),
      this.checkRequestPatterns(updateRequest),
      this.checkGeolocation(updateRequest),
      this.checkDeviceFingerprint(updateRequest),
    ];

    const suspiciousCount = (await Promise.all(anomalies)).filter(
      Boolean
    ).length;

    if (suspiciousCount >= 2) {
      await this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        anomalies: suspiciousCount,
        request: updateRequest,
      });

      return true;
    }

    return false;
  }
}
```

## Incident Response

### Security Incident Handling

```typescript
class SecurityIncidentHandler {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // Classify incident
    const classification = this.classifyIncident(incident);

    // Immediate response
    await this.immediateResponse(incident, classification);

    // Investigate
    await this.investigate(incident);

    // Remediate
    await this.remediate(incident);

    // Document
    await this.documentIncident(incident);
  }

  private async immediateResponse(
    incident: SecurityIncident,
    classification: IncidentClassification
  ): Promise<void> {
    switch (classification.severity) {
      case 'CRITICAL':
        // Disable updates immediately
        await this.disableUpdates();

        // Notify security team
        await this.notifySecurityTeam(incident);

        // Isolate affected systems
        await this.isolateAffectedSystems(incident);
        break;

      case 'HIGH':
        // Increase monitoring
        await this.increaseMonitoring();

        // Review recent updates
        await this.reviewRecentUpdates();
        break;

      case 'MEDIUM':
        // Log and monitor
        await this.logAndMonitor(incident);
        break;
    }
  }

  private async disableUpdates(): Promise<void> {
    // Disable all update channels
    await this.updateServerConfig({
      updatesEnabled: false,
      reason: 'Security incident response',
    });

    // Notify all clients
    await this.broadcastSecurityAlert({
      type: 'UPDATES_DISABLED',
      message: 'Updates temporarily disabled due to security incident',
    });
  }

  private async remediate(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'COMPROMISED_SIGNING_KEY':
        await this.rotateSigningKeys();
        await this.revokeCompromisedCertificates();
        break;

      case 'MALICIOUS_UPDATE':
        await this.rollbackToSafeVersion();
        await this.blacklistMaliciousBundle();
        break;

      case 'SERVER_COMPROMISE':
        await this.isolateServers();
        await this.rebuildeFromCleanBackup();
        break;
    }
  }
}
```

## Production Security Checklist

### Pre-Deployment Security Audit

```typescript
class SecurityAudit {
  async performSecurityAudit(): Promise<AuditResult> {
    const checks = [
      this.checkCryptographicImplementation(),
      this.checkInputValidation(),
      this.checkTransportSecurity(),
      this.checkStorageSecurity(),
      this.checkPermissions(),
      this.checkLogging(),
      this.checkIncidentResponse(),
    ];

    const results = await Promise.all(checks);

    return {
      passed: results.every((r) => r.passed),
      results,
      recommendations: this.generateRecommendations(results),
    };
  }

  private async checkCryptographicImplementation(): Promise<CheckResult> {
    const checks = [
      this.verifySignatureAlgorithm(),
      this.verifyHashAlgorithm(),
      this.verifyKeyLength(),
      this.verifyRandomness(),
    ];

    const results = await Promise.all(checks);

    return {
      category: 'Cryptographic Implementation',
      passed: results.every((r) => r.passed),
      details: results,
    };
  }

  private async checkInputValidation(): Promise<CheckResult> {
    const testCases = [
      { input: '../../../etc/passwd', expected: 'rejected' },
      { input: '<script>alert("xss")</script>', expected: 'rejected' },
      { input: 'DROP TABLE users;', expected: 'rejected' },
      { input: 'valid-version-1.0.0', expected: 'accepted' },
    ];

    const results = [];

    for (const testCase of testCases) {
      const result = await this.testInputValidation(testCase.input);
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: result,
        passed: result === testCase.expected,
      });
    }

    return {
      category: 'Input Validation',
      passed: results.every((r) => r.passed),
      details: results,
    };
  }
}
```

### Security Configuration Template

```typescript
// Production security configuration
const productionSecurityConfig = {
  liveUpdate: {
    // Enable all security features
    requireSignature: true,
    checksumAlgorithm: 'SHA-512',
    publicKey: process.env.UPDATE_PUBLIC_KEY,
    allowedHosts: ['updates.yourserver.com'],
    maxBundleSize: 50 * 1024 * 1024, // 50MB
    allowEmulator: false,
  },

  security: {
    // Transport security
    enforceHttps: true,
    certificatePinning: {
      enabled: true,
      certificates: [
        process.env.CERT_HASH_PRIMARY,
        process.env.CERT_HASH_BACKUP,
      ],
    },

    // Input validation
    validateInputs: true,
    sanitizeInputs: true,

    // Storage security
    secureStorage: true,
    encryptBundles: true,

    // Monitoring
    logSecurityEvents: true,
    enableIntrusionDetection: true,

    // Rate limiting
    enableRateLimit: true,
    maxRequestsPerMinute: 60,
  },

  monitoring: {
    // Security monitoring
    securityEventEndpoint: process.env.SECURITY_MONITOR_URL,
    alertThreshold: 'HIGH',

    // Performance monitoring
    performanceEndpoint: process.env.PERFORMANCE_MONITOR_URL,

    // Error tracking
    errorTrackingEndpoint: process.env.ERROR_TRACKING_URL,
  },
};
```

## Next Steps

- Review [Production Readiness](../production-readiness.md) checklist
- Implement proper monitoring and analytics
- Set up incident response procedures
- Configure update server security (see backend-template folder)

---

Made with ❤️ by Ahsan Mahmood
