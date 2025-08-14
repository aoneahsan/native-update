import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { ReviewMetrics } from './types';
import { CanRequestReviewResult } from '../definitions';

interface RateLimitData {
  totalRequests: number;
  lastRequestDate?: number;
  requestsByVersion: Record<string, number>;
  requestsByYear: Record<string, number>;
  successfulDisplays: number;
}

export class ReviewRateLimiter {
  private config: PluginConfig;
  private logger: Logger;
  private storageKey = 'cap_review_rate_limit';

  // Platform-specific limits
  private readonly IOS_MAX_PROMPTS_PER_YEAR = 3;
  private readonly ANDROID_MIN_DAYS_BETWEEN = 30; // Recommended
  private readonly DEFAULT_MIN_DAYS_BETWEEN = 90;

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('ReviewRateLimiter');
  }

  async canRequestReview(): Promise<CanRequestReviewResult> {
    const data = await this.getRateLimitData();
    const platform = this.getPlatform();

    // Check last request date
    if (data.lastRequestDate) {
      const daysSinceLastRequest = this.getDaysSince(data.lastRequestDate);
      const minDays = this.getMinDaysBetweenPrompts(platform);

      if (daysSinceLastRequest < minDays) {
        return {
          canRequest: false,
          reason: `Only ${daysSinceLastRequest} days since last prompt, need ${minDays}`,
        };
      }
    }

    // iOS-specific: Check yearly limit
    if (platform === 'ios') {
      const currentYear = new Date().getFullYear().toString();
      const requestsThisYear = data.requestsByYear[currentYear] || 0;

      if (requestsThisYear >= this.IOS_MAX_PROMPTS_PER_YEAR) {
        return {
          canRequest: false,
          reason: `iOS limit reached: ${requestsThisYear}/${this.IOS_MAX_PROMPTS_PER_YEAR} prompts this year`,
        };
      }
    }

    // Check version-specific limits
    const currentVersion = await this.getCurrentVersion();
    const requestsThisVersion = data.requestsByVersion[currentVersion] || 0;
    const maxPerVersion = this.config.maxPromptsPerVersion || 1;

    if (requestsThisVersion >= maxPerVersion) {
      return {
        canRequest: false,
        reason: `Version limit reached: ${requestsThisVersion}/${maxPerVersion} prompts for v${currentVersion}`,
      };
    }

    return {
      canRequest: true,
    };
  }

  async recordRequest(wasDisplayed: boolean = true): Promise<void> {
    const data = await this.getRateLimitData();
    const currentVersion = await this.getCurrentVersion();
    const currentYear = new Date().getFullYear().toString();

    // Update counters
    data.totalRequests++;
    data.lastRequestDate = Date.now();

    if (wasDisplayed) {
      data.successfulDisplays++;
    }

    // Update version-specific count
    if (!data.requestsByVersion[currentVersion]) {
      data.requestsByVersion[currentVersion] = 0;
    }
    data.requestsByVersion[currentVersion]++;

    // Update year-specific count (for iOS)
    if (!data.requestsByYear[currentYear]) {
      data.requestsByYear[currentYear] = 0;
    }
    data.requestsByYear[currentYear]++;

    await this.saveRateLimitData(data);
    this.logger.log('Recorded review request', {
      total: data.totalRequests,
      version: currentVersion,
      year: currentYear,
    });
  }

  async reset(): Promise<void> {
    await this.saveRateLimitData({
      totalRequests: 0,
      successfulDisplays: 0,
      requestsByVersion: {},
      requestsByYear: {},
    });
  }

  async getMetrics(): Promise<ReviewMetrics> {
    const data = await this.getRateLimitData();
    const installDate = await this.getInstallDate();

    return {
      totalRequests: data.totalRequests,
      successfulDisplays: data.successfulDisplays,
      lastRequestDate: data.lastRequestDate
        ? new Date(data.lastRequestDate)
        : undefined,
      requestsByVersion: data.requestsByVersion,
      significantEvents: [], // This would come from conditions checker
      appLaunches: 0, // This would come from conditions checker
      installDate: new Date(installDate),
    };
  }

  private async getRateLimitData(): Promise<RateLimitData> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      this.logger.error('Failed to read rate limit data', error);
    }

    return {
      totalRequests: 0,
      successfulDisplays: 0,
      requestsByVersion: {},
      requestsByYear: {},
    };
  }

  private async saveRateLimitData(data: RateLimitData): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      this.logger.error('Failed to save rate limit data', error);
    }
  }

  private getDaysSince(timestamp: number): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((Date.now() - timestamp) / msPerDay);
  }

  private getMinDaysBetweenPrompts(platform: string): number {
    if (platform === 'android') {
      return (
        this.config.minimumDaysSinceLastPrompt || this.ANDROID_MIN_DAYS_BETWEEN
      );
    }
    return (
      this.config.minimumDaysSinceLastPrompt || this.DEFAULT_MIN_DAYS_BETWEEN
    );
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      if (/android/i.test(userAgent)) {
        return 'android';
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        return 'ios';
      }
    }
    return 'web';
  }

  private async getCurrentVersion(): Promise<string> {
    // This would be provided by the platform
    return '1.0.0';
  }

  private async getInstallDate(): Promise<number> {
    // This would be stored on first app launch
    const installKey = 'cap_app_install_date';
    const stored = localStorage.getItem(installKey);
    if (stored) {
      return parseInt(stored, 10);
    }

    const now = Date.now();
    localStorage.setItem(installKey, now.toString());
    return now;
  }
}
