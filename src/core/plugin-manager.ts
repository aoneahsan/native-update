import { ConfigManager, PluginConfig } from './config';
import { Logger } from './logger';
import { SecurityValidator } from './security';
import { BundleManager } from '../live-update/bundle-manager';
import { DownloadManager } from '../live-update/download-manager';
import { VersionManager } from '../live-update/version-manager';
import { CapacitorNativeUpdateError, ErrorCode } from './errors';

/**
 * Central manager for all plugin components
 */
export class PluginManager {
  private static instance: PluginManager;
  
  private readonly configManager: ConfigManager;
  private readonly logger: Logger;
  private readonly securityValidator: SecurityValidator;
  private bundleManager: BundleManager | null = null;
  private downloadManager: DownloadManager | null = null;
  private versionManager: VersionManager | null = null;
  private initialized = false;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
    this.securityValidator = SecurityValidator.getInstance();
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Initialize the plugin with configuration
   */
  async initialize(config: PluginConfig): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Plugin already initialized');
      return;
    }

    try {
      // Configure the plugin
      this.configManager.configure(config);

      // Validate required dependencies
      if (!config.filesystem || !config.preferences) {
        throw new CapacitorNativeUpdateError(
          ErrorCode.MISSING_DEPENDENCY,
          'Filesystem and Preferences are required for plugin initialization'
        );
      }

      // Initialize managers
      this.bundleManager = new BundleManager();
      await this.bundleManager.initialize();

      this.downloadManager = new DownloadManager();
      await this.downloadManager.initialize();

      this.versionManager = new VersionManager();
      await this.versionManager.initialize();

      this.initialized = true;
      this.logger.info('Plugin initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize plugin', error);
      throw error;
    }
  }

  /**
   * Check if plugin is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.configManager.isConfigured();
  }

  /**
   * Ensure plugin is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new CapacitorNativeUpdateError(
        ErrorCode.NOT_CONFIGURED,
        'Plugin not initialized. Please call initialize() first.'
      );
    }
  }

  /**
   * Get bundle manager
   */
  getBundleManager(): BundleManager {
    this.ensureInitialized();
    return this.bundleManager!;
  }

  /**
   * Get download manager
   */
  getDownloadManager(): DownloadManager {
    this.ensureInitialized();
    return this.downloadManager!;
  }

  /**
   * Get version manager
   */
  getVersionManager(): VersionManager {
    this.ensureInitialized();
    return this.versionManager!;
  }

  /**
   * Get configuration manager
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get security validator
   */
  getSecurityValidator(): SecurityValidator {
    return this.securityValidator;
  }

  /**
   * Reset plugin state
   */
  async reset(): Promise<void> {
    this.logger.info('Resetting plugin state');
    
    // Clear all data
    if (this.bundleManager) {
      await this.bundleManager.clearAllBundles();
    }
    
    if (this.versionManager) {
      await this.versionManager.clearVersionCache();
    }

    if (this.downloadManager) {
      this.downloadManager.cancelAllDownloads();
    }

    // Reset initialization state
    this.bundleManager = null;
    this.downloadManager = null;
    this.versionManager = null;
    this.initialized = false;

    this.logger.info('Plugin reset complete');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up plugin resources');
    
    // Cancel any active downloads
    if (this.downloadManager) {
      this.downloadManager.cancelAllDownloads();
    }

    // Clean expired bundles
    if (this.bundleManager) {
      await this.bundleManager.cleanExpiredBundles();
    }

    this.logger.info('Cleanup complete');
  }
}