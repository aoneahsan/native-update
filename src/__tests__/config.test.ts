import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../core/config';
import type { PluginConfig } from '../core/config';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    // Reset singleton
    ConfigManager['instance'] = undefined as any;
    configManager = ConfigManager.getInstance();
  });

  describe('configure', () => {
    it('should store and retrieve configuration', () => {
      const config: PluginConfig = {
        baseUrl: 'https://updates.example.com',
        publicKey: 'test-public-key',
        enableLogging: true,
      };

      configManager.configure(config);

      expect(configManager.get('baseUrl')).toBe('https://updates.example.com');
      expect(configManager.get('publicKey')).toBe('test-public-key');
      expect(configManager.get('enableLogging')).toBe(true);
    });

    it('should merge partial configurations', () => {
      const initialConfig: PluginConfig = {
        baseUrl: 'https://updates.example.com',
        retryAttempts: 3,
      };

      const updateConfig: Partial<PluginConfig> = {
        retryAttempts: 5,
        enableLogging: false,
      };

      configManager.configure(initialConfig);
      configManager.configure(updateConfig);

      expect(configManager.get('baseUrl')).toBe('https://updates.example.com');
      expect(configManager.get('retryAttempts')).toBe(5);
      expect(configManager.get('enableLogging')).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate base URL is HTTPS', () => {
      const config: PluginConfig = {
        baseUrl: 'http://updates.example.com', // HTTP should fail
      };

      expect(() => configManager.configure(config)).toThrow();
    });

    it('should validate retry attempts', () => {
      const config: PluginConfig = {
        baseUrl: 'https://updates.example.com',
        retryAttempts: -1, // Negative should fail
      };

      expect(() => configManager.configure(config)).toThrow();
    });
  });

  describe('getAll', () => {
    it('should return all configuration values', () => {
      const config: PluginConfig = {
        baseUrl: 'https://updates.example.com',
        retryAttempts: 3,
        enableLogging: true,
      };

      configManager.configure(config);
      const allConfig = configManager.getAll();

      expect(allConfig).toMatchObject(config);
      expect(allConfig).toHaveProperty(
        'baseUrl',
        'https://updates.example.com'
      );
      expect(allConfig).toHaveProperty('retryAttempts', 3);
      expect(allConfig).toHaveProperty('enableLogging', true);
    });
  });
});
