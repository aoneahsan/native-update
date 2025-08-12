import { describe, it, expect, beforeEach } from 'vitest';
import { CapacitorNativeUpdateWeb } from '../web';
import type { PluginConfig } from '../definitions';

describe('Integration Tests', () => {
  let plugin: CapacitorNativeUpdateWeb;

  beforeEach(() => {
    plugin = new CapacitorNativeUpdateWeb();
  });

  describe('Plugin Lifecycle', () => {
    it('should configure and check for updates', async () => {
      const config: PluginConfig = {
        serverUrl: 'https://updates.example.com',
        channel: 'production',
        autoCheck: false,
      };

      // Configure plugin
      await plugin.configure({ config });

      // Get current version
      const currentVersion = await plugin.getCurrentVersion();
      expect(currentVersion).toBeDefined();
      expect(currentVersion.version).toBe('1.0.0'); // Web default

      // Check for updates (will fail without server)
      try {
        await plugin.checkForUpdate();
      } catch (error: any) {
        expect(error.message).toContain('Failed to fetch');
      }
    });

    it('should handle app review requests', async () => {
      const result = await plugin.requestReview();
      expect(result.displayed).toBe(false); // Web platform
    });

    it('should check native app updates', async () => {
      const result = await plugin.checkAppUpdate();
      expect(result.updateAvailable).toBe(false); // Web platform
      expect(result.platform).toBe('web');
    });
  });

  describe('Error Handling', () => {
    it('should validate configuration', async () => {
      const invalidConfig: PluginConfig = {
        serverUrl: 'http://insecure.com', // Should fail - not HTTPS
      };

      await expect(plugin.configure({ config: invalidConfig }))
        .rejects.toThrow('must use HTTPS');
    });

    it('should handle missing configuration', async () => {
      // Try to check for updates without configuration
      await expect(plugin.checkForUpdate())
        .rejects.toThrow();
    });
  });

  describe('Security', () => {
    it('should validate URLs are HTTPS', async () => {
      const { SecurityValidator } = await import('../core/security');
      
      expect(SecurityValidator.validateUrl('https://example.com')).toBe(true);
      expect(SecurityValidator.validateUrl('http://example.com')).toBe(false);
    });

    it('should validate checksums', async () => {
      const { SecurityValidator } = await import('../core/security');
      
      const validChecksum = 'a'.repeat(64);
      const invalidChecksum = 'invalid';
      
      expect(SecurityValidator.validateChecksum(validChecksum)).toBe(true);
      expect(SecurityValidator.validateChecksum(invalidChecksum)).toBe(false);
    });
  });

  describe('Version Management', () => {
    it('should compare versions correctly', async () => {
      const { VersionManager } = await import('../live-update/version-manager');
      
      expect(VersionManager.compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(VersionManager.compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(VersionManager.compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('should determine if update is needed', async () => {
      const { VersionManager } = await import('../live-update/version-manager');
      
      expect(VersionManager.shouldUpdate('1.0.0', '1.0.1')).toBe(true);
      expect(VersionManager.shouldUpdate('1.0.1', '1.0.0')).toBe(false);
    });
  });
});