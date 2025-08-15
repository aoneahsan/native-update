# App Review Implementation Guide

This comprehensive guide explains how to implement in-app review functionality in your Capacitor application using the NativeUpdate plugin.

## Table of Contents

- [Overview](#overview)
- [Why In-App Reviews Matter](#why-in-app-reviews-matter)
- [Platform Guidelines](#platform-guidelines)
- [Setup Guide](#setup-guide)
- [Implementation Steps](#implementation-steps)
- [Best Practices](#best-practices)
- [Analytics Integration](#analytics-integration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The App Review feature allows users to rate and review your app without leaving it, significantly improving the likelihood of receiving feedback.

### Key Benefits

- 📈 **Higher Review Rates**: 2-3x more reviews than traditional methods
- 🎯 **Better Timing**: Ask for reviews at optimal moments
- 😊 **Improved UX**: No app switching required
- 📊 **Better Ratings**: Happy users are more likely to rate

### Platform Support

- **Android**: Google Play In-App Review API (Android 5.0+)
- **iOS**: SKStoreReviewController (iOS 10.3+)
- **Web**: Fallback to custom UI or redirect

## Why In-App Reviews Matter

### Statistics

- Apps with 4+ star ratings see **2x more downloads**
- **70% of users** look at ratings before downloading
- In-app review prompts have **4-5x higher engagement** than external links

### Impact on ASO (App Store Optimization)

- Higher ratings improve search ranking
- More reviews increase credibility
- Recent reviews show active development

## Platform Guidelines

### Apple App Store Guidelines

1. **Frequency Limits**:
   - Maximum 3 prompts per 365 days
   - System may show prompt less frequently
   - Cannot check if review was submitted

2. **Requirements**:
   - Cannot incentivize reviews
   - Cannot gate features behind reviews
   - Must use official API (no custom UI)

### Google Play Guidelines

1. **Frequency Limits**:
   - No hard limit, but be reasonable
   - System may throttle excessive requests
   - Cannot check if review was submitted

2. **Requirements**:
   - Cannot incentivize reviews
   - Must follow Play Store policies
   - Review flow must complete in-app

## Setup Guide

### Installation

```bash
npm install native-update
npx cap sync
```

### Android Configuration

No additional configuration required. The plugin automatically includes the Play Core library.

### iOS Configuration

No additional configuration required. The plugin automatically uses StoreKit.

### Capacitor Configuration

```json
{
  "plugins": {
    "NativeUpdate": {
      "appStoreId": "YOUR_APP_STORE_ID",
      "reviewPromptDelay": 2000,
      "reviewDebugMode": false
    }
  }
}
```

## Implementation Steps

### Step 1: Basic Implementation

```typescript
import { NativeUpdate } from 'native-update';

export class AppReviewService {
  async requestReview() {
    try {
      const result = await NativeUpdate.requestReview();

      if (result.displayed) {
        console.log('Review prompt was displayed');
        // Track that prompt was shown
        await this.analytics.track('review_prompt_displayed');
      } else {
        console.log('Review prompt was not displayed (system throttled)');
        // Maybe try alternative feedback method
        await this.showAlternativeFeedback();
      }
    } catch (error) {
      console.error('Review request failed:', error);
      // Fallback to external review
      await this.openExternalReview();
    }
  }
}
```

### Step 2: Smart Review Triggers

```typescript
export class SmartReviewManager {
  private readonly REVIEW_CONDITIONS = {
    minSessions: 5,
    minDaysInstalled: 3,
    minActionsCompleted: 10,
    positiveExperienceRequired: true,
  };

  async checkAndRequestReview() {
    // Check if we should ask for review
    const shouldAsk = await this.shouldAskForReview();

    if (!shouldAsk) {
      return;
    }

    // Check if user had positive experience
    const hasPositiveExperience = await this.checkPositiveExperience();

    if (!hasPositiveExperience) {
      // Ask for feedback instead
      await this.askForFeedback();
      return;
    }

    // Request review
    await this.requestReview();
  }

  private async shouldAskForReview(): Promise<boolean> {
    const stats = await this.getUserStats();

    // Check all conditions
    const conditions = [
      stats.sessionCount >= this.REVIEW_CONDITIONS.minSessions,
      stats.daysSinceInstall >= this.REVIEW_CONDITIONS.minDaysInstalled,
      stats.completedActions >= this.REVIEW_CONDITIONS.minActionsCompleted,
      !stats.hasReviewedBefore,
      !stats.hasDeclinedRecently,
      this.isGoodMoment(),
    ];

    return conditions.every((condition) => condition);
  }

  private isGoodMoment(): boolean {
    // Don't interrupt critical flows
    const currentRoute = this.router.url;
    const badMoments = ['/checkout', '/payment', '/onboarding', '/support'];

    return !badMoments.some((route) => currentRoute.includes(route));
  }

  private async checkPositiveExperience(): Promise<boolean> {
    // Check recent user actions
    const recentActions = await this.getRecentUserActions();

    const positiveSignals = [
      recentActions.includes('task_completed'),
      recentActions.includes('content_shared'),
      recentActions.includes('milestone_achieved'),
      !recentActions.includes('error_encountered'),
      !recentActions.includes('support_contacted'),
    ];

    // Need at least 3 positive signals
    return positiveSignals.filter((signal) => signal).length >= 3;
  }
}
```

### Step 3: Review Trigger Points

```typescript
export class ReviewTriggerPoints {
  constructor(
    private reviewService: SmartReviewManager,
    private analytics: AnalyticsService
  ) {}

  // After completing important action
  async onTaskCompleted() {
    await this.incrementPositiveAction('task_completed');

    // Check if this is a milestone
    const taskCount = await this.getCompletedTaskCount();
    if (taskCount % 5 === 0) {
      // Every 5 tasks
      await this.reviewService.checkAndRequestReview();
    }
  }

  // After successful transaction
  async onPurchaseCompleted() {
    await this.incrementPositiveAction('purchase_completed');

    // Wait a bit before asking
    setTimeout(() => {
      this.reviewService.checkAndRequestReview();
    }, 5000);
  }

  // After achieving milestone
  async onMilestoneAchieved(milestone: string) {
    await this.incrementPositiveAction('milestone_achieved');

    // Show achievement first
    await this.showAchievementToast(milestone);

    // Then ask for review
    setTimeout(() => {
      this.reviewService.checkAndRequestReview();
    }, 3000);
  }

  // After positive feedback
  async onPositiveFeedback() {
    // User already indicated satisfaction
    await this.reviewService.requestReview();
  }

  // App foregrounded (for time-based triggers)
  async onAppForegrounded() {
    const lastPrompt = await this.getLastReviewPromptDate();
    const daysSinceLastPrompt = this.daysSince(lastPrompt);

    // Check every 30 days
    if (daysSinceLastPrompt >= 30) {
      await this.reviewService.checkAndRequestReview();
    }
  }
}
```

### Step 4: Two-Step Review Flow

```typescript
export class TwoStepReviewFlow {
  async initiateReviewFlow() {
    // Step 1: Ask if they enjoy the app
    const enjoys = await this.askEnjoyment();

    if (enjoys) {
      // Step 2: Ask for review
      await this.askForReview();
    } else {
      // Ask for feedback instead
      await this.askForFeedback();
    }
  }

  private async askEnjoyment(): Promise<boolean> {
    return new Promise((resolve) => {
      const alert = this.alertController.create({
        header: 'Enjoying the app?',
        message: 'How has your experience been so far?',
        buttons: [
          {
            text: 'Not really',
            handler: () => {
              this.analytics.track('review_enjoyment_negative');
              resolve(false);
            },
          },
          {
            text: 'Yes!',
            handler: () => {
              this.analytics.track('review_enjoyment_positive');
              resolve(true);
            },
          },
        ],
      });
      alert.present();
    });
  }

  private async askForReview() {
    const alert = await this.alertController.create({
      header: 'Awesome!',
      message: 'Would you mind rating us on the app store?',
      buttons: [
        {
          text: 'No thanks',
          role: 'cancel',
          handler: () => {
            this.analytics.track('review_declined');
            this.markDeclined();
          },
        },
        {
          text: 'Sure!',
          handler: async () => {
            this.analytics.track('review_accepted');
            await NativeUpdate.requestReview();
          },
        },
      ],
    });
    await alert.present();
  }

  private async askForFeedback() {
    const alert = await this.alertController.create({
      header: 'We appreciate your feedback',
      message: 'What can we do to improve your experience?',
      inputs: [
        {
          name: 'feedback',
          type: 'textarea',
          placeholder: 'Your feedback...',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Send',
          handler: (data) => {
            this.submitFeedback(data.feedback);
            this.showThankYou();
          },
        },
      ],
    });
    await alert.present();
  }
}
```

### Step 5: Alternative Review Methods

```typescript
export class AlternativeReviewMethods {
  // For when in-app review is not available
  async openExternalReview() {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      await this.openAppStore();
    } else if (platform === 'android') {
      await this.openPlayStore();
    } else {
      await this.openWebReview();
    }
  }

  private async openAppStore() {
    const appStoreId = 'YOUR_APP_STORE_ID';
    const reviewUrl = `https://apps.apple.com/app/id${appStoreId}?action=write-review`;

    try {
      await Browser.open({ url: reviewUrl });
      this.analytics.track('external_review_opened', { platform: 'ios' });
    } catch (error) {
      console.error('Failed to open App Store:', error);
    }
  }

  private async openPlayStore() {
    const packageName = 'com.example.app';
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;

    try {
      await Browser.open({ url: playStoreUrl });
      this.analytics.track('external_review_opened', { platform: 'android' });
    } catch (error) {
      console.error('Failed to open Play Store:', error);
    }
  }

  private async openWebReview() {
    // Custom web review form or third-party service
    const modal = await this.modalController.create({
      component: WebReviewComponent,
    });
    await modal.present();
  }
}
```

## Best Practices

### 1. Timing is Everything

```typescript
export class ReviewTimingStrategy {
  // Good moments to ask
  private readonly GOOD_MOMENTS = [
    'after_milestone_achieved',
    'after_successful_transaction',
    'after_positive_interaction',
    'after_content_shared',
    'after_returning_user_session',
  ];

  // Bad moments to avoid
  private readonly BAD_MOMENTS = [
    'during_onboarding',
    'after_error',
    'during_payment_flow',
    'immediately_after_install',
    'after_support_contact',
    'during_critical_task',
  ];

  async isGoodMomentForReview(): Promise<boolean> {
    const currentContext = await this.getCurrentUserContext();

    // Check if it's a bad moment
    if (this.BAD_MOMENTS.includes(currentContext.state)) {
      return false;
    }

    // Check if it's explicitly a good moment
    if (this.GOOD_MOMENTS.includes(currentContext.state)) {
      return true;
    }

    // Additional checks
    return this.additionalTimingChecks(currentContext);
  }

  private async additionalTimingChecks(context: any): Promise<boolean> {
    // Don't ask too soon after install
    if (context.daysSinceInstall < 3) return false;

    // Don't ask if user is in a hurry
    if (context.sessionDuration < 60) return false;

    // Don't ask if user had recent issues
    if (context.recentErrors > 0) return false;

    return true;
  }
}
```

### 2. Respect User Choice

```typescript
export class ReviewPreferenceManager {
  private readonly PREFERENCE_KEY = 'review_preferences';

  async userDeclinedReview() {
    const prefs = await this.getPreferences();
    prefs.declineCount++;
    prefs.lastDeclineDate = new Date().toISOString();

    // After 3 declines, stop asking
    if (prefs.declineCount >= 3) {
      prefs.permanentlyDeclined = true;
    }

    await this.savePreferences(prefs);
  }

  async canAskForReview(): Promise<boolean> {
    const prefs = await this.getPreferences();

    // Never ask if permanently declined
    if (prefs.permanentlyDeclined) return false;

    // Wait longer after each decline
    const daysSinceDecline = this.daysSince(prefs.lastDeclineDate);
    const requiredDays = prefs.declineCount * 30; // 30, 60, 90 days

    return daysSinceDecline >= requiredDays;
  }

  async resetAfterPositiveReview() {
    const prefs = await this.getPreferences();
    prefs.hasReviewed = true;
    prefs.reviewDate = new Date().toISOString();
    prefs.declineCount = 0;
    await this.savePreferences(prefs);
  }
}
```

### 3. A/B Testing

```typescript
export class ReviewABTesting {
  async getReviewStrategy(): Promise<string> {
    const userId = await this.getUserId();
    const variant = this.hashUserId(userId) % 3;

    switch (variant) {
      case 0:
        return 'immediate'; // Direct review request
      case 1:
        return 'two-step'; // Ask enjoyment first
      case 2:
        return 'contextual'; // Wait for positive moment
    }
  }

  async executeStrategy(strategy: string) {
    this.analytics.track('review_strategy_assigned', { strategy });

    switch (strategy) {
      case 'immediate':
        await NativeUpdate.requestReview();
        break;
      case 'two-step':
        await this.twoStepFlow.initiateReviewFlow();
        break;
      case 'contextual':
        await this.contextualFlow.waitForPositiveMoment();
        break;
    }
  }
}
```

## Analytics Integration

### Track Everything

```typescript
export class ReviewAnalytics {
  private events = {
    // Prompt events
    PROMPT_TRIGGERED: 'review_prompt_triggered',
    PROMPT_DISPLAYED: 'review_prompt_displayed',
    PROMPT_DISMISSED: 'review_prompt_dismissed',

    // User actions
    REVIEW_ACCEPTED: 'review_accepted',
    REVIEW_DECLINED: 'review_declined',
    REVIEW_COMPLETED: 'review_completed', // Best guess

    // Feedback events
    FEEDBACK_PROVIDED: 'feedback_provided',
    EXTERNAL_REVIEW: 'external_review_opened',
  };

  async trackReviewFlow(stage: string, properties?: any) {
    await this.analytics.track(this.events[stage], {
      ...properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      platform: Capacitor.getPlatform(),
      appVersion: this.appVersion,
    });
  }

  async generateReviewReport(): Promise<ReviewMetrics> {
    const metrics = await this.analytics.query({
      events: Object.values(this.events),
      timeframe: 'last_30_days',
    });

    return {
      promptsShown: metrics[this.events.PROMPT_DISPLAYED],
      acceptanceRate:
        metrics[this.events.REVIEW_ACCEPTED] /
        metrics[this.events.PROMPT_DISPLAYED],
      declineRate:
        metrics[this.events.REVIEW_DECLINED] /
        metrics[this.events.PROMPT_DISPLAYED],
      estimatedCompletionRate: this.estimateCompletionRate(metrics),
      feedbackRate:
        metrics[this.events.FEEDBACK_PROVIDED] /
        metrics[this.events.PROMPT_DISPLAYED],
    };
  }
}
```

## Testing

### Development Testing

```typescript
export class ReviewTestingUtils {
  async enableTestMode() {
    // Enable debug mode
    await NativeUpdate.setReviewDebugMode({ enabled: true });

    // Reset all preferences
    await this.clearReviewPreferences();

    // Set up test conditions
    await this.setupTestConditions();
  }

  async simulateReviewFlow() {
    console.log('Simulating review flow...');

    // Force display of review prompt
    const result = await NativeUpdate.requestReview({
      force: true, // Only works in debug mode
    });

    console.log('Review simulation result:', result);
  }

  async testDifferentScenarios() {
    const scenarios = [
      { name: 'First time user', daysSinceInstall: 0 },
      { name: 'Happy user', positiveActions: 10 },
      { name: 'Frustrated user', errors: 5 },
      { name: 'Returning user', sessions: 20 },
    ];

    for (const scenario of scenarios) {
      await this.setupScenario(scenario);
      const shouldShow = await this.reviewManager.shouldAskForReview();
      console.log(
        `Scenario "${scenario.name}": ${shouldShow ? 'SHOW' : 'HIDE'}`
      );
    }
  }
}
```

### Platform-Specific Testing

#### iOS Testing

1. Use development build (not TestFlight)
2. Reviews work in debug mode
3. Can test multiple times
4. Check console for SKStoreReviewController logs

#### Android Testing

1. Use internal test track
2. Sign in with test account
3. Clear Play Store cache between tests
4. Check Play Console for metrics

## Troubleshooting

### Common Issues

#### 1. Review Prompt Not Showing

```typescript
// Debug checklist
async function debugReviewPrompt() {
  // Check if available on platform
  const isAvailable = await NativeUpdate.isReviewAvailable();
  console.log('Review available:', isAvailable);

  // Check system throttling
  const debugInfo = await NativeUpdate.getReviewDebugInfo();
  console.log('Debug info:', debugInfo);

  // Check your conditions
  const conditions = await this.checkAllConditions();
  console.log('App conditions:', conditions);
}
```

#### 2. Low Review Rates

```typescript
// Optimize review strategy
class ReviewOptimizer {
  async analyzeAndOptimize() {
    const metrics = await this.getReviewMetrics();

    if (metrics.promptsShown < 100) {
      console.log('Not enough data yet');
      return;
    }

    if (metrics.acceptanceRate < 0.1) {
      // Less than 10% accepting
      console.log('Consider:');
      console.log('- Improving timing');
      console.log('- Using two-step flow');
      console.log('- Checking for negative experiences');
    }

    if (metrics.promptsShown / metrics.eligibleUsers < 0.5) {
      console.log('Not reaching enough users');
      console.log('- Relax conditions');
      console.log('- Add more trigger points');
    }
  }
}
```

#### 3. Platform-Specific Issues

```typescript
// Platform fallbacks
async function requestReviewWithFallback() {
  try {
    const result = await NativeUpdate.requestReview();

    if (!result.displayed) {
      // System didn't show prompt
      if (Capacitor.getPlatform() === 'web') {
        await this.showWebReviewUI();
      } else {
        // Try again later
        await this.scheduleRetry();
      }
    }
  } catch (error) {
    // API not available
    await this.openExternalReview();
  }
}
```

## Summary

Key takeaways for implementing app reviews:

1. **Time it right** - Ask when users are happy
2. **Be respectful** - Don't ask too often
3. **Track everything** - Measure and optimize
4. **Handle all cases** - Have fallbacks ready
5. **Follow guidelines** - Respect platform rules
6. **Test thoroughly** - Use debug modes
7. **Iterate** - Continuously improve based on data

## Next Steps

- Review the [Quick Start Guide](./QUICK_START.md)
- Check the [API Reference](./api/app-review-api.md)
- See example implementation in the `/example` directory
