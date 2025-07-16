import type {
  NotificationPreferences,
  NotificationPermissionStatus,
  AppUpdateInfo,
  LatestVersion,
} from '../definitions';

import {
  NotificationPriority,
} from '../definitions';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export abstract class NotificationManager {
  protected preferences: NotificationPreferences = {
    title: 'App Update Available',
    description: 'A new version of the app is available',
    soundEnabled: true,
    vibrationEnabled: true,
    showActions: true,
    actionLabels: {
      updateNow: 'Update Now',
      updateLater: 'Later',
      dismiss: 'Dismiss',
    },
    priority: NotificationPriority.DEFAULT,
  };

  setPreferences(preferences: NotificationPreferences): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  abstract getPermissionStatus(): Promise<NotificationPermissionStatus>;
  abstract requestPermissions(): Promise<boolean>;
  abstract showNotification(data: NotificationData): Promise<boolean>;
  abstract cancelNotification(id: string): Promise<void>;
  abstract setupNotificationChannels(): Promise<void>;

  async sendUpdateNotification(
    appUpdate?: AppUpdateInfo,
    liveUpdate?: LatestVersion,
  ): Promise<boolean> {
    const permissions = await this.getPermissionStatus();
    if (!permissions.granted) {
      return false;
    }

    const notificationData = this.createNotificationData(appUpdate, liveUpdate);
    return this.showNotification(notificationData);
  }

  protected createNotificationData(
    appUpdate?: AppUpdateInfo,
    liveUpdate?: LatestVersion,
  ): NotificationData {
    let title = this.preferences.title || 'App Update Available';
    let body = this.preferences.description || 'A new version of the app is available';
    
    if (appUpdate?.updateAvailable && liveUpdate?.available) {
      title = 'App Updates Available';
      body = `App version ${appUpdate.availableVersion} and content updates are available`;
    } else if (appUpdate?.updateAvailable) {
      title = 'App Update Available';
      body = `Version ${appUpdate.availableVersion} is available`;
    } else if (liveUpdate?.available) {
      title = 'Content Update Available';
      body = `New content version ${liveUpdate.version} is available`;
    }

    const actions: NotificationAction[] = [];
    if (this.preferences.showActions) {
      actions.push({
        id: 'update_now',
        title: this.preferences.actionLabels?.updateNow || 'Update Now',
      });
      actions.push({
        id: 'update_later',
        title: this.preferences.actionLabels?.updateLater || 'Later',
      });
      actions.push({
        id: 'dismiss',
        title: this.preferences.actionLabels?.dismiss || 'Dismiss',
      });
    }

    return {
      title,
      body,
      data: {
        type: 'update_available',
        appUpdate,
        liveUpdate,
      },
      actions,
    };
  }

  protected getChannelId(): string {
    return this.preferences.channelId || 'capacitor_native_update';
  }

  protected getChannelName(): string {
    return this.preferences.channelName || 'App Updates';
  }

  protected getPriority(): NotificationPriority {
    return this.preferences.priority || NotificationPriority.DEFAULT;
  }

  protected shouldPlaySound(): boolean {
    return this.preferences.soundEnabled ?? true;
  }

  protected shouldVibrate(): boolean {
    return this.preferences.vibrationEnabled ?? true;
  }
}