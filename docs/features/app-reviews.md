# App Reviews

The App Reviews feature provides intelligent in-app review prompts that help you gather user feedback without interrupting the user experience. It integrates with native store review systems and includes smart timing algorithms to maximize positive reviews.

## Overview

App reviews are crucial for app store visibility and user trust. This feature helps you:
- Request reviews at optimal moments
- Avoid review fatigue and spam
- Comply with platform guidelines
- Maximize positive review rates

## Platform Integration

### iOS - StoreKit
- Uses `SKStoreReviewController` for native review prompts
- Automatically handles App Store guidelines
- No user redirection required

### Android - Play Core
- Uses Google Play Core Library for in-app reviews
- Seamless integration with Play Store
- Follows Google Play policies

### Web - Fallback
- Custom review prompts
- Redirects to appropriate stores
- Graceful degradation

## Key Features

### 🎯 Smart Timing
- Analyzes user behavior patterns
- Triggers after positive interactions
- Respects platform limitations

### 📊 Review Intelligence
- Tracks review history
- Prevents over-prompting
- Optimizes timing based on user segments

### 🔧 Customizable Rules
- Flexible triggering conditions
- Custom event tracking
- A/B testing support

### 🚀 Platform Compliance
- Follows App Store guidelines
- Respects Play Store policies
- Handles platform restrictions

## Implementation Guide

### Basic Implementation

```typescript
// Configure app reviews
await CapacitorNativeUpdate.configure({
  appReview: {
    minimumDaysSinceInstall: 7,
    minimumDaysSinceLastPrompt: 60,
    minimumLaunchCount: 3
  }
});

// Request review at appropriate moment
async function requestReview() {
  try {
    // Check if we can request a review
    const canRequest = await CapacitorNativeUpdate.AppReview.canRequestReview();
    
    if (canRequest.allowed) {
      // Request the review
      const result = await CapacitorNativeUpdate.AppReview.requestReview();
      
      if (result.shown) {
        console.log('Review dialog was shown');
      } else {
        console.log('Review dialog not shown:', result.reason);
      }
    } else {
      console.log('Cannot request review:', canRequest.reason);
    }
  } catch (error) {
    console.error('Review request failed:', error);
  }
}
```

### Advanced Implementation

```typescript
class AppReviewManager {
  private userEvents: Map<string, number> = new Map();
  private positiveActions: string[] = [];
  
  async initialize() {
    // Configure with advanced settings
    await CapacitorNativeUpdate.configure({
      appReview: {
        minimumDaysSinceInstall: 14,
        minimumDaysSinceLastPrompt: 90,
        minimumLaunchCount: 5,
        minimumSignificantEvents: 3,
        customTriggers: [
          'purchase_completed',
          'level_completed',
          'task_finished',
          'positive_feedback'
        ],
        requirePositiveEvents: true,
        maxPromptsPerVersion: 1
      }
    });
    
    // Set up event tracking
    this.setupEventTracking();
  }
  
  private setupEventTracking() {
    // Track app launches
    this.trackEvent('app_launch');
    
    // Track positive user actions
    this.trackPositiveAction('app_opened');
  }
  
  // Track custom events
  trackEvent(eventName: string) {
    const count = this.userEvents.get(eventName) || 0;
    this.userEvents.set(eventName, count + 1);
    
    // Check if this event should trigger review
    this.checkReviewTrigger(eventName);
  }
  
  // Track positive user actions
  trackPositiveAction(action: string) {
    this.positiveActions.push(action);
    this.trackEvent(action);
  }
  
  private async checkReviewTrigger(eventName: string) {
    // Check if this event is a review trigger
    const triggers = [
      'purchase_completed',
      'level_completed',
      'task_finished',
      'positive_feedback'
    ];
    
    if (triggers.includes(eventName)) {
      // Add delay to avoid interrupting user flow
      setTimeout(() => {
        this.considerReviewRequest();
      }, 2000);
    }
  }
  
  private async considerReviewRequest() {
    try {
      // Check if review is appropriate
      const analysis = await this.analyzeReviewReadiness();
      
      if (analysis.shouldRequest) {
        await this.requestReview();
      } else {
        console.log('Review not requested:', analysis.reason);
      }
    } catch (error) {
      console.error('Review analysis failed:', error);
    }
  }
  
  private async analyzeReviewReadiness() {
    // Check basic eligibility
    const canRequest = await CapacitorNativeUpdate.AppReview.canRequestReview();
    
    if (!canRequest.allowed) {
      return {
        shouldRequest: false,
        reason: canRequest.reason
      };
    }
    
    // Check user sentiment
    const sentiment = this.analyzeUserSentiment();
    
    if (sentiment.score < 0.7) {
      return {
        shouldRequest: false,
        reason: 'User sentiment too low'
      };
    }
    
    // Check recent app usage
    const usage = await this.analyzeAppUsage();
    
    if (!usage.isActive) {
      return {
        shouldRequest: false,
        reason: 'User not actively using app'
      };
    }
    
    return {
      shouldRequest: true,
      reason: 'All conditions met'
    };
  }
  
  private analyzeUserSentiment() {
    // Simple sentiment analysis based on actions
    const positiveWeight = this.positiveActions.length * 0.3;
    const negativeWeight = this.getNegativeActions().length * 0.7;
    
    const score = Math.max(0, Math.min(1, positiveWeight - negativeWeight));
    
    return {
      score,
      confidence: Math.min(1, this.positiveActions.length / 10)
    };
  }
  
  private async analyzeAppUsage() {
    const launchCount = this.userEvents.get('app_launch') || 0;
    const sessionDuration = await this.getAverageSessionDuration();
    
    return {
      isActive: launchCount >= 5 && sessionDuration > 120000, // 2 minutes
      engagement: Math.min(1, launchCount / 20),
      retention: await this.calculateRetention()
    };
  }
  
  async requestReview() {
    try {
      const result = await CapacitorNativeUpdate.AppReview.requestReview();
      
      // Track the request
      this.trackReviewRequest(result);
      
      if (result.shown) {
        // Review dialog was shown
        console.log('Review prompt shown successfully');
        
        // Optional: Show thank you message
        setTimeout(() => {
          this.showThankYouMessage();
        }, 5000);
      }
      
      return result;
    } catch (error) {
      console.error('Review request failed:', error);
      throw error;
    }
  }
  
  private trackReviewRequest(result: ReviewResult) {
    // Track analytics
    this.trackEvent('review_requested');
    
    if (result.shown) {
      this.trackEvent('review_shown');
    }
    
    // Log for debugging
    console.log('Review request result:', result);
  }
}
```

## Smart Timing Strategies

### Optimal Moments

```typescript
class ReviewTimingOptimizer {
  // After successful task completion
  async onTaskCompleted(taskType: string) {
    const isPositive = await this.isPositiveTask(taskType);
    
    if (isPositive) {
      // Wait for user to feel satisfaction
      setTimeout(() => {
        this.considerReview('task_completion');
      }, 1500);
    }
  }
  
  // After positive app interaction
  async onPositiveInteraction(interaction: string) {
    const interactions = [
      'feature_liked',
      'content_shared',
      'positive_rating_given',
      'upgrade_purchased'
    ];
    
    if (interactions.includes(interaction)) {
      this.considerReview('positive_interaction');
    }
  }
  
  // After user shows engagement
  async onEngagementMilestone(milestone: string) {
    const milestones = {
      'daily_streak_7': 0.8,
      'goals_completed_10': 0.9,
      'features_explored_5': 0.7,
      'time_spent_milestone': 0.6
    };
    
    const probability = milestones[milestone];
    
    if (probability && Math.random() < probability) {
      this.considerReview('engagement_milestone');
    }
  }
  
  private async considerReview(trigger: string) {
    // Analyze context
    const context = await this.analyzeContext();
    
    if (context.appropriate) {
      // Small delay to avoid interrupting user flow
      setTimeout(() => {
        this.requestReview();
      }, 2000);
    }
  }
  
  private async analyzeContext() {
    // Check if user is in a good state
    const checks = [
      this.isUserInGoodMood(),
      this.isAppPerformingWell(),
      this.isFeatureWorkingCorrectly(),
      this.hasUserTimeForReview()
    ];
    
    const results = await Promise.all(checks);
    
    return {
      appropriate: results.every(check => check),
      confidence: results.filter(check => check).length / results.length
    };
  }
}
```

### Avoiding Review Fatigue

```typescript
class ReviewFatigueManager {
  private reviewHistory: ReviewAttempt[] = [];
  
  async canRequestReview(): Promise<boolean> {
    // Check platform limits
    const platformCheck = await CapacitorNativeUpdate.AppReview.canRequestReview();
    
    if (!platformCheck.allowed) {
      return false;
    }
    
    // Check our custom rules
    const customChecks = [
      this.checkFrequencyLimit(),
      this.checkUserResponseHistory(),
      this.checkAppVersionHistory(),
      this.checkUserSegment()
    ];
    
    return customChecks.every(check => check);
  }
  
  private checkFrequencyLimit(): boolean {
    const lastRequest = this.getLastReviewRequest();
    
    if (!lastRequest) return true;
    
    const daysSinceLastRequest = this.daysSince(lastRequest.timestamp);
    const minimumDays = this.getMinimumDaysBetweenRequests();
    
    return daysSinceLastRequest >= minimumDays;
  }
  
  private checkUserResponseHistory(): boolean {
    const recentResponses = this.reviewHistory
      .filter(attempt => this.daysSince(attempt.timestamp) <= 180)
      .map(attempt => attempt.response);
    
    // If user dismissed last 2 requests, wait longer
    const recentDismissals = recentResponses.filter(r => r === 'dismissed').length;
    
    return recentDismissals < 2;
  }
  
  private getMinimumDaysBetweenRequests(): number {
    const baseMinimum = 60; // 60 days base
    const dismissalPenalty = this.getDismissalPenalty();
    
    return baseMinimum + dismissalPenalty;
  }
  
  private getDismissalPenalty(): number {
    // Increase delay for users who dismiss frequently
    const dismissals = this.reviewHistory.filter(r => r.response === 'dismissed').length;
    return Math.min(dismissals * 30, 180); // Max 180 days penalty
  }
}
```

## Custom Review Triggers

### Event-Based Triggers

```typescript
class CustomReviewTriggers {
  private triggerEvents: Map<string, TriggerConfig> = new Map();
  
  setupCustomTriggers() {
    // E-commerce triggers
    this.triggerEvents.set('purchase_completed', {
      weight: 0.9,
      delay: 3000,
      conditions: ['payment_successful', 'no_recent_issues']
    });
    
    // Gaming triggers
    this.triggerEvents.set('level_completed', {
      weight: 0.7,
      delay: 2000,
      conditions: ['level_difficulty_high', 'no_deaths']
    });
    
    // Productivity triggers
    this.triggerEvents.set('goal_achieved', {
      weight: 0.8,
      delay: 1500,
      conditions: ['streak_active', 'feature_used_recently']
    });
    
    // Social triggers
    this.triggerEvents.set('content_shared', {
      weight: 0.6,
      delay: 5000,
      conditions: ['sharing_successful', 'positive_engagement']
    });
  }
  
  async handleTriggerEvent(eventName: string, metadata: any) {
    const config = this.triggerEvents.get(eventName);
    
    if (!config) return;
    
    // Check conditions
    const conditionsMet = await this.checkConditions(config.conditions, metadata);
    
    if (!conditionsMet) {
      console.log(`Conditions not met for trigger: ${eventName}`);
      return;
    }
    
    // Apply probability
    if (Math.random() > config.weight) {
      console.log(`Probability check failed for trigger: ${eventName}`);
      return;
    }
    
    // Add delay
    setTimeout(() => {
      this.requestReview(`trigger_${eventName}`);
    }, config.delay);
  }
  
  private async checkConditions(conditions: string[], metadata: any): Promise<boolean> {
    const conditionChecks = {
      'payment_successful': () => metadata.paymentStatus === 'success',
      'no_recent_issues': () => !this.hasRecentIssues(),
      'level_difficulty_high': () => metadata.difficulty >= 3,
      'no_deaths': () => metadata.deaths === 0,
      'streak_active': () => this.getUserStreak() > 0,
      'feature_used_recently': () => this.wasFeatureUsedRecently(),
      'sharing_successful': () => metadata.shareResult === 'success',
      'positive_engagement': () => metadata.likes > 0
    };
    
    return conditions.every(condition => {
      const check = conditionChecks[condition];
      return check ? check() : false;
    });
  }
}
```

### Behavioral Triggers

```typescript
class BehavioralTriggers {
  private behaviorTracker = new Map<string, number>();
  
  // Track user behavior patterns
  trackBehavior(behavior: string, value: number = 1) {
    const current = this.behaviorTracker.get(behavior) || 0;
    this.behaviorTracker.set(behavior, current + value);
    
    this.checkBehavioralTriggers(behavior);
  }
  
  private checkBehavioralTriggers(behavior: string) {
    const triggers = {
      'app_launches': {
        threshold: 10,
        probability: 0.3
      },
      'feature_usage': {
        threshold: 15,
        probability: 0.6
      },
      'session_duration': {
        threshold: 1800, // 30 minutes
        probability: 0.8
      },
      'content_created': {
        threshold: 5,
        probability: 0.9
      }
    };
    
    const config = triggers[behavior];
    if (!config) return;
    
    const currentValue = this.behaviorTracker.get(behavior) || 0;
    
    if (currentValue >= config.threshold && Math.random() < config.probability) {
      this.requestReview(`behavioral_${behavior}`);
    }
  }
  
  // Advanced behavioral analysis
  async analyzeBehavioralPatterns() {
    const patterns = {
      engagement: this.calculateEngagementScore(),
      retention: await this.calculateRetentionRate(),
      satisfaction: this.calculateSatisfactionScore(),
      growth: this.calculateGrowthMetrics()
    };
    
    // Determine if user is in a good state for review
    const overallScore = (
      patterns.engagement * 0.3 +
      patterns.retention * 0.2 +
      patterns.satisfaction * 0.4 +
      patterns.growth * 0.1
    );
    
    return {
      score: overallScore,
      recommendReview: overallScore > 0.7,
      patterns
    };
  }
}
```

## Platform-Specific Implementation

### iOS StoreKit Integration

```typescript
// iOS-specific review handling
class iOSReviewManager {
  async requestReview(): Promise<ReviewResult> {
    try {
      // Use StoreKit review controller
      const result = await CapacitorNativeUpdate.AppReview.requestReview();
      
      // iOS handles everything natively
      return {
        shown: result.shown,
        platform: 'ios',
        method: 'storekit'
      };
    } catch (error) {
      console.error('iOS review request failed:', error);
      
      // Fallback to App Store redirect
      return this.fallbackToAppStore();
    }
  }
  
  private async fallbackToAppStore() {
    // Open App Store page
    await CapacitorNativeUpdate.AppUpdate.openAppStore();
    
    return {
      shown: true,
      platform: 'ios',
      method: 'appstore_redirect'
    };
  }
}
```

### Android Play Core Integration

```typescript
// Android-specific review handling
class AndroidReviewManager {
  async requestReview(): Promise<ReviewResult> {
    try {
      // Use Play Core in-app review
      const result = await CapacitorNativeUpdate.AppReview.requestReview();
      
      return {
        shown: result.shown,
        platform: 'android',
        method: 'play_core'
      };
    } catch (error) {
      console.error('Android review request failed:', error);
      
      // Fallback to Play Store
      return this.fallbackToPlayStore();
    }
  }
  
  private async fallbackToPlayStore() {
    // Open Play Store page
    await CapacitorNativeUpdate.AppUpdate.openAppStore();
    
    return {
      shown: true,
      platform: 'android',
      method: 'playstore_redirect'
    };
  }
}
```

### Web Platform Fallback

```typescript
// Web platform review handling
class WebReviewManager {
  async requestReview(): Promise<ReviewResult> {
    // Show custom review dialog
    const userChoice = await this.showCustomReviewDialog();
    
    if (userChoice === 'review') {
      // Redirect to appropriate store
      this.redirectToStore();
    }
    
    return {
      shown: true,
      platform: 'web',
      method: 'custom_dialog',
      userChoice
    };
  }
  
  private async showCustomReviewDialog() {
    return new Promise((resolve) => {
      // Create custom modal
      const modal = this.createReviewModal();
      
      modal.onChoice = (choice) => {
        modal.close();
        resolve(choice);
      };
      
      modal.show();
    });
  }
  
  private redirectToStore() {
    const platform = this.detectPlatform();
    
    const urls = {
      ios: 'https://apps.apple.com/app/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.myapp',
      web: 'https://myapp.com/feedback'
    };
    
    window.open(urls[platform] || urls.web, '_blank');
  }
}
```

## Analytics and Monitoring

### Review Metrics Tracking

```typescript
class ReviewAnalytics {
  async trackReviewMetrics(event: string, data: any) {
    const metrics = {
      timestamp: Date.now(),
      event,
      ...data,
      userSegment: await this.getUserSegment(),
      appVersion: await this.getAppVersion(),
      platform: this.getPlatform()
    };
    
    // Send to analytics service
    await this.analytics.track('app_review_' + event, metrics);
  }
  
  // Track review funnel
  async trackReviewFunnel(step: string, success: boolean) {
    const funnelData = {
      step,
      success,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };
    
    await this.trackReviewMetrics('funnel_step', funnelData);
  }
  
  // Monitor review performance
  async getReviewPerformance() {
    const metrics = await this.analytics.query({
      events: ['app_review_requested', 'app_review_shown', 'app_review_completed'],
      timeRange: '30d'
    });
    
    return {
      requestRate: metrics.requested / metrics.eligible,
      showRate: metrics.shown / metrics.requested,
      completionRate: metrics.completed / metrics.shown,
      overallConversion: metrics.completed / metrics.eligible
    };
  }
}
```

### A/B Testing Review Strategies

```typescript
class ReviewABTesting {
  private experiments = new Map<string, ABTest>();
  
  async setupReviewExperiment(experimentName: string, variations: ABVariation[]) {
    const experiment = {
      name: experimentName,
      variations,
      allocation: this.allocateUsers(variations),
      metrics: ['show_rate', 'completion_rate', 'user_satisfaction']
    };
    
    this.experiments.set(experimentName, experiment);
  }
  
  async getReviewStrategy(userId: string): Promise<ReviewStrategy> {
    const experiment = this.experiments.get('review_timing');
    
    if (!experiment) {
      return this.getDefaultStrategy();
    }
    
    const variation = this.getUserVariation(userId, experiment);
    
    return {
      timing: variation.timing,
      frequency: variation.frequency,
      triggers: variation.triggers,
      ui: variation.ui
    };
  }
  
  private getUserVariation(userId: string, experiment: ABTest): ABVariation {
    const hash = this.hashUserId(userId);
    const bucket = hash % 100;
    
    let cumulative = 0;
    for (const variation of experiment.variations) {
      cumulative += variation.allocation;
      if (bucket < cumulative) {
        return variation;
      }
    }
    
    return experiment.variations[0]; // Fallback
  }
}
```

## Best Practices

### 1. Respect User Experience

```typescript
// Never interrupt critical user flows
class UserFlowProtection {
  private criticalFlows = [
    'payment_processing',
    'form_submission',
    'content_creation',
    'authentication'
  ];
  
  async isUserInCriticalFlow(): Promise<boolean> {
    const currentFlow = await this.getCurrentUserFlow();
    return this.criticalFlows.includes(currentFlow);
  }
  
  async requestReviewSafely() {
    if (await this.isUserInCriticalFlow()) {
      // Schedule for later
      this.scheduleReviewForLater();
      return;
    }
    
    // Safe to request review
    await this.requestReview();
  }
}
```

### 2. Personalize Review Requests

```typescript
// Tailor review requests to user segments
class PersonalizedReviews {
  async getPersonalizedMessage(user: User): Promise<string> {
    const segment = await this.getUserSegment(user);
    
    const messages = {
      'new_user': "You've been using our app for a week now. How's your experience?",
      'power_user': "You're one of our most active users! Would you mind sharing your thoughts?",
      'premium_user': "As a premium member, your feedback is invaluable to us.",
      'casual_user': "Hope you're enjoying the app! A quick review would help us improve."
    };
    
    return messages[segment] || messages['casual_user'];
  }
}
```

### 3. Handle Edge Cases

```typescript
// Handle various edge cases gracefully
class EdgeCaseHandler {
  async handleReviewRequest() {
    try {
      // Check for edge cases
      if (await this.isAppInBackground()) {
        return { shown: false, reason: 'App in background' };
      }
      
      if (await this.isDeviceInDoNotDisturb()) {
        return { shown: false, reason: 'Do not disturb mode' };
      }
      
      if (await this.isUserInCall()) {
        return { shown: false, reason: 'User in call' };
      }
      
      // Normal review request
      return await this.requestReview();
    } catch (error) {
      console.error('Review request failed:', error);
      return { shown: false, reason: 'Error occurred' };
    }
  }
}
```

## Testing Review Flows

### Development Testing

```typescript
// Enable debug mode for testing
const debugConfig = {
  appReview: {
    debugMode: true, // Bypass all time restrictions
    minimumDaysSinceInstall: 0,
    minimumDaysSinceLastPrompt: 0,
    minimumLaunchCount: 0
  }
};

// Test different scenarios
async function testReviewScenarios() {
  // Test immediate request
  await CapacitorNativeUpdate.AppReview.requestReview();
  
  // Test eligibility check
  const canRequest = await CapacitorNativeUpdate.AppReview.canRequestReview();
  console.log('Can request review:', canRequest);
  
  // Test custom triggers
  await testCustomTriggers();
}
```

### User Testing

```typescript
// A/B test different review strategies
const strategies = [
  {
    name: 'aggressive',
    config: { minimumDaysSinceInstall: 3, minimumLaunchCount: 2 }
  },
  {
    name: 'balanced',
    config: { minimumDaysSinceInstall: 7, minimumLaunchCount: 5 }
  },
  {
    name: 'conservative',
    config: { minimumDaysSinceInstall: 14, minimumLaunchCount: 10 }
  }
];

// Monitor success rates
async function monitorReviewSuccess() {
  const metrics = await analytics.getReviewMetrics();
  
  return {
    showRate: metrics.shown / metrics.requested,
    completionRate: metrics.completed / metrics.shown,
    userSatisfaction: metrics.positiveRatings / metrics.totalRatings
  };
}
```

## Next Steps

- Implement [Security Best Practices](../guides/security-best-practices.md)
- Set up [Analytics Tracking](../examples/analytics-integration.md)
- Configure [Live Updates](./live-updates.md)
- Review [API Reference](../api/app-review-api.md)

---

Made with ❤️ by Ahsan Mahmood