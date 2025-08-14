import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { AppUpdateInfo } from './types';

interface NotifierConfig extends PluginConfig {
  showUpdateNotification?: boolean;
}

export class AppUpdateNotifier {
  private config: NotifierConfig;
  private logger: Logger;

  constructor(config: PluginConfig) {
    this.config = config as NotifierConfig;
    this.logger = new Logger('AppUpdateNotifier');
  }

  async notifyUpdateAvailable(updateInfo: AppUpdateInfo): Promise<void> {
    this.logger.log('Notifying update available', updateInfo);

    // Emit event for update availability
    this.emitUpdateEvent('appUpdateAvailable', {
      currentVersion: updateInfo.currentVersion,
      availableVersion: updateInfo.availableVersion,
      updatePriority: updateInfo.updatePriority,
      updateSize: updateInfo.updateSize,
      releaseNotes: updateInfo.releaseNotes,
      storeUrl: updateInfo.updateURL,
    });

    // Show notification if configured
    if (this.config.showUpdateNotification !== false) {
      await this.showNotification(updateInfo);
    }
  }

  async notifyUpdateDownloading(progress: number): Promise<void> {
    this.logger.log('Update download progress', progress);

    // Emit progress event
    this.emitUpdateEvent('appUpdateProgress', {
      percentComplete: progress,
    });
  }

  async notifyUpdateReady(): Promise<void> {
    this.logger.log('Update ready for installation');

    // Emit ready event
    this.emitUpdateEvent('appUpdateReady', {
      message: 'Update downloaded and ready to install',
    });

    // Show notification
    if (this.config.showUpdateNotification !== false) {
      await this.showReadyNotification();
    }
  }

  async notifyUpdateFailed(error: Error): Promise<void> {
    this.logger.error('Update failed', error);

    // Emit error event
    this.emitUpdateEvent('appUpdateFailed', {
      error: error.message,
      code: (error as any).code || 'UNKNOWN_ERROR',
    });
  }

  private async showNotification(updateInfo: AppUpdateInfo): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notification = new Notification('App Update Available', {
        body: `Version ${updateInfo.availableVersion} is available. ${updateInfo.releaseNotes || ''}`,
        icon: '/icon.png',
        tag: 'app-update',
        requireInteraction: updateInfo.updatePriority === 5, // Priority 5 = IMMEDIATE
      });

      notification.onclick = () => {
        // Trigger update action
        this.emitUpdateEvent('appUpdateNotificationClicked', {});
        notification.close();
      };
    }
  }

  private async showReadyNotification(): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: 'App update has been downloaded and is ready to install.',
      icon: '/icon.png',
      tag: 'app-update-ready',
    };
    // Actions are not supported in standard NotificationOptions
    (notificationOptions as any).actions = [
      { action: 'install', title: 'Install Now' },
      { action: 'later', title: 'Later' },
    ];

    const notification = new Notification('Update Ready', notificationOptions);

    notification.onclick = (event: any) => {
      if (event.action === 'install') {
        this.emitUpdateEvent('appUpdateInstallClicked', {});
      }
      notification.close();
    };
  }

  private emitUpdateEvent(eventName: string, data: any): void {
    // Emit custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
  }
}
