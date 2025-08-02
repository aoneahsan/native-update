import { ConfigManager } from './config';
import { Logger } from './logger';
import type { Filesystem } from '@capacitor/filesystem';
import { Directory, Encoding } from '@capacitor/filesystem';
import type { BundleInfo } from '../definitions';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Manages caching with expiration for various data types
 */
export class CacheManager {
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private filesystem: typeof Filesystem | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly CACHE_DIR = 'cache';

  constructor() {
    this.logger = Logger.getInstance();
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Initialize cache manager
   */
  async initialize(): Promise<void> {
    this.filesystem = this.configManager.get('filesystem');
    if (!this.filesystem) {
      throw new Error('Filesystem not configured');
    }

    // Create cache directory if it doesn't exist
    try {
      await this.filesystem.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      this.logger.debug('Cache directory may already exist', error);
    }

    // Clean expired cache on initialization
    await this.cleanExpiredCache();
  }

  /**
   * Set cache entry with expiration
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const expiry = Date.now() + (ttlMs || this.configManager.get('cacheExpiration'));
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry,
    };

    // Update memory cache
    this.memoryCache.set(key, entry);

    // Persist to filesystem for larger data
    if (this.shouldPersist(data)) {
      await this.persistToFile(key, entry);
    }

    this.logger.debug('Cache entry set', { key, expiry: new Date(expiry) });
  }

  /**
   * Get cache entry
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiry) {
        return memEntry.data as T;
      } else {
        // Expired - remove from memory
        this.memoryCache.delete(key);
      }
    }

    // Check filesystem cache
    const fileEntry = await this.loadFromFile<T>(key);
    if (fileEntry) {
      if (Date.now() < fileEntry.expiry) {
        // Update memory cache
        this.memoryCache.set(key, fileEntry);
        return fileEntry.data;
      } else {
        // Expired - remove file
        await this.removeFile(key);
      }
    }

    return null;
  }

  /**
   * Check if cache entry exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Remove cache entry
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.removeFile(key);
    this.logger.debug('Cache entry removed', { key });
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    // Remove cache directory
    try {
      await this.filesystem!.rmdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true,
      });
      
      // Recreate empty cache directory
      await this.filesystem!.mkdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
        recursive: true,
      });
    } catch (error) {
      this.logger.warn('Failed to clear cache directory', error);
    }

    this.logger.info('Cache cleared');
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache) {
      if (now >= entry.expiry) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean filesystem cache
    try {
      const files = await this.filesystem!.readdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
      });

      for (const file of files.files) {
        const key = file.name.replace('.json', '');
        const entry = await this.loadFromFile(key);
        
        if (!entry || now >= entry.expiry) {
          await this.removeFile(key);
          cleanedCount++;
        }
      }
    } catch (error) {
      this.logger.debug('Failed to clean filesystem cache', error);
    }

    if (cleanedCount > 0) {
      this.logger.info('Cleaned expired cache entries', { count: cleanedCount });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    fileEntries: number;
    totalSize: number;
  }> {
    let fileEntries = 0;
    let totalSize = 0;

    try {
      const files = await this.filesystem!.readdir({
        path: this.CACHE_DIR,
        directory: Directory.Data,
      });
      fileEntries = files.files.length;

      // Estimate size (this is approximate)
      for (const file of files.files) {
        const stat = await this.filesystem!.stat({
          path: `${this.CACHE_DIR}/${file.name}`,
          directory: Directory.Data,
        });
        totalSize += stat.size || 0;
      }
    } catch (error) {
      this.logger.debug('Failed to get cache stats', error);
    }

    return {
      memoryEntries: this.memoryCache.size,
      fileEntries,
      totalSize,
    };
  }

  /**
   * Cache bundle metadata
   */
  async cacheBundleMetadata(bundle: BundleInfo): Promise<void> {
    const key = `bundle_meta_${bundle.bundleId}`;
    await this.set(key, bundle, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get cached bundle metadata
   */
  async getCachedBundleMetadata(bundleId: string): Promise<BundleInfo | null> {
    const key = `bundle_meta_${bundleId}`;
    return this.get<BundleInfo>(key);
  }

  /**
   * Check if data should be persisted to filesystem
   */
  private shouldPersist(data: unknown): boolean {
    // Persist objects and large strings
    if (typeof data === 'object') return true;
    if (typeof data === 'string' && data.length > 1024) return true;
    return false;
  }

  /**
   * Persist cache entry to file
   */
  private async persistToFile<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.filesystem) return;

    try {
      const path = `${this.CACHE_DIR}/${key}.json`;
      const data = JSON.stringify(entry);
      
      await this.filesystem.writeFile({
        path,
        data,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      this.logger.warn('Failed to persist cache to file', { key, error });
    }
  }

  /**
   * Load cache entry from file
   */
  private async loadFromFile<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.filesystem) return null;

    try {
      const path = `${this.CACHE_DIR}/${key}.json`;
      const result = await this.filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      return JSON.parse(result.data as string) as CacheEntry<T>;
    } catch {
      // File doesn't exist or is corrupted
      return null;
    }
  }

  /**
   * Remove cache file
   */
  private async removeFile(key: string): Promise<void> {
    if (!this.filesystem) return;

    try {
      const path = `${this.CACHE_DIR}/${key}.json`;
      await this.filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    } catch (error) {
      // File may not exist
      this.logger.debug('Failed to remove cache file', { key, error });
    }
  }
}