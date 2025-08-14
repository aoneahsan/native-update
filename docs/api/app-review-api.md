# App Review API Reference

Complete API documentation for in-app review functionality.

## Methods

### requestReview(options?)

Request an in-app review dialog.

```typescript
const result = await NativeUpdate.requestReview({
  force?: boolean;  // Bypass rate limiting (testing only)
});
// Returns:
{
  displayed: boolean;         // Was review dialog shown?
  reason?: string;           // Why not displayed
  platform: string;          // Platform used
  lastRequestDate?: number;  // Last request timestamp
  requestCount?: number;     // Total request count
}
```

### canRequestReview()

Check if a review can be requested (respects rate limits).

```typescript
const result = await NativeUpdate.canRequestReview();
// Returns:
{
  canRequest: boolean;
  reason?: string;           // Why not available
  lastRequestDate?: number;  // Last request timestamp
  requestCount?: number;     // Times requested
  daysUntilNext?: number;   // Days until can request
}
```

### openStoreReview()

Open the app store review page directly.

```typescript
await NativeUpdate.openStoreReview();
// Opens app store with review section focused
```

### getStoreReviewUrl()

Get the store review URL without opening it.

```typescript
const result = await NativeUpdate.getStoreReviewUrl();
// Returns:
{
  url: string;  // Direct review URL
  platform: 'ios' | 'android' | 'web';
}
```

### resetReviewPrompts()

Reset review request history (testing only).

```typescript
await NativeUpdate.resetReviewPrompts();
```

### setReviewConditions(conditions)

Set conditions for when to show review prompts.

```typescript
await NativeUpdate.setReviewConditions({
  minimumDaysSinceInstall?: number;    // Default: 3
  minimumDaysSinceLastPrompt?: number; // Default: 90
  minimumAppLaunches?: number;         // Default: 5
  minimumSignificantEvents?: number;   // Default: 3
});
```

### trackSignificantEvent(eventName)

Track significant events for review timing.

```typescript
await NativeUpdate.trackSignificantEvent(eventName: string);
// Examples: 'purchase_completed', 'level_completed', 'content_shared'
```

## Events

### reviewPromptDisplayed

Fired when review prompt is shown.

```typescript
NativeUpdate.addListener('reviewPromptDisplayed', (event) => {
  console.log('Review prompt shown on:', event.platform);
  analytics.track('review_prompt_displayed');
});
```

### reviewPromptDismissed

Fired when review prompt is dismissed.

```typescript
NativeUpdate.addListener('reviewPromptDismissed', (event) => {
  console.log('Review prompt dismissed');
  analytics.track('review_prompt_dismissed');
});
```

## Platform Implementation

### iOS (StoreKit)

- Uses `SKStoreReviewController.requestReview()`
- Limited to 3 prompts per 365-day period
- No callback for user action
- Shows native iOS review dialog
- Requires iOS 10.3+

### Android (Google Play)

- Uses Play Core In-App Review API
- No specific rate limits documented
- Shows native Play Store review flow
- Requires Play Core Library
- Android 5.0+ (API 21+)

### Web

- Shows custom review prompt
- Redirects to review URL
- No rate limiting
- Customizable UI

## Best Practices

### 1. Time Review Requests Appropriately

```typescript
// After positive interaction
async function onPurchaseComplete() {
  await processPayment();
  await showThankYouMessage();
  
  // Wait a bit, then request review
  setTimeout(async () => {
    const { canRequest } = await NativeUpdate.canRequestReview();
    if (canRequest) {
      await NativeUpdate.requestReview();
    }
  }, 2000);
}
```

### 2. Track Significant Events

```typescript
// Define what counts as significant
const SIGNIFICANT_EVENTS = [
  'tutorial_completed',
  'first_purchase',
  'level_10_reached',
  'friend_invited',
  'content_created'
];

async function trackUserAction(action: string) {
  if (SIGNIFICANT_EVENTS.includes(action)) {
    await NativeUpdate.trackSignificantEvent(action);
  }
}
```

### 3. Implement Smart Conditions

```typescript
// Configure smart conditions
await NativeUpdate.setReviewConditions({
  minimumDaysSinceInstall: 7,      // Week after install
  minimumDaysSinceLastPrompt: 120, // 4 months between
  minimumAppLaunches: 10,           // Regular user
  minimumSignificantEvents: 5       // Engaged user
});
```

### 4. Fallback Strategy

```typescript
async function requestReviewSmart() {
  try {
    const { displayed } = await NativeUpdate.requestReview();
    
    if (!displayed) {
      // Fallback: Show custom UI with store link
      const response = await showCustomReviewDialog();
      if (response === 'yes') {
        await NativeUpdate.openStoreReview();
      }
    }
  } catch (error) {
    console.error('Review request failed:', error);
  }
}
```

## Rate Limiting

### iOS Limits
- Maximum 3 prompts per 365 days
- No prompt if user has already rated
- System decides when to show

### Android Guidelines
- No hard limits specified
- Don't prompt during onboarding
- Don't prompt after errors
- Respect user choice

### Custom Implementation
```typescript
class ReviewManager {
  private readonly MAX_REQUESTS_PER_YEAR = 3;
  private readonly DAYS_BETWEEN_PROMPTS = 120;
  
  async canRequestReview(): Promise<boolean> {
    const history = await this.getRequestHistory();
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    
    const recentRequests = history.filter(date => date > oneYearAgo);
    
    if (recentRequests.length >= this.MAX_REQUESTS_PER_YEAR) {
      return false;
    }
    
    const lastRequest = Math.max(...history);
    const daysSinceLastRequest = (now - lastRequest) / (24 * 60 * 60 * 1000);
    
    return daysSinceLastRequest >= this.DAYS_BETWEEN_PROMPTS;
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMITED` | Too many recent requests |
| `CONDITIONS_NOT_MET` | Review conditions not satisfied |
| `PLATFORM_NOT_SUPPORTED` | Feature not available on platform |
| `USER_CANCELLED` | User dismissed the prompt |
| `ALREADY_RATED` | User has already rated the app |