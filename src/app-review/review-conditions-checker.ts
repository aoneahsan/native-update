import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { ReviewConditions } from './types';
import { CanRequestReviewResult } from '../definitions';

interface StoredConditionsData {
  installDate: number;
  appLaunches: number;
  significantEvents: string[];
  lastVersion: string;
  conditions: ReviewConditions;
}

export class ReviewConditionsChecker {
  private config: PluginConfig;
  private logger: Logger;
  private storageKey = 'cap_review_conditions';
  private defaultConditions: ReviewConditions = {
    minimumDaysSinceInstall: 3,
    minimumDaysSinceLastPrompt: 90,
    minimumAppLaunches: 5,
    minimumSignificantEvents: 3,
    requirePositiveEvents: true,
    maxPromptsPerVersion: 1
  };

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('ReviewConditionsChecker');
    this.initialize();
  }

  async checkConditions(): Promise<CanRequestReviewResult> {
    const data = await this.getStoredData();
    const conditions = data.conditions;
    
    // Check days since install
    const daysSinceInstall = this.getDaysSince(data.installDate);
    if (daysSinceInstall < (conditions.minimumDaysSinceInstall || 0)) {
      return {
        canRequest: false,
        reason: `Only ${daysSinceInstall} days since install, need ${conditions.minimumDaysSinceInstall}`
      };
    }
    
    // Check app launches
    if (data.appLaunches < (conditions.minimumAppLaunches || 0)) {
      return {
        canRequest: false,
        reason: `Only ${data.appLaunches} app launches, need ${conditions.minimumAppLaunches}`
      };
    }
    
    // Check significant events
    if (conditions.requirePositiveEvents && 
        data.significantEvents.length < (conditions.minimumSignificantEvents || 0)) {
      return {
        canRequest: false,
        reason: `Only ${data.significantEvents.length} significant events, need ${conditions.minimumSignificantEvents}`
      };
    }
    
    // Check custom conditions
    if (conditions.customConditions) {
      for (const [key, value] of Object.entries(conditions.customConditions)) {
        if (!this.evaluateCustomCondition(key, value)) {
          return {
            canRequest: false,
            reason: `Custom condition '${key}' not met`
          };
        }
      }
    }
    
    return { canRequest: true };
  }

  async setConditions(conditions: ReviewConditions): Promise<void> {
    const data = await this.getStoredData();
    data.conditions = { ...this.defaultConditions, ...conditions };
    await this.saveStoredData(data);
  }

  async trackEvent(eventName: string): Promise<void> {
    const data = await this.getStoredData();
    
    // Add to significant events if not already tracked
    if (!data.significantEvents.includes(eventName)) {
      data.significantEvents.push(eventName);
      await this.saveStoredData(data);
      this.logger.log('Tracked significant event', eventName);
    }
  }

  async trackAppLaunch(): Promise<void> {
    const data = await this.getStoredData();
    data.appLaunches++;
    await this.saveStoredData(data);
    this.logger.log('Tracked app launch', data.appLaunches);
  }

  async reset(): Promise<void> {
    const data = await this.getStoredData();
    data.significantEvents = [];
    data.appLaunches = 0;
    await this.saveStoredData(data);
  }

  async getStatus(): Promise<any> {
    const data = await this.getStoredData();
    return {
      installDate: new Date(data.installDate),
      daysSinceInstall: this.getDaysSince(data.installDate),
      appLaunches: data.appLaunches,
      significantEvents: data.significantEvents,
      currentVersion: await this.getCurrentVersion(),
      conditions: data.conditions
    };
  }

  private async initialize(): Promise<void> {
    const data = await this.getStoredData();
    
    // Check if app version changed
    const currentVersion = await this.getCurrentVersion();
    if (data.lastVersion !== currentVersion) {
      data.lastVersion = currentVersion;
      // Optionally reset some counters on version change
      await this.saveStoredData(data);
    }
    
    // Track app launch
    await this.trackAppLaunch();
  }

  private async getStoredData(): Promise<StoredConditionsData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      this.logger.error('Failed to read stored conditions', error);
    }
    
    // Return default data
    return {
      installDate: Date.now(),
      appLaunches: 0,
      significantEvents: [],
      lastVersion: await this.getCurrentVersion(),
      conditions: this.defaultConditions
    };
  }

  private async saveStoredData(data: StoredConditionsData): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      this.logger.error('Failed to save conditions data', error);
    }
  }

  private getDaysSince(timestamp: number): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - timestamp) / msPerDay);
  }

  private async getCurrentVersion(): Promise<string> {
    // This would be provided by the platform
    return '1.0.0';
  }

  private evaluateCustomCondition(key: string, value: any): boolean {
    // Implement custom condition evaluation logic
    // This can be extended based on specific needs
    switch (key) {
      case 'isPremiumUser':
        return this.config.isPremiumUser === value;
      case 'hasCompletedTutorial':
        return localStorage.getItem('tutorial_completed') === 'true';
      case 'hasMadePurchase':
        return localStorage.getItem('has_purchased') === 'true';
      default:
        return true;
    }
  }
}