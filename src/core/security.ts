import { ConfigManager } from './config';
import { ValidationError, ErrorCode } from './errors';
import { Logger } from './logger';

export class SecurityValidator {
  private static instance: SecurityValidator;
  private readonly configManager: ConfigManager;
  private readonly logger: Logger;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
  }

  static getInstance(): SecurityValidator {
    if (!SecurityValidator.instance) {
      SecurityValidator.instance = new SecurityValidator();
    }
    return SecurityValidator.instance;
  }

  /**
   * Validate URL is HTTPS
   */
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Validate checksum format
   */
  static validateChecksum(checksum: string): boolean {
    return /^[a-f0-9]{64}$/i.test(checksum);
  }

  /**
   * Sanitize input string
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    return input.replace(/<[^>]*>/g, '').replace(/[^\w\s/.-]/g, '');
  }

  /**
   * Validate bundle size
   */
  static validateBundleSize(size: number): boolean {
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    return size > 0 && size <= MAX_SIZE;
  }

  /**
   * Calculate SHA-256 checksum of data
   */
  async calculateChecksum(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify checksum matches expected value
   */
  async verifyChecksum(data: ArrayBuffer, expectedChecksum: string): Promise<boolean> {
    if (!expectedChecksum) {
      this.logger.warn('No checksum provided for verification');
      return true; // Allow if no checksum provided
    }

    const actualChecksum = await this.calculateChecksum(data);
    const isValid = actualChecksum === expectedChecksum.toLowerCase();
    
    if (!isValid) {
      this.logger.error('Checksum verification failed', {
        expected: expectedChecksum,
        actual: actualChecksum
      });
    }

    return isValid;
  }

  /**
   * Alias for verifyChecksum for backward compatibility
   */
  async validateChecksum(data: ArrayBuffer, expectedChecksum: string): Promise<boolean> {
    return this.verifyChecksum(data, expectedChecksum);
  }

  /**
   * Verify digital signature using Web Crypto API
   */
  async verifySignature(data: ArrayBuffer, signature: string): Promise<boolean> {
    if (!this.configManager.get('enableSignatureValidation')) {
      return true;
    }

    const publicKey = this.configManager.get('publicKey');
    if (!publicKey) {
      throw new ValidationError(
        ErrorCode.SIGNATURE_INVALID,
        'Public key not configured for signature validation'
      );
    }

    try {
      // Import public key
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        this.pemToArrayBuffer(publicKey),
        {
          name: 'RSA-PSS',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );

      // Verify signature
      const isValid = await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        cryptoKey,
        this.base64ToArrayBuffer(signature),
        data
      );

      if (!isValid) {
        this.logger.error('Signature verification failed');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Signature verification error', error);
      return false;
    }
  }

  /**
   * Convert PEM to ArrayBuffer
   */
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    return this.base64ToArrayBuffer(base64);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  sanitizePath(path: string): string {
    // Remove any parent directory references
    const sanitized = path
      .split('/')
      .filter(part => part !== '..' && part !== '.')
      .join('/');

    // Ensure path doesn't start with /
    return sanitized.replace(/^\/+/, '');
  }

  /**
   * Validate bundle ID format
   */
  validateBundleId(bundleId: string): void {
    if (!bundleId || typeof bundleId !== 'string') {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID must be a non-empty string'
      );
    }

    // Allow alphanumeric, hyphens, underscores, and dots
    const validPattern = /^[a-zA-Z0-9\-_.]+$/;
    if (!validPattern.test(bundleId)) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID contains invalid characters'
      );
    }

    if (bundleId.length > 100) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID is too long (max 100 characters)'
      );
    }
  }

  /**
   * Validate semantic version format
   */
  validateVersion(version: string): void {
    if (!version || typeof version !== 'string') {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Version must be a non-empty string'
      );
    }

    // Basic semantic versioning pattern
    const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    
    if (!semverPattern.test(version)) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Version must follow semantic versioning format (e.g., 1.2.3)'
      );
    }
  }

  /**
   * Check if version is a downgrade
   */
  isVersionDowngrade(currentVersion: string, newVersion: string): boolean {
    const current = this.parseVersion(currentVersion);
    const next = this.parseVersion(newVersion);

    if (next.major < current.major) return true;
    if (next.major > current.major) return false;

    if (next.minor < current.minor) return true;
    if (next.minor > current.minor) return false;

    return next.patch < current.patch;
  }

  /**
   * Parse semantic version
   */
  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('-')[0].split('.'); // Ignore pre-release
    return {
      major: parseInt(parts[0], 10) || 0,
      minor: parseInt(parts[1], 10) || 0,
      patch: parseInt(parts[2], 10) || 0,
    };
  }

  /**
   * Validate URL format and security
   */
  validateUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new ValidationError(
        ErrorCode.INVALID_URL,
        'URL must be a non-empty string'
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new ValidationError(
        ErrorCode.INVALID_URL,
        'Invalid URL format'
      );
    }

    // Enforce HTTPS
    if (parsedUrl.protocol !== 'https:') {
      throw new ValidationError(
        ErrorCode.INVALID_URL,
        'Only HTTPS URLs are allowed'
      );
    }

    // Check against allowed hosts
    const allowedHosts = this.configManager.get('allowedHosts');
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsedUrl.hostname)) {
      throw new ValidationError(
        ErrorCode.UNAUTHORIZED_HOST,
        `Host ${parsedUrl.hostname} is not in the allowed hosts list`
      );
    }

    // Prevent localhost/private IPs in production
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
    ];

    if (privatePatterns.some(pattern => pattern.test(parsedUrl.hostname))) {
      throw new ValidationError(
        ErrorCode.UNAUTHORIZED_HOST,
        'Private/local addresses are not allowed'
      );
    }
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): void {
    if (typeof size !== 'number' || size < 0) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'File size must be a non-negative number'
      );
    }

    const maxSize = this.configManager.get('maxBundleSize');
    if (size > maxSize) {
      throw new ValidationError(
        ErrorCode.BUNDLE_TOO_LARGE,
        `File size ${size} exceeds maximum allowed size of ${maxSize} bytes`
      );
    }
  }

  /**
   * Generate a secure random ID
   */
  generateSecureId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate certificate pinning for HTTPS connections
   * Note: This is a placeholder for web implementation as certificate pinning
   * is primarily implemented at the native layer
   */
  async validateCertificatePin(hostname: string, certificate: string): Promise<boolean> {
    // Certificate pinning is not available in PluginConfig type
    const certificatePins = (this.configManager as any).certificatePins;
    if (!certificatePins || !Array.isArray(certificatePins) || certificatePins.length === 0) {
      // No pins configured, allow connection
      return true;
    }

    const hostPins = certificatePins.filter((pin: any) => pin.hostname === hostname);
    if (hostPins.length === 0) {
      // No pins for this host, allow connection
      return true;
    }

    // Check if certificate matches any of the pins
    const certificateHash = await this.calculateCertificateHash(certificate);
    const isValid = hostPins.some((pin: any) => pin.sha256 === certificateHash);

    if (!isValid) {
      this.logger.error('Certificate pinning validation failed', {
        hostname,
        expectedPins: hostPins.map((p: any) => p.sha256),
        actualHash: certificateHash
      });
    }

    return isValid;
  }

  /**
   * Calculate SHA-256 hash of certificate
   */
  private async calculateCertificateHash(certificate: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(certificate);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256/' + btoa(String.fromCharCode(...hashArray));
  }

  /**
   * Validate metadata object
   */
  validateMetadata(metadata: unknown): void {
    if (metadata && typeof metadata !== 'object') {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Metadata must be an object'
      );
    }

    // Limit metadata size to prevent abuse
    const metadataStr = JSON.stringify(metadata || {});
    if (metadataStr.length > 10240) { // 10KB limit
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Metadata is too large (max 10KB)'
      );
    }
  }
}