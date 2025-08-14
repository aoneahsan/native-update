import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { ReviewConditionsChecker } from './review-conditions-checker';
import { ReviewRateLimiter } from './review-rate-limiter';
import { PlatformReviewHandler } from './platform-review-handler';
import {
  ReviewConditions,
  StoreReviewUrl,
  ReviewRequestOptions
} from './types';
import { AppReviewPlugin, ReviewResult, CanRequestReviewResult } from '../definitions';
import { PluginListenerHandle } from '@capacitor/core';

export class AppReviewManager implements AppReviewPlugin {
  private config: PluginConfig;
  private logger: Logger;
  private conditionsChecker: ReviewConditionsChecker;
  private rateLimiter: ReviewRateLimiter;
  private platformHandler: PlatformReviewHandler;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('AppReviewManager');
    this.conditionsChecker = new ReviewConditionsChecker(config);
    this.rateLimiter = new ReviewRateLimiter(config);
    this.platformHandler = new PlatformReviewHandler(config);
  }

  async requestReview(options?: ReviewRequestOptions): Promise<ReviewResult> {
    try {
      this.logger.log('Requesting app review', options);
      
      // Check if we can request review (unless forced)
      if (!options?.force) {
        const availability = await this.canRequestReview();
        if (!availability.canRequest) {
          return {
            displayed: false,
            reason: availability.reason || 'Rate limiting active',
          };
        }
      }
      
      // Request review based on platform
      const result = await this.platformHandler.requestReview(options);
      
      // Update rate limiting data
      if (result.displayed) {
        await this.rateLimiter.recordRequest();
        
        // Emit event
        this.emit('reviewPromptDisplayed', {
          platform: this.platformHandler.getPlatform(),
          method: options?.useCustomUI ? 'custom' : 'in-app',
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to request review', error);
      throw error;
    }
  }

  async canRequestReview(): Promise<CanRequestReviewResult> {
    try {
      this.logger.log('Checking review availability');
      
      // Check rate limits
      const rateLimitCheck = await this.rateLimiter.canRequestReview();
      if (!rateLimitCheck.canRequest) {
        return rateLimitCheck;
      }
      
      // Check conditions
      const conditionsCheck = await this.conditionsChecker.checkConditions();
      if (!conditionsCheck.canRequest) {
        return conditionsCheck;
      }
      
      // Check platform availability
      const platformCheck = await this.platformHandler.isReviewAvailable();
      if (!platformCheck) {
        return {
          canRequest: false,
          reason: 'Review not available on this platform'
        };
      }
      
      return {
        canRequest: true,
      };
    } catch (error) {
      this.logger.error('Failed to check review availability', error);
      return {
        canRequest: false,
        reason: 'Error checking availability'
      };
    }
  }

  async openStoreReview(): Promise<void> {
    try {
      this.logger.log('Opening store review page');
      const storeUrl = await this.getStoreReviewUrl();
      await this.platformHandler.openUrl(storeUrl.url);
      
      // Emit event
      this.emit('reviewPromptDisplayed', {
        platform: storeUrl.platform,
        method: 'store-redirect',
        timestamp: Date.now()
      });
    } catch (error) {
      this.logger.error('Failed to open store review', error);
      throw error;
    }
  }

  private async getStoreReviewUrl(): Promise<StoreReviewUrl> {
    try {
      this.logger.log('Getting store review URL');
      return await this.platformHandler.getStoreReviewUrl();
    } catch (error) {
      this.logger.error('Failed to get store review URL', error);
      throw error;
    }
  }

  async resetReviewPrompts(): Promise<void> {
    try {
      this.logger.log('Resetting review prompts');
      await this.rateLimiter.reset();
      await this.conditionsChecker.reset();
    } catch (error) {
      this.logger.error('Failed to reset review prompts', error);
      throw error;
    }
  }

  async setReviewConditions(conditions: ReviewConditions): Promise<void> {
    try {
      this.logger.log('Setting review conditions', conditions);
      await this.conditionsChecker.setConditions(conditions);
    } catch (error) {
      this.logger.error('Failed to set review conditions', error);
      throw error;
    }
  }

  async trackSignificantEvent(eventName: string): Promise<void> {
    try {
      this.logger.log('Tracking significant event', eventName);
      await this.conditionsChecker.trackEvent(eventName);
      
      // Check if we should prompt for review after this event
      if (this.config.promptAfterPositiveEvents) {
        const canRequest = await this.canRequestReview();
        if (canRequest.canRequest) {
          // Delay the prompt slightly for better UX
          setTimeout(() => {
            this.requestReview();
          }, 2000);
        }
      }
    } catch (error) {
      this.logger.error('Failed to track significant event', error);
      throw error;
    }
  }

  async getReviewMetrics(): Promise<any> {
    try {
      this.logger.log('Getting review metrics');
      const metrics = await this.rateLimiter.getMetrics();
      const conditions = await this.conditionsChecker.getStatus();
      
      return {
        ...metrics,
        ...conditions
      };
    } catch (error) {
      this.logger.error('Failed to get review metrics', error);
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
}