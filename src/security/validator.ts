import type { LiveUpdateConfig } from '../definitions';

/**
 * Input validation utilities
 */
export class Validator {
  /**
   * Validate URL
   */
  static validateUrl(url: string, enforceHttps: boolean = true): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);
      
      if (enforceHttps && parsed.protocol !== 'https:') {
        return { valid: false, error: 'URL must use HTTPS protocol' };
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Validate version string
   */
  static validateVersion(version: string): { valid: boolean; error?: string } {
    // Semantic versioning pattern
    const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    
    if (!semverPattern.test(version)) {
      return { valid: false, error: 'Invalid semantic version format' };
    }
    
    return { valid: true };
  }

  /**
   * Compare versions
   */
  static compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;
      
      if (v1 > v2) return 1;
      if (v1 < v2) return -1;
    }
    
    return 0;
  }

  /**
   * Validate bundle ID
   */
  static validateBundleId(bundleId: string): { valid: boolean; error?: string } {
    const pattern = /^[a-zA-Z0-9._-]+$/;
    
    if (!pattern.test(bundleId)) {
      return { valid: false, error: 'Bundle ID contains invalid characters' };
    }
    
    if (bundleId.length > 255) {
      return { valid: false, error: 'Bundle ID is too long' };
    }
    
    return { valid: true };
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, maxSize: number): { valid: boolean; error?: string } {
    if (size <= 0) {
      return { valid: false, error: 'Invalid file size' };
    }
    
    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { valid: false, error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` };
    }
    
    return { valid: true };
  }

  /**
   * Validate configuration
   */
  static validateLiveUpdateConfig(config: LiveUpdateConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!config.appId) {
      errors.push('App ID is required');
    }
    
    if (!config.serverUrl) {
      errors.push('Server URL is required');
    } else {
      const urlValidation = this.validateUrl(config.serverUrl);
      if (!urlValidation.valid) {
        errors.push(urlValidation.error!);
      }
    }
    
    // Optional fields validation
    if (config.maxBundleSize && config.maxBundleSize <= 0) {
      errors.push('Max bundle size must be positive');
    }
    
    if (config.checkInterval && config.checkInterval < 60000) {
      errors.push('Check interval must be at least 60 seconds');
    }
    
    if (config.allowedHosts) {
      for (const host of config.allowedHosts) {
        if (!this.isValidHost(host)) {
          errors.push(`Invalid host: ${host}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate host
   */
  static isValidHost(host: string): boolean {
    // Basic hostname validation
    const hostPattern = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    return hostPattern.test(host);
  }

  /**
   * Sanitize input string
   */
  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[^\w\s.-]/gi, '');
  }

  /**
   * Validate path (prevent directory traversal)
   */
  static validatePath(path: string): { valid: boolean; error?: string } {
    if (path.includes('..') || path.includes('//')) {
      return { valid: false, error: 'Path contains invalid sequences' };
    }
    
    // Check for absolute paths on web
    if (typeof window !== 'undefined' && (path.startsWith('/') || path.includes(':'))) {
      return { valid: false, error: 'Absolute paths are not allowed' };
    }
    
    return { valid: true };
  }
}