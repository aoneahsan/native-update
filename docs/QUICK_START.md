# Quick Start Guide

Get up and running with Capacitor Native Update in 5 minutes! This guide covers all three main features:

1. **Live Updates (OTA)** - Push JavaScript/CSS updates instantly
2. **Native App Updates** - Check and install app store updates
3. **App Reviews** - Request in-app ratings and reviews

## Installation

```bash
# Install the plugin
npm install native-update

# Sync with native projects
npx cap sync
```

## Basic Setup

### 1. Configure the Plugin

**capacitor.config.json**:

```json
{
  "appId": "com.example.app",
  "appName": "MyApp",
  "plugins": {
    "NativeUpdate": {
      "updateUrl": "https://updates.example.com/api/v1",
      "autoCheck": true,
      "appStoreId": "123456789"
    }
  }
}
```

### 2. Import and Initialize

```typescript
import { NativeUpdate } from 'native-update';

// Initialize on app start
export class App {
  async ngOnInit() {
    await this.initializeUpdates();
  }

  async initializeUpdates() {
    // Check for all types of updates
    await this.checkLiveUpdates();
    await this.checkNativeUpdates();

    // Set up review prompt for later
    this.scheduleReviewPrompt();
  }
}
```

## Feature 1: Live Updates (OTA)

Push updates without app store review!

### Basic Implementation

```typescript
import { NativeUpdate } from 'native-update';

export class LiveUpdateService {
  async checkAndApplyUpdates() {
    try {
      // 1. Sync with the update server
      const result = await NativeUpdate.sync();

      if (result.status === 'UP_TO_DATE') {
        console.log('No updates available');
        return;
      }

      if (result.status === 'UPDATE_INSTALLED') {
        console.log(`Update ${result.bundle?.version} installed!`);
        // Reload to apply the update
        await NativeUpdate.reload();
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  }
}
```

### With User Interface

```typescript
export class UpdateUIService {
  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  async checkForUpdatesWithUI() {
    const result = await NativeUpdate.sync();

    if (result.status === 'UP_TO_DATE') return;

    if (result.status === 'UPDATE_AVAILABLE') {
      // Show update dialog
      const alert = await this.alertController.create({
        header: 'Update Available',
        message: `Version ${result.bundle?.version} is ready!\n\nBug fixes and improvements`,
        buttons: [
          { text: 'Later', role: 'cancel' },
          {
            text: 'Update Now',
            handler: () => this.applyUpdate(),
          },
        ],
      });

      await alert.present();
    } else if (result.status === 'UPDATE_INSTALLED') {
      // Update already installed, just need to reload
      await NativeUpdate.reload();
    }
  }

  private async applyUpdate() {
    const loading = await this.loadingController.create({
      message: 'Applying update...',
    });
    await loading.present();

    try {
      // The sync method already downloaded the update
      // We just need to reload the app
      await NativeUpdate.reload();
    } catch (error) {
      await loading.dismiss();
      // Show error
    }
  }
}
```

### Setting Up Update Server

Use our example server or implement your own:

```bash
# Using example server
cd server-example
npm install
npm start

# Upload a bundle
curl -X POST http://localhost:3000/api/v1/bundles \
  -H "Authorization: Bearer your-token" \
  -F "file=@bundle.zip" \
  -F "version=1.0.1" \
  -F "channel=production"
```

## Feature 2: Native App Updates

Check for app store updates and install them!

### Basic Implementation

```typescript
export class NativeUpdateService {
  async checkForAppStoreUpdates() {
    try {
      const result = await NativeUpdate.getAppUpdateInfo();

      if (!result.updateAvailable) {
        console.log('App is up to date');
        return;
      }

      // Handle based on platform
      if (Capacitor.getPlatform() === 'android') {
        await this.handleAndroidUpdate(result);
      } else if (Capacitor.getPlatform() === 'ios') {
        await this.handleiOSUpdate(result);
      }
    } catch (error) {
      console.error('Native update check failed:', error);
    }
  }

  private async handleAndroidUpdate(result: any) {
    if (result.immediateUpdateAllowed) {
      // Critical update - must install
      await NativeUpdate.performImmediateUpdate();
    } else {
      // Optional update - download in background
      await NativeUpdate.startFlexibleUpdate();
    }
  }

  private async handleiOSUpdate(result: any) {
    // iOS can only redirect to App Store
    const alert = await this.alertController.create({
      header: 'Update Available',
      message: `Version ${result.availableVersion} is available on the App Store`,
      buttons: [
        { text: 'Later', role: 'cancel' },
        {
          text: 'Update',
          handler: () => NativeUpdate.openAppStore(),
        },
      ],
    });
    await alert.present();
  }
}
```

### With Progress Tracking (Android)

```typescript
export class AndroidUpdateProgress {
  downloadProgress = 0;

  async startFlexibleUpdate() {
    // Start download
    await NativeUpdate.startFlexibleUpdate();

    // Track progress
    NativeUpdate.addListener(
      'appUpdateProgress',
      (progress) => {
        this.downloadProgress = Math.round(
          (progress.bytesDownloaded / progress.totalBytesToDownload) * 100
        );
      }
    );

    // Handle completion
    NativeUpdate.addListener('updateStateChanged', async (event) => {
      if (event.status === 'DOWNLOADED') {
        const alert = await this.alertController.create({
          header: 'Update Ready',
          message: 'Update has been downloaded. Install now?',
          buttons: [
            { text: 'Later' },
            {
              text: 'Install',
              handler: () => NativeUpdate.completeFlexibleUpdate(),
            },
          ],
        });
        await alert.present();
      }
    });
  }
}
```

## Feature 3: App Reviews

Request ratings without users leaving your app!

### Basic Implementation

```typescript
export class AppReviewService {
  async requestReview() {
    try {
      const result = await NativeUpdate.requestReview();

      if (result.displayed) {
        console.log('Review prompt shown');
        // Track analytics
      }
    } catch (error) {
      console.error('Review request failed:', error);
      // Fallback to external review
    }
  }
}
```

### Smart Review Prompts

Only ask at the right moments:

```typescript
export class SmartReviewService {
  private readonly MIN_SESSIONS = 3;
  private readonly MIN_DAYS_INSTALLED = 3;

  async checkAndRequestReview() {
    // Don't ask too early
    if (!(await this.isGoodTimeToAsk())) {
      return;
    }

    // Two-step approach
    const enjoying = await this.askIfEnjoying();

    if (enjoying) {
      await NativeUpdate.requestReview();
    } else {
      await this.askForFeedback();
    }
  }

  private async isGoodTimeToAsk(): Promise<boolean> {
    const sessions = await this.getSessionCount();
    const daysSinceInstall = await this.getDaysSinceInstall();

    return (
      sessions >= this.MIN_SESSIONS &&
      daysSinceInstall >= this.MIN_DAYS_INSTALLED
    );
  }

  private async askIfEnjoying(): Promise<boolean> {
    return new Promise((resolve) => {
      const alert = this.alertController.create({
        header: 'Enjoying MyApp?',
        buttons: [
          {
            text: 'Not really',
            handler: () => resolve(false),
          },
          {
            text: 'Yes!',
            handler: () => resolve(true),
          },
        ],
      });
      alert.present();
    });
  }
}
```

### Review Triggers

Call review prompts at optimal moments:

```typescript
export class ReviewTriggers {
  constructor(private reviewService: SmartReviewService) {}

  // After completing important task
  async onTaskCompleted() {
    const taskCount = await this.getCompletedTasks();

    // Every 5 tasks
    if (taskCount % 5 === 0) {
      setTimeout(() => {
        this.reviewService.checkAndRequestReview();
      }, 2000);
    }
  }

  // After positive interaction
  async onPositiveEvent() {
    await this.reviewService.checkAndRequestReview();
  }

  // On app launch (with conditions)
  async onAppLaunch() {
    const lastPrompt = await this.getLastPromptDate();
    const daysSince = this.daysSince(lastPrompt);

    // Max once per month
    if (daysSince >= 30) {
      await this.reviewService.checkAndRequestReview();
    }
  }
}
```

## Complete Example

Here's everything working together:

```typescript
import { Component, OnInit } from '@angular/core';
import { NativeUpdate } from 'native-update';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.platform.ready();

    // Initialize all update features
    await this.initializeUpdates();
  }

  async initializeUpdates() {
    // 1. Check for live updates on startup
    this.checkLiveUpdates();

    // 2. Check for native updates periodically
    this.scheduleNativeUpdateCheck();

    // 3. Set up smart review prompts
    this.initializeReviewPrompts();
  }

  // Live Updates
  private async checkLiveUpdates() {
    try {
      const result = await NativeUpdate.sync();

      if (result.status === 'UPDATE_INSTALLED') {
        // Notify user
        const toast = await this.toastCtrl.create({
          message: 'Update ready! Restart to apply.',
          duration: 5000,
          buttons: [
            {
              text: 'Restart',
              handler: () => NativeUpdate.reload(),
            },
          ],
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Live update check failed:', error);
    }
  }

  // Native Updates
  private scheduleNativeUpdateCheck() {
    // Check immediately
    this.checkNativeUpdates();

    // Then check daily
    setInterval(
      () => {
        this.checkNativeUpdates();
      },
      24 * 60 * 60 * 1000
    );
  }

  private async checkNativeUpdates() {
    try {
      const result = await NativeUpdate.getAppUpdateInfo();

      if (result.updateAvailable && result.flexibleUpdateAllowed) {
        // Start background download for Android
        if (Capacitor.getPlatform() === 'android') {
          await NativeUpdate.startFlexibleUpdate();
        }
      }
    } catch (error) {
      console.error('Native update check failed:', error);
    }
  }

  // App Reviews
  private initializeReviewPrompts() {
    // Track positive events
    document.addEventListener('task-completed', () => {
      this.maybeRequestReview();
    });

    // Check on app foreground
    document.addEventListener('resume', () => {
      this.maybeRequestReview();
    });
  }

  private async maybeRequestReview() {
    const canAsk = await this.canAskForReview();

    if (canAsk) {
      await NativeUpdate.requestReview();
      await this.markReviewRequested();
    }
  }

  private async canAskForReview(): Promise<boolean> {
    // Your conditions here
    const lastAsked = await this.getLastReviewDate();
    const daysSince = this.daysSince(lastAsked);

    return daysSince > 30; // Once per month max
  }
}
```

## Testing Your Implementation

### 1. Test Live Updates

```bash
# Build your web app
npm run build

# Create update bundle
cd www && zip -r ../update-1.0.1.zip . && cd ..

# Upload to test server
curl -X POST http://localhost:3000/api/v1/bundles \
  -H "Authorization: Bearer test-token" \
  -F "file=@update-1.0.1.zip" \
  -F "version=1.0.1"

# Test in app
```

### 2. Test Native Updates

**Android:**

- Upload APK to Internal Test Track
- Install older version
- Open app to trigger update

**iOS:**

- Use TestFlight
- Install older version
- Check for updates in app

### 3. Test App Reviews

```typescript
// Test review prompts
// Note: Reviews may not show in development builds
// Test with TestFlight (iOS) or Internal Test Track (Android)
await NativeUpdate.requestReview();
```

## What's Next?

Now that you have the basics working:

1. **Production Setup**:
   - Set up a proper update server
   - Implement bundle signing
   - Configure update channels

2. **Advanced Features**:
   - Delta updates for smaller downloads
   - A/B testing different update strategies
   - Rollback capabilities

3. **Deep Dive**:
   - [Live Updates Guide](./LIVE_UPDATES_GUIDE.md) - Complete OTA implementation
   - [Native Updates Guide](./NATIVE_UPDATES_GUIDE.md) - Platform-specific details
   - [App Review Guide](./APP_REVIEW_GUIDE.md) - Maximize review rates
   - [Security Guide](./guides/security-best-practices.md) - Best practices
   - [API Reference](./api/live-update-api.md) - All methods and options

## Troubleshooting

### Live Updates Not Working?

```typescript
// Enable debug logging in your app
console.log('Checking update configuration...');

// Configuration is set in capacitor.config.json
// Check your config file for updateUrl and other settings
```

### Native Updates Not Detected?

- Ensure app is published on store
- Check version numbers are correct
- Verify package name matches

### Reviews Not Showing?

- iOS: Limited to 3 times per year by system
- Android: May be throttled by Play Store
- Both: Won't show in development builds

## Support

- 📖 [Documentation](https://github.com/aoneahsan/native-update)
- 🐛 [Issue Tracker](https://github.com/aoneahsan/native-update/issues)
- 💬 [Discussions](https://github.com/aoneahsan/native-update/discussions)

Happy updating! 🚀
