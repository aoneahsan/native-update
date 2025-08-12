import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { AppUpdateChecker } from './app-update-checker';
import { AppUpdateInstaller } from './app-update-installer';
import { AppUpdateNotifier } from './app-update-notifier';
import { PlatformAppUpdate } from './platform-app-update';
import { 
  AppUpdateInfo, 
  AppUpdateOptions, 
  VersionInfo, 
  MinimumVersionCheck,
  AppStoreInfo,
  AppUpdateState
} from './types';
import { AppUpdatePlugin } from '../definitions';
import { PluginListenerHandle } from '@capacitor/core';

export class AppUpdateManager implements AppUpdatePlugin {
  private config: PluginConfig;
  private logger: Logger;
  private checker: AppUpdateChecker;
  private installer: AppUpdateInstaller;
  private notifier: AppUpdateNotifier;
  private platformUpdate: PlatformAppUpdate;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('AppUpdateManager');
    this.checker = new AppUpdateChecker(config);
    this.installer = new AppUpdateInstaller(config);
    this.notifier = new AppUpdateNotifier(config);
    this.platformUpdate = new PlatformAppUpdate(config);
  }

  async checkAppUpdate(options?: AppUpdateOptions): Promise<AppUpdateInfo> {
    try {
      this.logger.log('Checking for app updates', options);
      
      // Check with native platform
      const nativeInfo = await this.platformUpdate.checkForUpdate(options);
      
      // If no native info, check with server
      if (!nativeInfo.updateAvailable && this.config.updateUrl) {
        const serverInfo = await this.checker.checkServerVersion(options);
        return this.mergeUpdateInfo(nativeInfo, serverInfo);
      }
      
      return nativeInfo;
    } catch (error) {
      this.logger.error('Failed to check app update', error);
      throw error;
    }
  }

  async startImmediateUpdate(): Promise<void> {
    try {
      this.logger.log('Starting immediate update');
      
      // Check if immediate update is allowed
      const updateInfo = await this.checkAppUpdate();
      if (!updateInfo.immediateUpdateAllowed) {
        throw new Error('Immediate update not allowed');
      }
      
      // Start the update
      await this.installer.startImmediateUpdate();
      
      // Notify listeners
      this.emit('appUpdateStateChanged', {
        installStatus: 1, // PENDING
        packageName: this.config.packageName || '',
        availableVersion: updateInfo.availableVersion || ''
      });
    } catch (error) {
      this.logger.error('Failed to start immediate update', error);
      throw error;
    }
  }

  async startFlexibleUpdate(): Promise<void> {
    try {
      this.logger.log('Starting flexible update');
      
      // Check if flexible update is allowed
      const updateInfo = await this.checkAppUpdate();
      if (!updateInfo.flexibleUpdateAllowed) {
        throw new Error('Flexible update not allowed');
      }
      
      // Start the update
      await this.installer.startFlexibleUpdate();
      
      // Set up progress monitoring
      this.installer.onProgress((progress) => {
        this.emit('appUpdateProgress', progress);
      });
      
      // Notify listeners
      this.emit('appUpdateStateChanged', {
        installStatus: 2, // DOWNLOADING
        packageName: this.config.packageName || '',
        availableVersion: updateInfo.availableVersion || ''
      });
    } catch (error) {
      this.logger.error('Failed to start flexible update', error);
      throw error;
    }
  }

  async completeFlexibleUpdate(): Promise<void> {
    try {
      this.logger.log('Completing flexible update');
      await this.installer.completeFlexibleUpdate();
      
      // App will restart after this
      this.emit('appUpdateStateChanged', {
        installStatus: 3, // INSTALLING
        packageName: this.config.packageName || '',
        availableVersion: ''
      });
    } catch (error) {
      this.logger.error('Failed to complete flexible update', error);
      throw error;
    }
  }

  async getVersionInfo(): Promise<VersionInfo> {
    try {
      this.logger.log('Getting version info');
      return await this.platformUpdate.getVersionInfo();
    } catch (error) {
      this.logger.error('Failed to get version info', error);
      throw error;
    }
  }

  async isMinimumVersionMet(): Promise<MinimumVersionCheck> {
    try {
      this.logger.log('Checking minimum version');
      const versionInfo = await this.getVersionInfo();
      const minimumVersion = this.config.minimumVersion || '0.0.0';
      
      const isMet = this.checker.compareVersions(
        versionInfo.currentVersion,
        minimumVersion
      ) >= 0;
      
      return {
        isMet,
        currentVersion: versionInfo.currentVersion,
        minimumVersion,
        updateRequired: !isMet && this.config.enforceMinVersion === true
      };
    } catch (error) {
      this.logger.error('Failed to check minimum version', error);
      throw error;
    }
  }

  async openAppStore(): Promise<void> {
    try {
      this.logger.log('Opening app store');
      const storeInfo = await this.getAppStoreUrl();
      await this.platformUpdate.openUrl(storeInfo.url);
    } catch (error) {
      this.logger.error('Failed to open app store', error);
      throw error;
    }
  }

  async getAppStoreUrl(): Promise<AppStoreInfo> {
    try {
      this.logger.log('Getting app store URL');
      return await this.platformUpdate.getAppStoreUrl();
    } catch (error) {
      this.logger.error('Failed to get app store URL', error);
      throw error;
    }
  }

  async getUpdateInstallState(): Promise<AppUpdateState> {
    try {
      this.logger.log('Getting update install state');
      return await this.installer.getInstallState();
    } catch (error) {
      this.logger.error('Failed to get update install state', error);
      throw error;
    }
  }

  addListener(
    eventName: string,
    listenerFunc: (data: any) => void
  ): PluginListenerHandle {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    
    this.listeners.get(eventName)!.add(listenerFunc);
    
    return {
      remove: () => {
        const listeners = this.listeners.get(eventName);
        if (listeners) {
          listeners.delete(listenerFunc);
        }
      }
    };
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  private emit(eventName: string, data: any): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.logger.error(`Error in ${eventName} listener`, error);
        }
      });
    }
  }

  private mergeUpdateInfo(
    nativeInfo: AppUpdateInfo,
    serverInfo: Partial<AppUpdateInfo>
  ): AppUpdateInfo {
    return {
      ...nativeInfo,
      ...serverInfo,
      updateAvailable: nativeInfo.updateAvailable || !!serverInfo.availableVersion,
      availableVersion: serverInfo.availableVersion || nativeInfo.availableVersion
    };
  }
}