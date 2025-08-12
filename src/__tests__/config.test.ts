import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../core/config';
import type { PluginConfig } from '../definitions';

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
        serverUrl: 'https://updates.example.com',
        channel: 'production',
        autoCheck: true,
        checkInterval: 3600,
        publicKey: 'test-public-key',
      };

      configManager.configure(config);
      
      expect(configManager.get('serverUrl')).toBe('https://updates.example.com');
      expect(configManager.get('channel')).toBe('production');
      expect(configManager.get('autoCheck')).toBe(true);
    });

    it('should merge partial configurations', () => {
      const initialConfig: PluginConfig = {
        serverUrl: 'https://updates.example.com',
        channel: 'production',
      };

      const updateConfig: Partial<PluginConfig> = {
        channel: 'staging',
        autoCheck: false,
      };

      configManager.configure(initialConfig);
      configManager.configure(updateConfig);

      expect(configManager.get('serverUrl')).toBe('https://updates.example.com');
      expect(configManager.get('channel')).toBe('staging');
      expect(configManager.get('autoCheck')).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate server URL is HTTPS', () => {
      const config: PluginConfig = {
        serverUrl: 'http://updates.example.com', // HTTP should fail
      };

      expect(() => configManager.configure(config)).toThrow();
    });

    it('should validate check interval', () => {
      const config: PluginConfig = {
        serverUrl: 'https://updates.example.com',
        checkInterval: -1, // Negative should fail
      };

      expect(() => configManager.configure(config)).toThrow();
    });
  });

  describe('getAll', () => {
    it('should return all configuration values', () => {
      const config: PluginConfig = {
        serverUrl: 'https://updates.example.com',
        channel: 'production',
        autoCheck: true,
      };

      configManager.configure(config);
      const allConfig = configManager.getAll();

      expect(allConfig).toMatchObject(config);
      expect(allConfig).toHaveProperty('serverUrl', 'https://updates.example.com');
      expect(allConfig).toHaveProperty('channel', 'production');
      expect(allConfig).toHaveProperty('autoCheck', true);
    });
  });
});