import type { BundleInfo, BundleStatus } from '../definitions';
import { ConfigManager } from '../core/config';
import { Logger } from '../core/logger';
import { StorageError, ErrorCode } from '../core/errors';
import type { Preferences } from '@capacitor/preferences';

/**
 * Manages bundle storage and lifecycle
 */
export class BundleManager {
  private readonly STORAGE_KEY = 'capacitor_native_update_bundles';
  private readonly ACTIVE_BUNDLE_KEY = 'capacitor_native_update_active';
  private preferences: typeof Preferences | null = null;
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private cache: Map<string, BundleInfo> = new Map();
  private cacheExpiry: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Initialize the bundle manager with preferences
   */
  async initialize(): Promise<void> {
    this.preferences = this.configManager.get('preferences');
    if (!this.preferences) {
      throw new StorageError(
        ErrorCode.MISSING_DEPENDENCY,
        'Preferences not configured. Please configure the plugin first.'
      );
    }
    await this.loadCache();
  }

  /**
   * Load cache from preferences
   */
  private async loadCache(): Promise<void> {
    if (Date.now() < this.cacheExpiry) {
      return; // Cache still valid
    }

    try {
      const { value } = await this.preferences!.get({ key: this.STORAGE_KEY });
      if (value) {
        const bundles: BundleInfo[] = JSON.parse(value);
        this.cache.clear();
        bundles.forEach((bundle) => this.cache.set(bundle.bundleId, bundle));
      }
      this.cacheExpiry = Date.now() + 5000; // 5 second cache
    } catch (error) {
      this.logger.error('Failed to load bundles from storage', error);
      this.cache.clear();
    }
  }

  /**
   * Save cache to preferences
   */
  private async saveCache(): Promise<void> {
    try {
      const bundles = Array.from(this.cache.values());
      await this.preferences!.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(bundles),
      });
      this.logger.debug('Saved bundles to storage', { count: bundles.length });
    } catch (error) {
      throw new StorageError(
        ErrorCode.STORAGE_FULL,
        'Failed to save bundles to storage',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Save bundle information
   */
  async saveBundleInfo(bundle: BundleInfo): Promise<void> {
    this.validateBundleInfo(bundle);
    this.cache.set(bundle.bundleId, bundle);
    await this.saveCache();
    this.logger.info('Bundle saved', {
      bundleId: bundle.bundleId,
      version: bundle.version,
    });
  }

  /**
   * Validate bundle information
   */
  private validateBundleInfo(bundle: BundleInfo): void {
    if (!bundle.bundleId || typeof bundle.bundleId !== 'string') {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Invalid bundle ID'
      );
    }
    if (!bundle.version || typeof bundle.version !== 'string') {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Invalid bundle version'
      );
    }
    if (!bundle.path || typeof bundle.path !== 'string') {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Invalid bundle path'
      );
    }
    if (typeof bundle.size !== 'number' || bundle.size < 0) {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Invalid bundle size'
      );
    }
  }

  /**
   * Get all bundles
   */
  async getAllBundles(): Promise<BundleInfo[]> {
    await this.loadCache();
    return Array.from(this.cache.values());
  }

  /**
   * Get bundle by ID
   */
  async getBundle(bundleId: string): Promise<BundleInfo | null> {
    if (!bundleId) {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID is required'
      );
    }
    await this.loadCache();
    return this.cache.get(bundleId) || null;
  }

  /**
   * Delete bundle
   */
  async deleteBundle(bundleId: string): Promise<void> {
    if (!bundleId) {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID is required'
      );
    }

    await this.loadCache();
    const bundle = this.cache.get(bundleId);
    if (!bundle) {
      this.logger.warn('Attempted to delete non-existent bundle', { bundleId });
      return;
    }

    this.cache.delete(bundleId);
    await this.saveCache();

    // If this was the active bundle, clear it
    const activeBundleId = await this.getActiveBundleId();
    if (activeBundleId === bundleId) {
      await this.clearActiveBundle();
    }

    this.logger.info('Bundle deleted', { bundleId });
  }

  /**
   * Get active bundle
   */
  async getActiveBundle(): Promise<BundleInfo | null> {
    const activeBundleId = await this.getActiveBundleId();
    if (!activeBundleId) return null;

    return this.getBundle(activeBundleId);
  }

  /**
   * Set active bundle
   */
  async setActiveBundle(bundleId: string): Promise<void> {
    if (!bundleId) {
      throw new StorageError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID is required'
      );
    }

    const bundle = await this.getBundle(bundleId);
    if (!bundle) {
      throw new StorageError(
        ErrorCode.FILE_NOT_FOUND,
        `Bundle ${bundleId} not found`
      );
    }

    // Update previous active bundle status
    const previousActive = await this.getActiveBundle();
    if (previousActive && previousActive.bundleId !== bundleId) {
      previousActive.status = 'READY' as BundleStatus;
      await this.saveBundleInfo(previousActive);
    }

    // Set new active bundle
    bundle.status = 'ACTIVE' as BundleStatus;
    await this.saveBundleInfo(bundle);

    await this.preferences!.set({
      key: this.ACTIVE_BUNDLE_KEY,
      value: bundleId,
    });

    this.logger.info('Active bundle set', {
      bundleId,
      version: bundle.version,
    });
  }

  /**
   * Get active bundle ID
   */
  async getActiveBundleId(): Promise<string | null> {
    try {
      const { value } = await this.preferences!.get({
        key: this.ACTIVE_BUNDLE_KEY,
      });
      return value;
    } catch (error) {
      this.logger.error('Failed to get active bundle ID', error);
      return null;
    }
  }

  /**
   * Clear active bundle
   */
  async clearActiveBundle(): Promise<void> {
    await this.preferences!.remove({ key: this.ACTIVE_BUNDLE_KEY });
    this.logger.info('Active bundle cleared');
  }

  /**
   * Clear all bundles
   */
  async clearAllBundles(): Promise<void> {
    await this.preferences!.remove({ key: this.STORAGE_KEY });
    await this.preferences!.remove({ key: this.ACTIVE_BUNDLE_KEY });
    this.cache.clear();
    this.cacheExpiry = 0;
    this.logger.info('All bundles cleared');
  }

  /**
   * Clean up old bundles
   */
  async cleanupOldBundles(keepCount: number): Promise<void> {
    if (keepCount < 1) {
      throw new StorageError(
        ErrorCode.INVALID_CONFIG,
        'Keep count must be at least 1'
      );
    }

    const bundles = await this.getAllBundles();
    const activeBundleId = await this.getActiveBundleId();

    // Sort by download time (newest first)
    const sorted = bundles.sort((a, b) => b.downloadTime - a.downloadTime);

    // Keep the active bundle and the most recent ones
    const toKeep = new Set<string>();
    if (activeBundleId) {
      toKeep.add(activeBundleId);
    }

    let kept = toKeep.size;
    for (const bundle of sorted) {
      if (kept >= keepCount) break;
      if (!toKeep.has(bundle.bundleId)) {
        toKeep.add(bundle.bundleId);
        kept++;
      }
    }

    // Delete bundles not in the keep set
    let deletedCount = 0;
    for (const bundle of bundles) {
      if (!toKeep.has(bundle.bundleId)) {
        await this.deleteBundle(bundle.bundleId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.info('Cleaned up old bundles', {
        deleted: deletedCount,
        kept,
      });
    }
  }

  /**
   * Get bundles older than specified time
   */
  async getBundlesOlderThan(timestamp: number): Promise<BundleInfo[]> {
    if (timestamp < 0) {
      throw new StorageError(
        ErrorCode.INVALID_CONFIG,
        'Timestamp must be non-negative'
      );
    }
    const bundles = await this.getAllBundles();
    return bundles.filter((b) => b.downloadTime < timestamp);
  }

  /**
   * Mark bundle as verified
   */
  async markBundleAsVerified(bundleId: string): Promise<void> {
    const bundle = await this.getBundle(bundleId);
    if (!bundle) {
      throw new StorageError(
        ErrorCode.FILE_NOT_FOUND,
        `Bundle ${bundleId} not found`
      );
    }
    bundle.verified = true;
    await this.saveBundleInfo(bundle);
    this.logger.info('Bundle marked as verified', { bundleId });
  }

  /**
   * Get total storage used by bundles
   */
  async getTotalStorageUsed(): Promise<number> {
    const bundles = await this.getAllBundles();
    return bundles.reduce((total, bundle) => total + bundle.size, 0);
  }

  /**
   * Check if storage limit is exceeded
   */
  async isStorageLimitExceeded(additionalSize: number = 0): Promise<boolean> {
    const totalUsed = await this.getTotalStorageUsed();
    const maxStorage = this.configManager.get('maxBundleSize') * 3; // Allow 3x max bundle size
    return totalUsed + additionalSize > maxStorage;
  }

  /**
   * Create default bundle
   */
  createDefaultBundle(): BundleInfo {
    return {
      bundleId: 'default',
      version: '1.0.0',
      path: '/',
      downloadTime: Date.now(),
      size: 0,
      status: 'ACTIVE' as BundleStatus,
      checksum: '',
      verified: true,
    };
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredBundles(): Promise<void> {
    const expirationTime = this.configManager.get('cacheExpiration');
    const cutoffTime = Date.now() - expirationTime;
    const expiredBundles = await this.getBundlesOlderThan(cutoffTime);

    for (const bundle of expiredBundles) {
      // Don't delete active bundle
      const activeBundleId = await this.getActiveBundleId();
      if (bundle.bundleId !== activeBundleId) {
        await this.deleteBundle(bundle.bundleId);
      }
    }
  }
}
