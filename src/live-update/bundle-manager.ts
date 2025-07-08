import type { BundleInfo, BundleStatus } from '../definitions';

/**
 * Manages bundle storage and lifecycle
 */
export class BundleManager {
  private static readonly STORAGE_KEY = 'capacitor_native_update_bundles';
  private static readonly ACTIVE_BUNDLE_KEY = 'capacitor_native_update_active';

  /**
   * Save bundle information
   */
  static saveBundleInfo(bundle: BundleInfo): void {
    const bundles = this.getAllBundles();
    const index = bundles.findIndex(b => b.bundleId === bundle.bundleId);
    
    if (index >= 0) {
      bundles[index] = bundle;
    } else {
      bundles.push(bundle);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bundles));
  }

  /**
   * Get all bundles
   */
  static getAllBundles(): BundleInfo[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get bundle by ID
   */
  static getBundle(bundleId: string): BundleInfo | null {
    const bundles = this.getAllBundles();
    return bundles.find(b => b.bundleId === bundleId) || null;
  }

  /**
   * Delete bundle
   */
  static deleteBundle(bundleId: string): void {
    const bundles = this.getAllBundles();
    const filtered = bundles.filter(b => b.bundleId !== bundleId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    
    // If this was the active bundle, clear it
    if (this.getActiveBundleId() === bundleId) {
      this.clearActiveBundle();
    }
  }

  /**
   * Get active bundle
   */
  static getActiveBundle(): BundleInfo | null {
    const activeBundleId = this.getActiveBundleId();
    if (!activeBundleId) return null;
    
    return this.getBundle(activeBundleId);
  }

  /**
   * Set active bundle
   */
  static setActiveBundle(bundleId: string): void {
    const bundle = this.getBundle(bundleId);
    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }
    
    // Update previous active bundle status
    const previousActive = this.getActiveBundle();
    if (previousActive) {
      previousActive.status = 'READY' as BundleStatus;
      this.saveBundleInfo(previousActive);
    }
    
    // Set new active bundle
    bundle.status = 'ACTIVE' as BundleStatus;
    this.saveBundleInfo(bundle);
    
    localStorage.setItem(this.ACTIVE_BUNDLE_KEY, bundleId);
  }

  /**
   * Get active bundle ID
   */
  static getActiveBundleId(): string | null {
    return localStorage.getItem(this.ACTIVE_BUNDLE_KEY);
  }

  /**
   * Clear active bundle
   */
  static clearActiveBundle(): void {
    localStorage.removeItem(this.ACTIVE_BUNDLE_KEY);
  }

  /**
   * Clear all bundles
   */
  static clearAllBundles(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACTIVE_BUNDLE_KEY);
  }

  /**
   * Clean up old bundles
   */
  static cleanupOldBundles(keepCount: number): void {
    const bundles = this.getAllBundles();
    const activeBundleId = this.getActiveBundleId();
    
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
    for (const bundle of bundles) {
      if (!toKeep.has(bundle.bundleId)) {
        this.deleteBundle(bundle.bundleId);
      }
    }
  }

  /**
   * Get bundles older than specified time
   */
  static getBundlesOlderThan(timestamp: number): BundleInfo[] {
    const bundles = this.getAllBundles();
    return bundles.filter(b => b.downloadTime < timestamp);
  }

  /**
   * Mark bundle as verified
   */
  static markBundleAsVerified(bundleId: string): void {
    const bundle = this.getBundle(bundleId);
    if (bundle) {
      bundle.verified = true;
      this.saveBundleInfo(bundle);
    }
  }

  /**
   * Get total storage used by bundles
   */
  static getTotalStorageUsed(): number {
    const bundles = this.getAllBundles();
    return bundles.reduce((total, bundle) => total + bundle.size, 0);
  }

  /**
   * Create default bundle
   */
  static createDefaultBundle(): BundleInfo {
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
}