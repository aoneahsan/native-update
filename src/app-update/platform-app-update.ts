import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { AppUpdateInfo, AppUpdateOptions, VersionInfo, AppStoreInfo } from './types';
import { Capacitor } from '@capacitor/core';

interface PlatformConfig extends PluginConfig {
  webUpdateUrl?: string;
  appStoreId?: string;
  packageName?: string;
}

export class PlatformAppUpdate {
  private config: PlatformConfig;
  private logger: Logger;
  private platform: string;

  constructor(config: PluginConfig) {
    this.config = config as PlatformConfig;
    this.logger = new Logger('PlatformAppUpdate');
    this.platform = Capacitor.getPlatform();
  }

  async checkForUpdate(options?: AppUpdateOptions): Promise<AppUpdateInfo> {
    // options parameter is kept for future use
    this.logger.log('Checking for platform update: ' + this.platform);
    
    const versionInfo = await this.getVersionInfo();
    
    // Default response
    const updateInfo: AppUpdateInfo = {
      updateAvailable: false,
      currentVersion: versionInfo.currentVersion,
      availableVersion: versionInfo.currentVersion
    };
    
    // Platform-specific checks
    if (this.platform === 'android') {
      // Android would check Play Store via Play Core Library
      // This is handled by native implementation
      return updateInfo;
    } else if (this.platform === 'ios') {
      // iOS would check App Store via iTunes API
      // This is handled by native implementation
      return updateInfo;
    } else {
      // Web platform - check configured update URL
      if (this.config.webUpdateUrl) {
        try {
          const response = await fetch(this.config.webUpdateUrl);
          const data = await response.json();
          
          if (data.version && data.version !== versionInfo.currentVersion) {
            updateInfo.updateAvailable = true;
            updateInfo.availableVersion = data.version;
            updateInfo.releaseNotes = data.releaseNotes;
            updateInfo.updateURL = data.downloadUrl;
          }
        } catch (error) {
          this.logger.error('Failed to check web update', error);
        }
      }
    }
    
    return updateInfo;
  }

  async getVersionInfo(): Promise<VersionInfo> {
    // getAppInfo is not available in standard Capacitor, using default values
    const appInfo = {
      version: '1.0.0',
      build: '1',
      id: 'com.example.app'
    };
    
    return {
      currentVersion: appInfo.version,
      buildNumber: appInfo.build,
      packageName: appInfo.id,
      platform: this.platform as any,
      minimumVersion: this.config.minimumVersion
    };
  }

  async getAppStoreUrl(): Promise<AppStoreInfo> {
    const platform = this.platform;
    let url = '';
    
    if (platform === 'ios') {
      // iOS App Store URL
      const appStoreId = this.config.appStoreId || this.config.iosAppId;
      if (!appStoreId) {
        throw new Error('App Store ID not configured');
      }
      url = `https://apps.apple.com/app/id${appStoreId}`;
    } else if (platform === 'android') {
      // Google Play Store URL
      const packageName = this.config.packageName || (await this.getVersionInfo()).packageName;
      url = `https://play.google.com/store/apps/details?id=${packageName}`;
    } else {
      // Web URL
      url = this.config.webUpdateUrl || window.location.origin;
    }
    
    return { url, platform: platform as any };
  }

  async openUrl(url: string): Promise<void> {
    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank');
    } else {
      throw new Error('Cannot open URL on this platform');
    }
  }

  isUpdateSupported(): boolean {
    // Check if platform supports in-app updates
    if (this.platform === 'android') {
      // Android supports in-app updates via Play Core
      return true;
    } else if (this.platform === 'ios') {
      // iOS only supports opening App Store
      return false;
    } else {
      // Web can redirect to update URL
      return true;
    }
  }

  getUpdateCapabilities(): {
    immediateUpdate: boolean;
    flexibleUpdate: boolean;
    backgroundDownload: boolean;
    inAppReview: boolean;
  } {
    const capabilities = {
      immediateUpdate: false,
      flexibleUpdate: false,
      backgroundDownload: false,
      inAppReview: false
    };
    
    if (this.platform === 'android') {
      capabilities.immediateUpdate = true;
      capabilities.flexibleUpdate = true;
      capabilities.backgroundDownload = true;
      capabilities.inAppReview = true;
    } else if (this.platform === 'ios') {
      capabilities.inAppReview = true;
    }
    
    return capabilities;
  }
}