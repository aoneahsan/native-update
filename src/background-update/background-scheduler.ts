import type {
  BackgroundUpdateConfig,
  BackgroundUpdateStatus,
  BackgroundCheckResult,
  AppUpdateInfo,
  LatestVersion,
} from '../definitions';

import {
  BackgroundUpdateType,
  UpdateErrorCode,
} from '../definitions';

export class BackgroundScheduler {
  private config: BackgroundUpdateConfig | null = null;
  private status: BackgroundUpdateStatus = {
    enabled: false,
    isRunning: false,
    checkCount: 0,
    failureCount: 0,
  };

  configure(config: BackgroundUpdateConfig): void {
    this.config = config;
    this.status.enabled = config.enabled;
  }

  getStatus(): BackgroundUpdateStatus {
    return { ...this.status };
  }

  async performCheck(): Promise<BackgroundCheckResult> {
    if (!this.config?.enabled) {
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

    this.status.isRunning = true;
    this.status.checkCount++;

    try {
      const result = await this.checkForUpdates();
      this.status.lastCheckTime = Date.now();
      this.status.isRunning = false;
      this.status.lastError = undefined;

      return result;
    } catch (error) {
      this.status.failureCount++;
      this.status.isRunning = false;
      this.status.lastError = {
        code: UpdateErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      };

      return {
        success: false,
        updatesFound: false,
        notificationSent: false,
        error: this.status.lastError,
      };
    }
  }

  private async checkForUpdates(): Promise<BackgroundCheckResult> {
    const promises: Promise<any>[] = [];
    let appUpdate: AppUpdateInfo | undefined;
    let liveUpdate: LatestVersion | undefined;

    if (this.config?.updateTypes.includes(BackgroundUpdateType.APP_UPDATE) ||
        this.config?.updateTypes.includes(BackgroundUpdateType.BOTH)) {
      promises.push(this.checkAppUpdate());
    }

    if (this.config?.updateTypes.includes(BackgroundUpdateType.LIVE_UPDATE) ||
        this.config?.updateTypes.includes(BackgroundUpdateType.BOTH)) {
      promises.push(this.checkLiveUpdate());
    }

    const results = await Promise.allSettled(promises);
    
    if (results[0]?.status === 'fulfilled') {
      appUpdate = results[0].value;
    }
    
    if (results[1]?.status === 'fulfilled') {
      liveUpdate = results[1].value;
    }

    const updatesFound = (appUpdate?.updateAvailable || liveUpdate?.available) || false;
    let notificationSent = false;

    if (updatesFound) {
      notificationSent = await this.sendNotification(appUpdate, liveUpdate);
    }

    return {
      success: true,
      updatesFound,
      appUpdate,
      liveUpdate,
      notificationSent,
    };
  }

  private async checkAppUpdate(): Promise<AppUpdateInfo | undefined> {
    throw new Error('App update checking not implemented in base class');
  }

  private async checkLiveUpdate(): Promise<LatestVersion | undefined> {
    throw new Error('Live update checking not implemented in base class');
  }

  private async sendNotification(
    _appUpdate?: AppUpdateInfo,
    _liveUpdate?: LatestVersion,
  ): Promise<boolean> {
    throw new Error('Notification sending not implemented in base class');
  }

  protected calculateNextCheckTime(): number {
    const now = Date.now();
    const interval = this.config?.checkInterval || 24 * 60 * 60 * 1000; // Default 24 hours
    return now + interval;
  }

  protected shouldRespectBatteryOptimization(): boolean {
    return this.config?.respectBatteryOptimization ?? true;
  }

  protected isNetworkConditionMet(): boolean {
    return true;
  }

  protected isBatteryLevelSufficient(): boolean {
    return true;
  }
}