import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BundleManager } from '../live-update/bundle-manager';
import type { BundleInfo } from '../definitions';

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

  beforeEach(() => {
    bundleManager = new BundleManager();
    vi.clearAllMocks();
  });

  describe('validateBundle', () => {
    it('should validate bundle with correct checksum', async () => {
      const bundle: BundleInfo = {
        version: '1.0.0',
        checksum: 'a'.repeat(64),
        size: 1024,
        downloadUrl: 'https://example.com/bundle.zip',
        mandatory: false,
      };

      const mockData = new ArrayBuffer(1024);
      const isValid = await bundleManager['validateBundle'](bundle, mockData);
      expect(isValid).toBeDefined();
    });

    it('should reject bundle with invalid size', async () => {
      const bundle: BundleInfo = {
        version: '1.0.0',
        checksum: 'a'.repeat(64),
        size: 1024,
        downloadUrl: 'https://example.com/bundle.zip',
        mandatory: false,
      };

      const mockData = new ArrayBuffer(2048); // Wrong size
      const isValid = await bundleManager['validateBundle'](bundle, mockData);
      expect(isValid).toBe(false);
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

  describe('getBundlePath', () => {
    it('should generate correct bundle path', () => {
      const version = '1.2.3';
      const path = bundleManager['getBundlePath'](version);
      expect(path).toContain('bundle-1.2.3');
    });
  });
});