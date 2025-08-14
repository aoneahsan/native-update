import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BundleManager } from '../live-update/bundle-manager';
import type { BundleInfo, BundleStatus } from '../definitions';

// Mock dependencies
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    deleteFile: vi.fn(),
    mkdir: vi.fn(),
    rmdir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
  Directory: {
    Data: 'DATA',
    Cache: 'CACHE',
  },
  Encoding: {
    UTF8: 'utf8',
  },
}));

describe('BundleManager', () => {
  let bundleManager: BundleManager;

  beforeEach(async () => {
    bundleManager = new BundleManager();
    vi.clearAllMocks();
    // Mock preferences
    const mockPreferences = {
      get: vi.fn().mockResolvedValue({ value: null }),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue({ keys: [] }),
    };
    
    // Initialize bundle manager with mocked preferences
    const { ConfigManager } = await import('../core/config');
    ConfigManager.getInstance().set('preferences', mockPreferences as any);
    await bundleManager.initialize();
  });

  describe('validateBundleInfo', () => {
    it('should validate bundle with correct info', async () => {
      const bundle: BundleInfo = {
        bundleId: 'bundle-1.0.0',
        version: '1.0.0',
        path: '/bundles/bundle-1.0.0',
        downloadTime: Date.now(),
        size: 1024,
        status: 'ready' as BundleStatus,
        checksum: 'a'.repeat(64),
        signature: 'signature',
        verified: true,
      };

      await bundleManager.saveBundleInfo(bundle);
      const savedBundle = await bundleManager.getBundle('bundle-1.0.0');
      expect(savedBundle).toBeDefined();
      expect(savedBundle?.version).toBe('1.0.0');
    });

    it('should reject bundle with invalid info', async () => {
      const bundle = {
        // Missing required fields
        version: '1.0.0',
        size: 1024,
      } as any;

      await expect(bundleManager.saveBundleInfo(bundle)).rejects.toThrow();
    });
  });

  describe('cleanupOldBundles', () => {
    it('should keep only specified number of bundles', async () => {
      const mockBundles = [
        { path: 'bundle-1.0.0', modificationTime: new Date('2024-01-01').getTime() },
        { path: 'bundle-1.0.1', modificationTime: new Date('2024-01-02').getTime() },
        { path: 'bundle-1.0.2', modificationTime: new Date('2024-01-03').getTime() },
        { path: 'bundle-1.0.3', modificationTime: new Date('2024-01-04').getTime() },
      ];

      const { Filesystem } = await import('@capacitor/filesystem');
      vi.mocked(Filesystem.readdir).mockResolvedValue({
        files: mockBundles.map(b => ({
          name: b.path,
          type: 'directory',
          size: 1024,
          uri: b.path,
          ctime: b.modificationTime,
          mtime: b.modificationTime,
        })),
      });

      await bundleManager['cleanupOldBundles'](2);

      // Should delete the 2 oldest bundles
      expect(Filesystem.rmdir).toHaveBeenCalledTimes(2);
    });
  });

  describe('getBundle', () => {
    it('should retrieve saved bundle', async () => {
      const bundle: BundleInfo = {
        bundleId: 'bundle-1.2.3',
        version: '1.2.3',
        path: '/bundles/bundle-1.2.3',
        downloadTime: Date.now(),
        size: 2048,
        status: 'ready' as BundleStatus,
        checksum: 'b'.repeat(64),
        signature: 'sig',
        verified: true,
      };
      
      await bundleManager.saveBundleInfo(bundle);
      const retrieved = await bundleManager.getBundle('bundle-1.2.3');
      expect(retrieved).toBeDefined();
      expect(retrieved?.path).toBe('/bundles/bundle-1.2.3');
    });
  });
});