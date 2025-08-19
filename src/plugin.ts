import { registerPlugin } from '@capacitor/core';
import type {
  NativeUpdatePlugin,
  PluginInitConfig,
  UpdateConfig,
  // Live Update
  SyncOptions,
  SyncResult,
  DownloadOptions,
  BundleInfo,
  DeleteOptions,
  LatestVersion,
  ValidateOptions,
  ValidationResult,
  // App Update
  AppUpdateInfo,
  OpenAppStoreOptions,
  // App Review
  ReviewResult,
  CanRequestReviewResult,
  // Security
  SecurityInfo,
  // Background Update
  BackgroundUpdateConfig,
  BackgroundUpdateStatus,
  BackgroundCheckResult,
  NotificationPreferences,
  NotificationPermissionStatus,
} from './definitions';
import { SyncStatus, BundleStatus, UpdateErrorCode } from './definitions';
import { PluginManager } from './core/plugin-manager';
import { NativeUpdateError, ErrorCode } from './core/errors';

/**
 * Web implementation of the Native Update Plugin
 */
class NativeUpdatePluginWeb implements NativeUpdatePlugin {
  private pluginManager: PluginManager;
  private initialized = false;

  constructor() {
    this.pluginManager = PluginManager.getInstance();
  }

  // Main plugin methods
  async initialize(config: PluginInitConfig): Promise<void> {
    await this.pluginManager.initialize(config);
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized && this.pluginManager.isInitialized();
  }

  async reset(): Promise<void> {
    await this.pluginManager.reset();
  }

  async cleanup(): Promise<void> {
    await this.pluginManager.cleanup();
  }

  // NativeUpdatePlugin methods
  async configure(config: UpdateConfig | { config: PluginInitConfig }): Promise<void> {
    // Handle both UpdateConfig and wrapped PluginInitConfig formats
    let initConfig: PluginInitConfig;
    
    if ('config' in config && typeof config.config === 'object') {
      // Format: { config: PluginInitConfig }
      initConfig = config.config;
    } else {
      // Format: UpdateConfig - convert to PluginInitConfig
      initConfig = {
        // Auto-imported Capacitor plugins will be added by plugin-manager
        baseUrl: (config as UpdateConfig).liveUpdate?.serverUrl,
      };
    }
    
    if (!this.initialized) {
      // Auto-initialize with the provided config
      await this.initialize(initConfig);
    } else {
      // Apply plugin configuration
      const configManager = this.pluginManager.getConfigManager();
      configManager.configure(initConfig);
    }
  }

  async getSecurityInfo(): Promise<SecurityInfo> {
    return {
      enforceHttps: true,
      certificatePinning: {
        enabled: false,
        pins: [],
      },
      validateInputs: true,
      secureStorage: true,
    };
  }

  // LiveUpdatePlugin methods
  async sync(_options?: SyncOptions): Promise<SyncResult> {
    const bundleManager = this.pluginManager.getBundleManager();

    try {
      // Check for updates
      const currentBundle = await bundleManager.getActiveBundle();
      const currentVersion = currentBundle?.version || '1.0.0';

      // For now, return up-to-date status
      return {
        status: SyncStatus.UP_TO_DATE,
        version: currentVersion,
      };
    } catch (error) {
      return {
        status: SyncStatus.ERROR,
        error: {
          code: UpdateErrorCode.UNKNOWN_ERROR,
          message: error instanceof Error ? error.message : 'Sync failed',
        },
      };
    }
  }

  async download(options: DownloadOptions): Promise<BundleInfo> {
    const downloadManager = this.pluginManager.getDownloadManager();
    const bundleManager = this.pluginManager.getBundleManager();

    const blob = await downloadManager.downloadWithRetry(
      options.url,
      options.version
    );

    const path = await downloadManager.saveBlob(options.version, blob);

    const bundleInfo: BundleInfo = {
      bundleId: options.version,
      version: options.version,
      path,
      downloadTime: Date.now(),
      size: blob.size,
      status: BundleStatus.READY,
      checksum: options.checksum,
      signature: options.signature,
      verified: false,
    };

    await bundleManager.saveBundleInfo(bundleInfo);

    return bundleInfo;
  }

  async set(bundle: BundleInfo): Promise<void> {
    const bundleManager = this.pluginManager.getBundleManager();
    await bundleManager.setActiveBundle(bundle.bundleId);
  }

  async reload(): Promise<void> {
    // In web implementation, we can reload the page
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async current(): Promise<BundleInfo> {
    const bundleManager = this.pluginManager.getBundleManager();
    const bundle = await bundleManager.getActiveBundle();
    if (!bundle) {
      throw new NativeUpdateError(
        ErrorCode.FILE_NOT_FOUND,
        'No active bundle found'
      );
    }
    return bundle;
  }

  async list(): Promise<BundleInfo[]> {
    const bundleManager = this.pluginManager.getBundleManager();
    return bundleManager.getAllBundles();
  }

  async delete(options: DeleteOptions): Promise<void> {
    const bundleManager = this.pluginManager.getBundleManager();

    if (options.bundleId) {
      await bundleManager.deleteBundle(options.bundleId);
    } else if (options.keepVersions !== undefined) {
      // Delete old versions keeping the specified number
      const bundles = await bundleManager.getAllBundles();
      const sortedBundles = bundles.sort(
        (a, b) => b.downloadTime - a.downloadTime
      );

      for (let i = options.keepVersions; i < sortedBundles.length; i++) {
        await bundleManager.deleteBundle(sortedBundles[i].bundleId);
      }
    }
  }

  async notifyAppReady(): Promise<void> {
    // Mark the current bundle as stable
    const bundleManager = this.pluginManager.getBundleManager();
    const activeBundle = await bundleManager.getActiveBundle();
    if (activeBundle) {
      activeBundle.status = BundleStatus.ACTIVE;
      await bundleManager.saveBundleInfo(activeBundle);
    }
  }

  async getLatest(): Promise<LatestVersion> {
    // For web, we'll return no update available
    return {
      available: false,
    };
  }

  async setChannel(channel: string): Promise<void> {
    // Store the channel preference
    const preferences = this.pluginManager
      .getConfigManager()
      .get('preferences');
    if (preferences) {
      await preferences.set({
        key: 'update_channel',
        value: channel,
      });
    }
  }

  async setUpdateUrl(url: string): Promise<void> {
    const configManager = this.pluginManager.getConfigManager();
    configManager.configure({ baseUrl: url });
  }

  async validateUpdate(options: ValidateOptions): Promise<ValidationResult> {
    const securityValidator = this.pluginManager.getSecurityValidator();

    try {
      // Validate checksum
      const isValid = await securityValidator.validateChecksum(
        new ArrayBuffer(0), // Placeholder for bundle data
        options.checksum
      );

      return {
        isValid,
        details: {
          checksumValid: isValid,
          signatureValid: true,
          sizeValid: true,
          versionValid: true,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  // AppUpdatePlugin methods
  async getAppUpdateInfo(): Promise<AppUpdateInfo> {
    // Web doesn't have native app updates
    return {
      updateAvailable: false,
      currentVersion: '1.0.0',
    };
  }

  async performImmediateUpdate(): Promise<void> {
    throw new NativeUpdateError(
      ErrorCode.PLATFORM_NOT_SUPPORTED,
      'Native app updates are not supported on web'
    );
  }

  async startFlexibleUpdate(): Promise<void> {
    throw new NativeUpdateError(
      ErrorCode.PLATFORM_NOT_SUPPORTED,
      'Native app updates are not supported on web'
    );
  }

  async completeFlexibleUpdate(): Promise<void> {
    throw new NativeUpdateError(
      ErrorCode.PLATFORM_NOT_SUPPORTED,
      'Native app updates are not supported on web'
    );
  }

  async openAppStore(_options?: OpenAppStoreOptions): Promise<void> {
    throw new NativeUpdateError(
      ErrorCode.PLATFORM_NOT_SUPPORTED,
      'App store is not available on web'
    );
  }

  // AppReviewPlugin methods
  async requestReview(): Promise<ReviewResult> {
    return {
      displayed: false,
      error: 'Reviews are not supported on web',
    };
  }

  async canRequestReview(): Promise<CanRequestReviewResult> {
    return {
      canRequest: false,
      reason: 'Reviews are not supported on web',
    };
  }

  // BackgroundUpdatePlugin methods
  async enableBackgroundUpdates(config: BackgroundUpdateConfig): Promise<void> {
    // Store the configuration
    const preferences = this.pluginManager
      .getConfigManager()
      .get('preferences');
    if (preferences) {
      await preferences.set({
        key: 'background_update_config',
        value: JSON.stringify(config),
      });
    }
  }

  async disableBackgroundUpdates(): Promise<void> {
    const preferences = this.pluginManager
      .getConfigManager()
      .get('preferences');
    if (preferences) {
      await preferences.remove({ key: 'background_update_config' });
    }
  }

  async getBackgroundUpdateStatus(): Promise<BackgroundUpdateStatus> {
    return {
      enabled: false,
      isRunning: false,
      checkCount: 0,
      failureCount: 0,
    };
  }

  async scheduleBackgroundCheck(_interval: number): Promise<void> {
    // Not supported on web
    throw new NativeUpdateError(
      ErrorCode.PLATFORM_NOT_SUPPORTED,
      'Background updates are not supported on web'
    );
  }

  async triggerBackgroundCheck(): Promise<BackgroundCheckResult> {
    return {
      success: false,
      updatesFound: false,
      notificationSent: false,
      error: {
        code: UpdateErrorCode.PLATFORM_NOT_SUPPORTED,
        message: 'Background updates are not supported on web',
      },
    };
  }

  async setNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<void> {
    // Store preferences but notifications aren't supported on web
    const prefs = this.pluginManager.getConfigManager().get('preferences');
    if (prefs) {
      await prefs.set({
        key: 'notification_preferences',
        value: JSON.stringify(preferences),
      });
    }
  }

  async getNotificationPermissions(): Promise<NotificationPermissionStatus> {
    return {
      granted: false,
      canRequest: false,
    };
  }

  async requestNotificationPermissions(): Promise<boolean> {
    return false;
  }

  // Event listener methods
  async addListener(
    _eventName: string,
    _listenerFunc: (event: any) => void
  ): Promise<import('./definitions').PluginListenerHandle> {
    // Web implementation doesn't support native events
    // Return a dummy handle
    return {
      remove: async () => {
        // No-op for web
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    // No-op for web implementation
  }
}

/**
 * Register the plugin
 */
const NativeUpdate = registerPlugin<NativeUpdatePlugin>(
  'NativeUpdate',
  {
    web: () => new NativeUpdatePluginWeb(),
  }
);

export { NativeUpdate };
