import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { StoreReviewUrl, ReviewRequestOptions } from './types';
import { ReviewResult } from '../definitions';
import { Capacitor } from '@capacitor/core';

export class PlatformReviewHandler {
  private config: PluginConfig;
  private logger: Logger;
  private platform: string;

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('PlatformReviewHandler');
    this.platform = Capacitor.getPlatform();
  }

  async requestReview(options?: ReviewRequestOptions): Promise<ReviewResult> {
    this.logger.log('Requesting review on platform', this.platform);

    // Check if custom UI is requested
    if (options?.useCustomUI) {
      return this.showCustomReviewPrompt(options);
    }

    // Platform-specific in-app review
    if (this.platform === 'ios') {
      return this.requestIOSReview();
    } else if (this.platform === 'android') {
      return this.requestAndroidReview();
    } else {
      return this.requestWebReview(options);
    }
  }

  async isReviewAvailable(): Promise<boolean> {
    // Check if in-app review is available on this platform
    if (this.platform === 'ios') {
      // iOS 10.3+ supports in-app reviews
      return this.isIOSVersionSupported();
    } else if (this.platform === 'android') {
      // Android with Play Core supports in-app reviews
      return true;
    } else {
      // Web can show custom prompts
      return true;
    }
  }

  async getStoreReviewUrl(): Promise<StoreReviewUrl> {
    const platform = this.platform;
    let url = '';

    if (platform === 'ios') {
      const appStoreId = this.config.appStoreId || this.config.iosAppId;
      if (!appStoreId) {
        throw new Error('App Store ID not configured');
      }
      // Deep link to review page
      url = `https://apps.apple.com/app/id${appStoreId}?action=write-review`;
    } else if (platform === 'android') {
      const packageName = this.config.packageName;
      if (!packageName) {
        throw new Error('Package name not configured');
      }
      // Deep link to Play Store review
      url = `https://play.google.com/store/apps/details?id=${packageName}&showAllReviews=true`;
    } else {
      // Web fallback URL
      url = this.config.webReviewUrl || window.location.origin + '/review';
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

  getPlatform(): string {
    return this.platform;
  }

  private async requestIOSReview(): Promise<ReviewResult> {
    // This would be handled by native iOS implementation using StoreKit
    // For web simulation:
    if (this.platform === 'web') {
      return this.simulateReviewRequest('ios');
    }

    // Native implementation would call SKStoreReviewController.requestReview()
    return {
      displayed: true,
    };
  }

  private async requestAndroidReview(): Promise<ReviewResult> {
    // This would be handled by native Android implementation using Play Core
    // For web simulation:
    if (this.platform === 'web') {
      return this.simulateReviewRequest('android');
    }

    // Native implementation would use ReviewManager from Play Core
    return {
      displayed: true,
    };
  }

  private async requestWebReview(
    options?: ReviewRequestOptions
  ): Promise<ReviewResult> {
    // For web, show a custom prompt
    return this.showCustomReviewPrompt(options);
  }

  private async showCustomReviewPrompt(
    options?: ReviewRequestOptions
  ): Promise<ReviewResult> {
    const message = options?.customMessage || 'Would you like to rate our app?';

    // Create a simple modal for web
    if (typeof window !== 'undefined' && window.confirm) {
      const result = window.confirm(message);

      if (result) {
        // User agreed, open store
        const storeUrl = await this.getStoreReviewUrl();
        await this.openUrl(storeUrl.url);
      }

      return {
        displayed: true,
      };
    }

    return {
      displayed: false,
      reason: 'Custom UI not available',
    };
  }

  private simulateReviewRequest(platform: string): ReviewResult {
    // Simulate native behavior for testing
    this.logger.log(`Simulating ${platform} review request`);

    // Simulate that the prompt was shown
    return {
      displayed: true,
    };
  }

  private isIOSVersionSupported(): boolean {
    if (this.platform !== 'ios') return false;

    // Check iOS version (10.3+ required for SKStoreReviewController)
    // This would be checked in native code
    return true;
  }
}
