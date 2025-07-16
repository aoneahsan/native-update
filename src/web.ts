import { WebPlugin } from '@capacitor/core';

import type {
  NativeUpdateCombinedPlugin,
  UpdateConfig,
  SecurityInfo,
  SyncOptions,
  SyncResult,
  DownloadOptions,
  BundleInfo,
  DeleteOptions,
  LatestVersion,
  ValidateOptions,
  ValidationResult,
  AppUpdateInfo,
  OpenAppStoreOptions,
  ReviewResult,
  CanRequestReviewResult,
  UpdateError,
  BackgroundUpdateConfig,
  BackgroundUpdateStatus,
  BackgroundCheckResult,
  NotificationPreferences,
  NotificationPermissionStatus,
} from './definitions';

import {
  SyncStatus,
  BundleStatus,
  UpdateErrorCode,
} from './definitions';

export class NativeUpdateWeb
  extends WebPlugin
  implements NativeUpdateCombinedPlugin
{
  private config: UpdateConfig = {};
  private currentBundle: BundleInfo | null = null;
  private bundles: Map<string, BundleInfo> = new Map();
  private lastReviewRequest: number = 0;
  private launchCount: number = 0;
  private backgroundUpdateStatus: BackgroundUpdateStatus = {
    enabled: false,
    isRunning: false,
    checkCount: 0,
    failureCount: 0,
  };
  private backgroundCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.loadStoredData();
    this.incrementLaunchCount();
  }

  /**
   * Configuration and Core Methods
   */
  async configure(options: UpdateConfig): Promise<void> {
    // Validate configuration
    if (options.liveUpdate?.serverUrl && !options.liveUpdate.serverUrl.startsWith('https://')) {
      if (options.security?.enforceHttps !== false) {
        throw this.createError(UpdateErrorCode.INSECURE_URL, 'Server URL must use HTTPS');
      }
    }

    this.config = { ...this.config, ...options };
    this.saveConfiguration();
    console.log('CapacitorNativeUpdate configured:', this.config);
  }

  async getSecurityInfo(): Promise<SecurityInfo> {
    return {
      enforceHttps: this.config.security?.enforceHttps !== false,
      certificatePinning: {
        enabled: this.config.security?.certificatePinning?.enabled || false,
        certificates: this.config.security?.certificatePinning?.certificates || [],
      },
      validateInputs: this.config.security?.validateInputs !== false,
      secureStorage: this.config.security?.secureStorage !== false,
    };
  }

  /**
   * Live Update Methods
   */
  async sync(options?: SyncOptions): Promise<SyncResult> {
    console.log('Web: Checking for updates...', options);

    try {
      // In web, we can check for service worker updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          if (registration.waiting) {
            // There's an update waiting
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            return {
              status: SyncStatus.UPDATE_AVAILABLE,
              version: 'web-update',
              description: 'Service worker update available',
            };
          }
        }
      }

      return {
        status: SyncStatus.UP_TO_DATE,
        version: this.currentBundle?.version || '1.0.0',
      };
    } catch (error) {
      return {
        status: SyncStatus.ERROR,
        error: this.createError(UpdateErrorCode.UNKNOWN_ERROR, (error as Error).message),
      };
    }
  }

  async download(options: DownloadOptions): Promise<BundleInfo> {
    // Validate URL
    if (!options.url.startsWith('https://') && this.config.security?.enforceHttps !== false) {
      throw this.createError(UpdateErrorCode.INSECURE_URL, 'Download URL must use HTTPS');
    }

    const bundleId = `bundle-${Date.now()}`;
    const bundle: BundleInfo = {
      bundleId,
      version: options.version,
      path: options.url,
      downloadTime: Date.now(),
      size: 0, // Would be calculated during actual download
      status: BundleStatus.DOWNLOADING,
      checksum: options.checksum,
      signature: options.signature,
      verified: false,
    };

    this.bundles.set(bundleId, bundle);

    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await this.notifyListeners('downloadProgress', {
        percent: i,
        bytesDownloaded: (i * 1000),
        totalBytes: 10000,
        bundleId,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update bundle status
    bundle.status = BundleStatus.READY;
    bundle.verified = true; // In real implementation, would verify checksum/signature
    
    this.saveStoredData();
    
    await this.notifyListeners('updateStateChanged', {
      status: bundle.status,
      bundleId: bundle.bundleId,
      version: bundle.version,
    });

    return bundle;
  }

  async set(bundle: BundleInfo): Promise<void> {
    if (!this.bundles.has(bundle.bundleId)) {
      throw this.createError(UpdateErrorCode.UNKNOWN_ERROR, 'Bundle not found');
    }

    const previousBundle = this.currentBundle;
    this.currentBundle = bundle;
    this.currentBundle.status = BundleStatus.ACTIVE;

    // Update previous bundle status
    if (previousBundle) {
      previousBundle.status = BundleStatus.READY;
    }

    this.saveStoredData();
  }

  async reload(): Promise<void> {
    console.log('Web: Reloading application...');
    
    // In web, we can reload the page
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  async reset(): Promise<void> {
    console.log('Web: Resetting to original bundle...');
    
    this.currentBundle = null;
    this.bundles.clear();
    this.saveStoredData();
    
    // Clear service worker cache if available
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }

  async current(): Promise<BundleInfo> {
    return this.currentBundle || this.createDefaultBundle();
  }

  async list(): Promise<BundleInfo[]> {
    return Array.from(this.bundles.values());
  }

  async delete(options: DeleteOptions): Promise<void> {
    if (options.bundleId) {
      this.bundles.delete(options.bundleId);
    } else if (options.keepVersions !== undefined) {
      const sortedBundles = Array.from(this.bundles.values())
        .sort((a, b) => b.downloadTime - a.downloadTime);
      
      const bundlesToDelete = sortedBundles.slice(options.keepVersions);
      bundlesToDelete.forEach(bundle => this.bundles.delete(bundle.bundleId));
    } else if (options.olderThan !== undefined) {
      const cutoffTime = options.olderThan;
      Array.from(this.bundles.values())
        .filter(bundle => bundle.downloadTime < cutoffTime)
        .forEach(bundle => this.bundles.delete(bundle.bundleId));
    }

    this.saveStoredData();
  }

  async notifyAppReady(): Promise<void> {
    console.log('Web: App ready notification received');
    
    if (this.currentBundle) {
      this.currentBundle.verified = true;
      this.saveStoredData();
    }
  }

  async getLatest(): Promise<LatestVersion> {
    // In web, check for service worker updates
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        return {
          available: true,
          version: 'web-update',
          notes: 'Service worker update available',
        };
      }
    }

    return {
      available: false,
    };
  }

  async setChannel(channel: string): Promise<void> {
    if (!this.config.liveUpdate) {
      this.config.liveUpdate = {} as any;
    }
    this.config.liveUpdate!.channel = channel;
    this.saveConfiguration();
  }

  async setUpdateUrl(url: string): Promise<void> {
    if (!url.startsWith('https://') && this.config.security?.enforceHttps !== false) {
      throw this.createError(UpdateErrorCode.INSECURE_URL, 'Update URL must use HTTPS');
    }

    if (!this.config.liveUpdate) {
      this.config.liveUpdate = {} as any;
    }
    this.config.liveUpdate!.serverUrl = url;
    this.saveConfiguration();
  }

  async validateUpdate(options: ValidateOptions): Promise<ValidationResult> {
    // Simulate validation
    const checksumValid = await this.validateChecksum(options.bundlePath, options.checksum);
    const signatureValid = options.signature ? await this.validateSignature(options.bundlePath, options.signature) : true;
    const sizeValid = options.maxSize ? true : true; // Would check actual size

    const isValid = checksumValid && signatureValid && sizeValid;

    return {
      isValid,
      error: isValid ? undefined : 'Validation failed',
      details: {
        checksumValid,
        signatureValid,
        sizeValid,
        versionValid: true,
      },
    };
  }

  /**
   * App Update Methods
   */
  async getAppUpdateInfo(): Promise<AppUpdateInfo> {
    console.log('Web: App updates not supported on web platform');
    
    return {
      updateAvailable: false,
      currentVersion: '1.0.0',
      immediateUpdateAllowed: false,
      flexibleUpdateAllowed: false,
    };
  }

  async performImmediateUpdate(): Promise<void> {
    throw this.createError(
      UpdateErrorCode.PLATFORM_NOT_SUPPORTED,
      'App updates are not supported on web platform'
    );
  }

  async startFlexibleUpdate(): Promise<void> {
    throw this.createError(
      UpdateErrorCode.PLATFORM_NOT_SUPPORTED,
      'App updates are not supported on web platform'
    );
  }

  async completeFlexibleUpdate(): Promise<void> {
    throw this.createError(
      UpdateErrorCode.PLATFORM_NOT_SUPPORTED,
      'App updates are not supported on web platform'
    );
  }

  async openAppStore(options?: OpenAppStoreOptions): Promise<void> {
    console.log('Web: Opening app store fallback URL', options);
    
    // Fallback to website or app landing page
    const fallbackUrl = this.config.appUpdate?.storeUrl?.android || 
                       this.config.appUpdate?.storeUrl?.ios || 
                       'https://example.com/download';
    
    window.open(fallbackUrl, '_blank');
  }

  /**
   * App Review Methods
   */
  async requestReview(): Promise<ReviewResult> {
    const canRequest = await this.canRequestReview();
    
    if (!canRequest.allowed) {
      return {
        shown: false,
        error: canRequest.reason,
      };
    }

    console.log('Web: Showing review request fallback');
    
    // Update last request time
    this.lastReviewRequest = Date.now();
    localStorage.setItem('capacitor-native-update-last-review', this.lastReviewRequest.toString());

    // In web, we could show a custom modal or redirect to a review page
    const reviewUrl = 'https://example.com/review';
    const shouldRedirect = confirm('Would you like to leave a review for our app?');
    
    if (shouldRedirect) {
      window.open(reviewUrl, '_blank');
    }

    return {
      shown: true,
    };
  }

  async canRequestReview(): Promise<CanRequestReviewResult> {
    const config = this.config.appReview;
    const now = Date.now();
    const installDate = this.getInstallDate();
    const daysSinceInstall = (now - installDate) / (1000 * 60 * 60 * 24);

    // Check minimum days since install
    if (config?.minimumDaysSinceInstall && daysSinceInstall < config.minimumDaysSinceInstall) {
      return {
        allowed: false,
        reason: 'Not enough days since install',
      };
    }

    // Check minimum days since last prompt
    if (config?.minimumDaysSinceLastPrompt && this.lastReviewRequest > 0) {
      const daysSinceLastPrompt = (now - this.lastReviewRequest) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < config.minimumDaysSinceLastPrompt) {
        return {
          allowed: false,
          reason: 'Too soon since last review request',
        };
      }
    }

    // Check minimum launch count
    if (config?.minimumLaunchCount && this.launchCount < config.minimumLaunchCount) {
      return {
        allowed: false,
        reason: 'Not enough app launches',
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Background Update Methods
   */
  async enableBackgroundUpdates(config: BackgroundUpdateConfig): Promise<void> {
    console.log('Web: Enabling background updates', config);
    
    if (!this.config.backgroundUpdate) {
      this.config.backgroundUpdate = config;
    } else {
      this.config.backgroundUpdate = { ...this.config.backgroundUpdate, ...config };
    }
    
    this.backgroundUpdateStatus.enabled = config.enabled;
    
    if (config.enabled) {
      await this.scheduleBackgroundCheck(config.checkInterval);
    } else {
      await this.disableBackgroundUpdates();
    }
    
    this.saveConfiguration();
  }

  async disableBackgroundUpdates(): Promise<void> {
    console.log('Web: Disabling background updates');
    
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
      this.backgroundCheckInterval = null;
    }
    
    this.backgroundUpdateStatus.enabled = false;
    this.backgroundUpdateStatus.isRunning = false;
    this.backgroundUpdateStatus.currentTaskId = undefined;
    
    if (this.config.backgroundUpdate) {
      this.config.backgroundUpdate.enabled = false;
    }
    
    this.saveConfiguration();
  }

  async getBackgroundUpdateStatus(): Promise<BackgroundUpdateStatus> {
    return { ...this.backgroundUpdateStatus };
  }

  async scheduleBackgroundCheck(interval: number): Promise<void> {
    console.log('Web: Scheduling background check with interval', interval);
    
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
    }
    
    this.backgroundCheckInterval = setInterval(async () => {
      if (this.backgroundUpdateStatus.enabled && !this.backgroundUpdateStatus.isRunning) {
        await this.triggerBackgroundCheck();
      }
    }, interval);
    
    this.backgroundUpdateStatus.nextCheckTime = Date.now() + interval;
  }

  async triggerBackgroundCheck(): Promise<BackgroundCheckResult> {
    console.log('Web: Triggering background check');
    
    if (!this.backgroundUpdateStatus.enabled) {
      return {
        success: false,
        updatesFound: false,
        notificationSent: false,
        error: {
          code: UpdateErrorCode.INVALID_CONFIG,
          message: 'Background updates not enabled',
        },
      };
    }
    
    this.backgroundUpdateStatus.isRunning = true;
    this.backgroundUpdateStatus.checkCount++;
    this.backgroundUpdateStatus.lastCheckTime = Date.now();
    
    try {
      const updateInfo = await this.getAppUpdateInfo();
      const liveUpdate = await this.getLatest();
      
      const updatesFound = updateInfo.updateAvailable || liveUpdate.available;
      let notificationSent = false;
      
      if (updatesFound) {
        notificationSent = await this.sendWebNotification(updateInfo, liveUpdate);
      }
      
      this.backgroundUpdateStatus.isRunning = false;
      this.backgroundUpdateStatus.lastUpdateTime = updatesFound ? Date.now() : undefined;
      this.backgroundUpdateStatus.lastError = undefined;
      
      return {
        success: true,
        updatesFound,
        appUpdate: updateInfo.updateAvailable ? updateInfo : undefined,
        liveUpdate: liveUpdate.available ? liveUpdate : undefined,
        notificationSent,
      };
    } catch (error) {
      this.backgroundUpdateStatus.isRunning = false;
      this.backgroundUpdateStatus.failureCount++;
      this.backgroundUpdateStatus.lastError = {
        code: UpdateErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      
      return {
        success: false,
        updatesFound: false,
        notificationSent: false,
        error: this.backgroundUpdateStatus.lastError,
      };
    }
  }

  async setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    console.log('Web: Setting notification preferences', preferences);
    
    if (!this.config.backgroundUpdate) {
      this.config.backgroundUpdate = {} as BackgroundUpdateConfig;
    }
    
    this.config.backgroundUpdate.notificationPreferences = preferences;
    this.saveConfiguration();
  }

  async getNotificationPermissions(): Promise<NotificationPermissionStatus> {
    if (!('Notification' in window)) {
      return {
        granted: false,
        canRequest: false,
      };
    }
    
    const permission = Notification.permission;
    
    return {
      granted: permission === 'granted',
      canRequest: permission === 'default',
    };
  }

  async requestNotificationPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  private async sendWebNotification(appUpdate: AppUpdateInfo, liveUpdate: LatestVersion): Promise<boolean> {
    const permissions = await this.getNotificationPermissions();
    if (!permissions.granted) {
      return false;
    }
    
    const prefs = this.config.backgroundUpdate?.notificationPreferences;
    let title = prefs?.title || 'App Update Available';
    let body = prefs?.description || 'A new version of the app is available';
    
    if (appUpdate.updateAvailable && liveUpdate.available) {
      title = 'App Updates Available';
      body = `App version ${appUpdate.availableVersion} and content updates are available`;
    } else if (appUpdate.updateAvailable) {
      title = 'App Update Available';
      body = `Version ${appUpdate.availableVersion} is available`;
    } else if (liveUpdate.available) {
      title = 'Content Update Available';
      body = `New content version ${liveUpdate.version} is available`;
    }
    
    try {
      const notification = new Notification(title, {
        body,
        icon: prefs?.iconName || '/favicon.ico',
        badge: '/favicon.ico',
        silent: !prefs?.soundEnabled,
        data: {
          type: 'update_available',
          appUpdate,
          liveUpdate,
        },
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        this.notifyListeners('backgroundUpdateNotification', {
          type: appUpdate.updateAvailable ? 'app_update' : 'live_update',
          updateAvailable: true,
          version: appUpdate.availableVersion || liveUpdate.version,
          action: 'tapped',
        });
      };
      
      return true;
    } catch (error) {
      console.error('Web: Failed to send notification', error);
      return false;
    }
  }

  /**
   * Helper Methods
   */
  private createError(code: UpdateErrorCode, message: string): UpdateError {
    return {
      code,
      message,
    };
  }

  private createDefaultBundle(): BundleInfo {
    return {
      bundleId: 'default',
      version: '1.0.0',
      path: '/',
      downloadTime: Date.now(),
      size: 0,
      status: BundleStatus.ACTIVE,
      checksum: '',
      verified: true,
    };
  }

  private async validateChecksum(_data: string, expectedChecksum: string): Promise<boolean> {
    // In a real implementation, would calculate actual checksum
    console.log('Web: Validating checksum...', expectedChecksum);
    return true;
  }

  private async validateSignature(_data: string, signature: string): Promise<boolean> {
    // In a real implementation, would verify signature
    console.log('Web: Validating signature...', signature);
    return true;
  }

  private loadStoredData(): void {
    // Load configuration
    const storedConfig = localStorage.getItem('capacitor-native-update-config');
    if (storedConfig) {
      this.config = JSON.parse(storedConfig);
    }

    // Load bundles
    const storedBundles = localStorage.getItem('capacitor-native-update-bundles');
    if (storedBundles) {
      const bundlesArray: BundleInfo[] = JSON.parse(storedBundles);
      bundlesArray.forEach(bundle => this.bundles.set(bundle.bundleId, bundle));
    }

    // Load current bundle
    const storedCurrent = localStorage.getItem('capacitor-native-update-current');
    if (storedCurrent) {
      this.currentBundle = JSON.parse(storedCurrent);
    }

    // Load last review request time
    const storedLastReview = localStorage.getItem('capacitor-native-update-last-review');
    if (storedLastReview) {
      this.lastReviewRequest = parseInt(storedLastReview, 10);
    }

    // Load launch count
    const storedLaunchCount = localStorage.getItem('capacitor-native-update-launch-count');
    if (storedLaunchCount) {
      this.launchCount = parseInt(storedLaunchCount, 10);
    }
  }

  private saveStoredData(): void {
    localStorage.setItem('capacitor-native-update-bundles', 
      JSON.stringify(Array.from(this.bundles.values())));
    
    if (this.currentBundle) {
      localStorage.setItem('capacitor-native-update-current', JSON.stringify(this.currentBundle));
    }
  }

  private saveConfiguration(): void {
    localStorage.setItem('capacitor-native-update-config', JSON.stringify(this.config));
  }

  private getInstallDate(): number {
    const stored = localStorage.getItem('capacitor-native-update-install-date');
    if (stored) {
      return parseInt(stored, 10);
    }
    
    const now = Date.now();
    localStorage.setItem('capacitor-native-update-install-date', now.toString());
    return now;
  }

  private incrementLaunchCount(): void {
    this.launchCount++;
    localStorage.setItem('capacitor-native-update-launch-count', this.launchCount.toString());
  }
}