import { CapacitorNativeUpdate } from 'capacitor-native-update';
import type {
  UpdateConfig,
  SyncResult,
  BundleInfo,
  AppUpdateInfo,
  LatestVersion,
  DownloadProgressEvent,
  UpdateStateChangedEvent,
} from 'capacitor-native-update';

export class UpdateService {
  private static instance: UpdateService;
  private isConfigured = false;
  private downloadProgressCallback?: (progress: DownloadProgressEvent) => void;
  private stateChangeCallback?: (state: UpdateStateChangedEvent) => void;

  // Example configuration - replace with your actual values
  private readonly config: UpdateConfig = {
    liveUpdate: {
      appId: 'com.example.app',
      serverUrl: 'https://updates.example.com',
      channel: 'production',
      autoUpdate: true,
      publicKey: 'YOUR_PUBLIC_KEY_HERE',
      requireSignature: true,
      checksumAlgorithm: 'SHA-256',
      maxBundleSize: 50 * 1024 * 1024, // 50MB
      allowEmulator: false,
    },
    appUpdate: {
      minimumVersion: '1.0.0',
      updatePriority: 3,
      checkOnAppStart: true,
      allowDowngrade: false,
    },
    appReview: {
      minimumDaysSinceInstall: 7,
      minimumDaysSinceLastPrompt: 90,
      minimumLaunchCount: 5,
      debugMode: false, // Set to true for testing
    },
    security: {
      enforceHttps: true,
      certificatePinning: {
        enabled: false, // Enable in production with proper certificates
        certificates: [],
      },
      validateInputs: true,
      secureStorage: true,
      logSecurityEvents: true,
    },
  };

  private constructor() {}

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isConfigured) return;

    try {
      await CapacitorNativeUpdate.configure(this.config);
      this.setupListeners();
      this.isConfigured = true;
      console.log('Update service initialized');
    } catch (error) {
      console.error('Failed to initialize update service:', error);
      throw error;
    }
  }

  private setupListeners(): void {
    // Listen for download progress
    CapacitorNativeUpdate.addListener('downloadProgress', (event) => {
      console.log(`Download progress: ${event.percent}%`);
      this.downloadProgressCallback?.(event);
    });

    // Listen for state changes
    CapacitorNativeUpdate.addListener('updateStateChanged', (event) => {
      console.log('Update state changed:', event);
      this.stateChangeCallback?.(event);
    });
  }

  // Live Update Methods

  async checkForUpdates(): Promise<SyncResult> {
    try {
      return await CapacitorNativeUpdate.sync();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      throw error;
    }
  }

  async downloadUpdate(
    url: string,
    version: string,
    checksum: string
  ): Promise<BundleInfo> {
    try {
      return await CapacitorNativeUpdate.download({
        url,
        version,
        checksum,
        maxRetries: 3,
        timeout: 30000,
      });
    } catch (error) {
      console.error('Failed to download update:', error);
      throw error;
    }
  }

  async applyUpdate(bundle: BundleInfo): Promise<void> {
    try {
      await CapacitorNativeUpdate.set(bundle);
      // Optionally reload immediately
      // await CapacitorNativeUpdate.reload();
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw error;
    }
  }

  async reloadApp(): Promise<void> {
    await CapacitorNativeUpdate.reload();
  }

  async resetToOriginal(): Promise<void> {
    await CapacitorNativeUpdate.reset();
    await CapacitorNativeUpdate.reload();
  }

  async getCurrentBundle(): Promise<BundleInfo> {
    return await CapacitorNativeUpdate.current();
  }

  async listBundles(): Promise<BundleInfo[]> {
    return await CapacitorNativeUpdate.list();
  }

  async deleteBundle(bundleId: string): Promise<void> {
    await CapacitorNativeUpdate.delete({ bundleId });
  }

  async cleanupOldBundles(keepVersions: number = 3): Promise<void> {
    await CapacitorNativeUpdate.delete({ keepVersions });
  }

  async notifyAppReady(): Promise<void> {
    await CapacitorNativeUpdate.notifyAppReady();
  }

  async getLatestVersion(): Promise<LatestVersion> {
    return await CapacitorNativeUpdate.getLatest();
  }

  async setChannel(channel: string): Promise<void> {
    await CapacitorNativeUpdate.setChannel(channel);
  }

  // App Update Methods

  async checkAppStoreUpdate(): Promise<AppUpdateInfo> {
    return await CapacitorNativeUpdate.getAppUpdateInfo();
  }

  async performImmediateUpdate(): Promise<void> {
    await CapacitorNativeUpdate.performImmediateUpdate();
  }

  async openAppStore(): Promise<void> {
    await CapacitorNativeUpdate.openAppStore();
  }

  // App Review Methods

  async requestReview(): Promise<boolean> {
    try {
      const result = await CapacitorNativeUpdate.requestReview();
      return result.shown;
    } catch (error) {
      console.error('Failed to request review:', error);
      return false;
    }
  }

  async canRequestReview(): Promise<{ canRequest: boolean; reason?: string }> {
    return await CapacitorNativeUpdate.canRequestReview();
  }

  // Security Methods

  async getSecurityInfo(): Promise<any> {
    return await CapacitorNativeUpdate.getSecurityInfo();
  }

  async validateUpdate(bundlePath: string, checksum: string): Promise<boolean> {
    const result = await CapacitorNativeUpdate.validateUpdate({
      bundlePath,
      checksum,
      maxSize: 50 * 1024 * 1024,
    });
    return result.isValid;
  }

  // Event Handlers

  onDownloadProgress(
    callback: (progress: DownloadProgressEvent) => void
  ): void {
    this.downloadProgressCallback = callback;
  }

  onStateChange(callback: (state: UpdateStateChangedEvent) => void): void {
    this.stateChangeCallback = callback;
  }

  // Utility Methods

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}
