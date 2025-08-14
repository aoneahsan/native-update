export interface ReviewRequestResult {
  displayed: boolean;
  reason?: string;
  platform: string;
  lastRequestDate?: number;
  requestCount?: number;
}

export interface ReviewAvailability {
  canRequest: boolean;
  reason?: string;
  lastRequestDate?: number;
  requestCount?: number;
  daysUntilNext?: number;
}

export interface ReviewConditions {
  minimumDaysSinceInstall?: number;
  minimumDaysSinceLastPrompt?: number;
  minimumAppLaunches?: number;
  minimumSignificantEvents?: number;
  requirePositiveEvents?: boolean;
  maxPromptsPerVersion?: number;
  customConditions?: Record<string, any>;
}

export interface StoreReviewUrl {
  url: string;
  platform: 'ios' | 'android' | 'web';
}

export interface ReviewRequestOptions {
  force?: boolean; // Bypass rate limiting (testing only)
  useCustomUI?: boolean;
  customMessage?: string;
}

export interface ReviewMetrics {
  totalRequests: number;
  successfulDisplays: number;
  lastRequestDate?: Date;
  requestsByVersion: Record<string, number>;
  significantEvents: string[];
  appLaunches: number;
  installDate: Date;
}
