import { describe, it, expect } from 'vitest';
import { VersionManager } from '../live-update/version-manager';

describe('VersionManager', () => {
  describe('compareVersions', () => {
    it('should correctly compare semantic versions', () => {
      expect(VersionManager.compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(VersionManager.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(VersionManager.compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(VersionManager.compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(VersionManager.compareVersions('1.0.0-alpha', '1.0.0')).toBe(-1);
    });

    it('should handle invalid versions', () => {
      expect(VersionManager.compareVersions('invalid', '1.0.0')).toBe(-1);
      expect(VersionManager.compareVersions('1.0.0', 'invalid')).toBe(1);
      expect(VersionManager.compareVersions('invalid', 'invalid')).toBe(0);
    });
  });

  describe('isValidVersion', () => {
    it('should validate semantic versions', () => {
      expect(VersionManager.isValidVersion('1.0.0')).toBe(true);
      expect(VersionManager.isValidVersion('1.2.3')).toBe(true);
      expect(VersionManager.isValidVersion('1.0.0-alpha')).toBe(true);
      expect(VersionManager.isValidVersion('1.0.0+build123')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(VersionManager.isValidVersion('1.0')).toBe(false);
      expect(VersionManager.isValidVersion('invalid')).toBe(false);
      expect(VersionManager.isValidVersion('')).toBe(false);
      expect(VersionManager.isValidVersion('v1.0.0')).toBe(false);
    });
  });

  describe('shouldUpdate', () => {
    it('should determine if update is needed', () => {
      expect(VersionManager.shouldUpdate('1.0.0', '1.0.1')).toBe(true);
      expect(VersionManager.shouldUpdate('1.0.0', '2.0.0')).toBe(true);
      expect(VersionManager.shouldUpdate('1.0.1', '1.0.0')).toBe(false);
      expect(VersionManager.shouldUpdate('1.0.0', '1.0.0')).toBe(false);
    });

    it('should respect minimum app version', () => {
      expect(VersionManager.shouldUpdate('1.0.0', '1.0.1', '1.0.0')).toBe(true);
      expect(VersionManager.shouldUpdate('1.0.0', '1.0.1', '2.0.0')).toBe(
        false
      );
    });
  });
});
