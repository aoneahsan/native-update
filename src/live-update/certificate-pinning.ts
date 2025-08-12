export interface CertificatePin {
  /**
   * Hostname to pin certificates for (e.g., "api.example.com")
   */
  hostname: string;
  
  /**
   * Array of SHA-256 certificate fingerprints in the format "sha256/base64hash"
   */
  sha256: string[];
}

export interface CertificatePinningConfig {
  /**
   * Enable certificate pinning
   */
  enabled: boolean;
  
  /**
   * Array of certificate pins
   */
  pins: CertificatePin[];
}

/**
 * Certificate pinning utilities
 */
export class CertificatePinning {
  /**
   * Generate SHA-256 fingerprint from certificate
   * Note: This is a utility for generating pins, not for runtime validation
   */
  static async generateFingerprint(certificatePem: string): Promise<string> {
    // Remove PEM headers and convert to binary
    const base64 = certificatePem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Calculate SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    
    return `sha256/${hashBase64}`;
  }
  
  /**
   * Validate certificate pinning configuration
   */
  static validateConfig(config: CertificatePinningConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Certificate pinning config must be an object');
    }
    
    if (typeof config.enabled !== 'boolean') {
      throw new Error('Certificate pinning enabled must be a boolean');
    }
    
    if (!config.enabled) {
      return; // No need to validate pins if disabled
    }
    
    if (!Array.isArray(config.pins)) {
      throw new Error('Certificate pins must be an array');
    }
    
    for (const pin of config.pins) {
      if (!pin.hostname || typeof pin.hostname !== 'string') {
        throw new Error('Certificate pin hostname must be a non-empty string');
      }
      
      if (!Array.isArray(pin.sha256) || pin.sha256.length === 0) {
        throw new Error('Certificate pin sha256 must be a non-empty array');
      }
      
      for (const hash of pin.sha256) {
        if (!hash || typeof hash !== 'string' || !hash.startsWith('sha256/')) {
          throw new Error('Certificate pin hash must be in format "sha256/base64hash"');
        }
      }
    }
  }
  
  /**
   * Example configuration
   */
  static example(): CertificatePinningConfig {
    return {
      enabled: true,
      pins: [
        {
          hostname: 'api.example.com',
          sha256: [
            'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
            'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=' // Backup pin
          ]
        },
        {
          hostname: 'cdn.example.com',
          sha256: [
            'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC='
          ]
        }
      ]
    };
  }
}