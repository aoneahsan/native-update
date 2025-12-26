import { Logger } from './logger';

export interface UpdateEvent {
  type: 'check' | 'download' | 'install' | 'error' | 'rollback';
  version?: string;
  success: boolean;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsProvider {
  trackEvent(event: UpdateEvent): Promise<void>;
  trackError(error: Error, context?: Record<string, unknown>): Promise<void>;
  setUserId(userId: string): void;
  setProperties(properties: Record<string, unknown>): void;
}

export class Analytics {
  private static instance: Analytics;
  private providers: AnalyticsProvider[] = [];
  private readonly logger: Logger;
  private userId?: string;
  private properties: Record<string, unknown> = {};

  private constructor() {
    this.logger = Logger.getInstance();
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /**
   * Add an analytics provider
   */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);

    // Set existing user ID and properties
    if (this.userId) {
      provider.setUserId(this.userId);
    }
    if (Object.keys(this.properties).length > 0) {
      provider.setProperties(this.properties);
    }
  }

  /**
   * Track an update event
   */
  async trackEvent(event: UpdateEvent): Promise<void> {
    this.logger.debug('Analytics event', event);

    const promises = this.providers.map((provider) =>
      provider
        .trackEvent(event)
        .catch((error) => this.logger.error('Analytics provider error', error))
    );

    await Promise.all(promises);
  }

  /**
   * Track an error
   */
  async trackError(error: Error, context?: Record<string, unknown>): Promise<void> {
    this.logger.error('Analytics error', { error, context });

    const promises = this.providers.map((provider) =>
      provider
        .trackError(error, context)
        .catch((err) => this.logger.error('Analytics provider error', err))
    );

    await Promise.all(promises);
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.providers.forEach((provider) => provider.setUserId(userId));
  }

  /**
   * Set global properties
   */
  setProperties(properties: Record<string, unknown>): void {
    this.properties = { ...this.properties, ...properties };
    this.providers.forEach((provider) =>
      provider.setProperties(this.properties)
    );
  }

  /**
   * Track update check
   */
  async trackUpdateCheck(available: boolean, version?: string): Promise<void> {
    const startTime = Date.now();

    await this.trackEvent({
      type: 'check',
      version,
      success: true,
      metadata: { updateAvailable: available },
      duration: Date.now() - startTime,
    });
  }

  /**
   * Track download progress
   */
  async trackDownload(
    version: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.trackEvent({
      type: 'download',
      version,
      success,
      error,
    });
  }

  /**
   * Track installation
   */
  async trackInstall(
    version: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.trackEvent({
      type: 'install',
      version,
      success,
      error,
    });
  }

  /**
   * Track rollback
   */
  async trackRollback(
    fromVersion: string,
    toVersion: string,
    reason: string
  ): Promise<void> {
    await this.trackEvent({
      type: 'rollback',
      success: true,
      metadata: {
        fromVersion,
        toVersion,
        reason,
      },
    });
  }
}

/**
 * Console analytics provider for development
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  private userId?: string;
  private properties: Record<string, unknown> = {};

  async trackEvent(event: UpdateEvent): Promise<void> {
    console.log('[Analytics]', event.type, {
      ...event,
      userId: this.userId,
      properties: this.properties,
    });
  }

  async trackError(error: Error, context?: Record<string, unknown>): Promise<void> {
    console.error('[Analytics Error]', {
      error: error.message,
      stack: error.stack,
      context,
      userId: this.userId,
      properties: this.properties,
    });
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setProperties(properties: Record<string, unknown>): void {
    this.properties = { ...this.properties, ...properties };
  }
}
