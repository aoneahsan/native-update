import { describe, it, expect } from 'vitest';
import { SecurityValidator } from '../core/security';

describe('SecurityValidator', () => {
  describe('validateUrl', () => {
    it('should accept HTTPS URLs', () => {
      expect(SecurityValidator.validateUrl('https://example.com')).toBe(true);
      expect(
        SecurityValidator.validateUrl('https://sub.example.com/path')
      ).toBe(true);
      expect(SecurityValidator.validateUrl('https://example.com:8443')).toBe(
        true
      );
    });

    it('should reject HTTP URLs', () => {
      expect(SecurityValidator.validateUrl('http://example.com')).toBe(false);
      expect(SecurityValidator.validateUrl('http://localhost')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(SecurityValidator.validateUrl('not-a-url')).toBe(false);
      expect(SecurityValidator.validateUrl('')).toBe(false);
      expect(SecurityValidator.validateUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('validateChecksum', () => {
    it('should validate SHA-256 checksums', () => {
      const validChecksum = 'a'.repeat(64);
      expect(SecurityValidator.validateChecksum(validChecksum)).toBe(true);
    });

    it('should reject invalid checksums', () => {
      expect(SecurityValidator.validateChecksum('too-short')).toBe(false);
      expect(SecurityValidator.validateChecksum('invalid@chars')).toBe(false);
      expect(SecurityValidator.validateChecksum('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize dangerous input', () => {
      expect(SecurityValidator.sanitizeInput('<script>alert(1)</script>')).toBe(
        'alert1'
      );
      expect(SecurityValidator.sanitizeInput('normal text')).toBe(
        'normal text'
      );
      expect(SecurityValidator.sanitizeInput('path/to/file')).toBe(
        'path/to/file'
      );
    });

    it('should handle null and undefined', () => {
      expect(SecurityValidator.sanitizeInput(null as unknown as string)).toBe('');
      expect(SecurityValidator.sanitizeInput(undefined as unknown as string)).toBe('');
    });
  });

  describe('validateBundleSize', () => {
    it('should accept reasonable bundle sizes', () => {
      expect(SecurityValidator.validateBundleSize(1024 * 1024)).toBe(true); // 1MB
      expect(SecurityValidator.validateBundleSize(50 * 1024 * 1024)).toBe(true); // 50MB
    });

    it('should reject excessive sizes', () => {
      expect(SecurityValidator.validateBundleSize(200 * 1024 * 1024)).toBe(
        false
      ); // 200MB
      expect(SecurityValidator.validateBundleSize(-1)).toBe(false);
      expect(SecurityValidator.validateBundleSize(0)).toBe(false);
    });
  });
});
