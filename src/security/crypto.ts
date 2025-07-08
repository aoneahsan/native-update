/**
 * Cryptographic utilities for bundle verification
 */

export class CryptoUtils {
  /**
   * Calculate SHA-256 checksum of data
   */
  static async calculateChecksum(data: ArrayBuffer | string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify signature using public key
   */
  static async verifySignature(
    data: ArrayBuffer | string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Convert base64 strings to ArrayBuffer
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);
      
      // Import public key
      const key = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256',
        },
        false,
        ['verify']
      );
      
      // Prepare data
      const encoder = new TextEncoder();
      const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
      
      // Verify signature
      return await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32,
        },
        key,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate a random nonce
   */
  static generateNonce(length: number = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate checksum format
   */
  static isValidChecksum(checksum: string, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): boolean {
    const expectedLength = algorithm === 'SHA-256' ? 64 : 128;
    const hexPattern = /^[a-f0-9]+$/i;
    
    return checksum.length === expectedLength && hexPattern.test(checksum);
  }
}