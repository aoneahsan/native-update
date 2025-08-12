# Configuration Guide

> **⚠️ Backend Server Required**
>
> All configuration options in this guide assume you have already built and deployed:
> - A complete update server with all required API endpoints
> - Bundle generation and signing infrastructure
> - CDN or storage solution for bundle distribution
> - Security infrastructure for signatures and certificates
>
> **Without these backend components, the plugin will not function regardless of configuration.**

This guide covers all configuration options available in Capacitor Native Update. The plugin is highly configurable to meet various deployment scenarios and security requirements.

## Configuration Overview

The plugin is configured using the `configure()` method with an `UpdateConfig` object:

```typescript
await CapacitorNativeUpdate.configure({
  liveUpdate: {
    /* Live update settings */
  },
  appUpdate: {
    /* App store update settings */
  },
  appReview: {
    /* Review request settings */
  },
  security: {
    /* Security settings */
  },
});
```

## Live Update Configuration

Configure how your app handles over-the-air updates.

### Basic Configuration

```typescript
liveUpdate: {
  // Required: Your application identifier
  appId: 'com.yourcompany.app',

  // Required: Your update server URL
  serverUrl: 'https://updates.yourserver.com',

  // Update channel (default: 'production')
  channel: 'production',

  // Enable automatic update checks (default: true)
  autoUpdate: true,

  // Update strategy
  updateStrategy: 'IMMEDIATE' // or 'BACKGROUND' or 'MANUAL'
}
```

### Advanced Configuration

```typescript
liveUpdate: {
  appId: 'com.yourcompany.app',
  serverUrl: 'https://updates.yourserver.com',
  channel: 'production',

  // Security
  publicKey: 'YOUR_RSA_PUBLIC_KEY',
  requireSignature: true,
  checksumAlgorithm: 'SHA-256', // or 'SHA-512'

  // Update behavior
  updateStrategy: 'BACKGROUND',
  mandatoryInstallMode: 'IMMEDIATE',
  optionalInstallMode: 'ON_NEXT_RESTART',

  // Update checks
  autoUpdate: true,
  checkInterval: 3600000, // Check every hour (in ms)

  // Restrictions
  allowEmulator: false, // Disable updates on emulators
  maxBundleSize: 50 * 1024 * 1024, // 50MB limit

  // Network
  allowedHosts: [
    'updates.yourserver.com',
    'cdn.yourserver.com'
  ],

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000 // 30 seconds
}
```

### Configuration Options Explained

#### Update Strategies

- **`IMMEDIATE`**: Downloads and installs updates immediately when found
- **`BACKGROUND`**: Downloads in background, installs based on install mode
- **`MANUAL`**: Full control - you decide when to download and install

#### Install Modes

- **`IMMEDIATE`**: Installs and restarts immediately
- **`ON_NEXT_RESTART`**: Installs on next app restart
- **`ON_NEXT_RESUME`**: Installs when app resumes from background

#### Security Options

- **`publicKey`**: RSA public key for signature verification
- **`requireSignature`**: Enforce bundle signature validation
- **`checksumAlgorithm`**: Hash algorithm for integrity checks

## App Update Configuration

Configure native app store update behavior.

### Basic Configuration

```typescript
appUpdate: {
  // Check for updates on app start
  checkOnAppStart: true,

  // Minimum required version
  minimumVersion: '2.0.0',

  // Update priority (0-5, where 5 is highest)
  updatePriority: 3
}
```

### Advanced Configuration

```typescript
appUpdate: {
  checkOnAppStart: true,
  minimumVersion: '2.0.0',
  updatePriority: 4,

  // Custom store URLs
  storeUrl: {
    android: 'https://play.google.com/store/apps/details?id=com.yourapp',
    ios: 'https://apps.apple.com/app/id123456789'
  },

  // Allow version downgrades (not recommended)
  allowDowngrade: false,

  // Force update if below minimum version
  forceUpdateBelow: '1.5.0',

  // Check interval for app updates (ms)
  checkInterval: 86400000 // Once per day
}
```

### Update Priority Levels

| Priority | Behavior                                |
| -------- | --------------------------------------- |
| 0-2      | Low - Optional update, can be dismissed |
| 3        | Medium - Recommended update             |
| 4        | High - Strongly recommended             |
| 5        | Critical - Immediate update required    |

## App Review Configuration

Configure when and how to request user reviews.

### Basic Configuration

```typescript
appReview: {
  // Days since install before first prompt
  minimumDaysSinceInstall: 7,

  // Days between review prompts
  minimumDaysSinceLastPrompt: 60,

  // App launches before eligible
  minimumLaunchCount: 3
}
```

### Advanced Configuration

```typescript
appReview: {
  minimumDaysSinceInstall: 7,
  minimumDaysSinceLastPrompt: 60,
  minimumLaunchCount: 5,

  // Significant events before eligible
  minimumSignificantEvents: 3,

  // Custom trigger events
  customTriggers: [
    'purchase_completed',
    'level_completed',
    'task_finished'
  ],

  // Debug mode - bypass all restrictions
  debugMode: false,

  // Maximum prompts per version
  maxPromptsPerVersion: 2,

  // Require positive events
  requirePositiveEvents: true
}
```

## Security Configuration

Configure security features for all update operations.

### Comprehensive Security Setup

```typescript
security: {
  // Force HTTPS for all URLs
  enforceHttps: true,

  // Certificate pinning
  certificatePinning: {
    enabled: true,
    certificates: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
    ],
    includeSubdomains: true,
    maxAge: 31536000 // 1 year
  },

  // Input validation
  validateInputs: true,

  // Secure storage for sensitive data
  secureStorage: true,

  // Security event logging
  logSecurityEvents: true,

  // Content Security Policy
  contentSecurityPolicy: {
    enabled: true,
    policy: "default-src 'self'; script-src 'self' 'unsafe-inline';"
  }
}
```

## Environment-Specific Configuration

### Development Environment

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'com.yourcompany.app.dev',
    serverUrl: isDevelopment
      ? 'http://localhost:3000'
      : 'https://updates.yourserver.com',
    channel: isDevelopment ? 'development' : 'production',
    allowEmulator: isDevelopment,
    requireSignature: !isDevelopment,
  },
  appReview: {
    debugMode: isDevelopment,
  },
  security: {
    enforceHttps: !isDevelopment,
  },
});
```

### Multiple Environments

```typescript
interface Environment {
  name: string;
  serverUrl: string;
  channel: string;
  publicKey?: string;
}

const environments: Record<string, Environment> = {
  development: {
    name: 'Development',
    serverUrl: 'http://localhost:3000',
    channel: 'development',
  },
  staging: {
    name: 'Staging',
    serverUrl: 'https://staging-updates.yourserver.com',
    channel: 'staging',
    publicKey: 'STAGING_PUBLIC_KEY',
  },
  production: {
    name: 'Production',
    serverUrl: 'https://updates.yourserver.com',
    channel: 'production',
    publicKey: 'PRODUCTION_PUBLIC_KEY',
  },
};

const currentEnv = environments[process.env.APP_ENV || 'production'];

await CapacitorNativeUpdate.configure({
  liveUpdate: {
    appId: 'com.yourcompany.app',
    serverUrl: currentEnv.serverUrl,
    channel: currentEnv.channel,
    publicKey: currentEnv.publicKey,
    requireSignature: !!currentEnv.publicKey,
  },
});
```

## Dynamic Configuration

### Runtime Configuration Updates

```typescript
// Change update channel
await CapacitorNativeUpdate.LiveUpdate.setChannel('beta');

// Change server URL
await CapacitorNativeUpdate.LiveUpdate.setUpdateUrl('https://new-server.com');

// Update security settings
await CapacitorNativeUpdate.Security.updateConfig({
  enforceHttps: true,
  requireSignature: true,
});
```

### Configuration from Remote Source

```typescript
async function loadRemoteConfig() {
  try {
    // Fetch configuration from your backend
    const response = await fetch('https://api.yourserver.com/app-config');
    const remoteConfig = await response.json();

    // Apply remote configuration
    await CapacitorNativeUpdate.configure({
      liveUpdate: {
        appId: remoteConfig.appId,
        serverUrl: remoteConfig.updateServer,
        channel: remoteConfig.channel,
        updateStrategy: remoteConfig.updateStrategy,
        publicKey: remoteConfig.publicKey,
      },
      appUpdate: {
        minimumVersion: remoteConfig.minimumVersion,
        updatePriority: remoteConfig.updatePriority,
      },
    });
  } catch (error) {
    // Fall back to default configuration
    console.error('Failed to load remote config:', error);
    await loadDefaultConfig();
  }
}
```

## Configuration Best Practices

### 1. Security First

Always enable security features in production:

```typescript
// Production security configuration
const productionConfig = {
  liveUpdate: {
    requireSignature: true,
    checksumAlgorithm: 'SHA-512',
    publicKey: process.env.UPDATE_PUBLIC_KEY,
  },
  security: {
    enforceHttps: true,
    certificatePinning: { enabled: true },
    validateInputs: true,
    secureStorage: true,
  },
};
```

### 2. Progressive Rollout

Use channels for staged deployments:

```typescript
// Rollout stages
const rolloutConfig = {
  liveUpdate: {
    channel: getUserRolloutChannel(), // 'alpha', 'beta', 'production'
    updateStrategy: isEarlyAdopter() ? 'IMMEDIATE' : 'BACKGROUND',
  },
};
```

### 3. Error Recovery

Configure retry and fallback behavior:

```typescript
const resilientConfig = {
  liveUpdate: {
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 30000,
    fallbackUrl: 'https://backup-updates.yourserver.com',
  },
};
```

### 4. Performance Optimization

Configure for optimal performance:

```typescript
const performanceConfig = {
  liveUpdate: {
    updateStrategy: 'BACKGROUND',
    checkInterval: 3600000, // Check hourly
    maxBundleSize: 20 * 1024 * 1024, // 20MB limit
    installMode: 'ON_NEXT_RESTART', // Non-disruptive
  },
};
```

## Validation

The plugin validates all configuration options and will throw descriptive errors for invalid configurations:

```typescript
try {
  await CapacitorNativeUpdate.configure(config);
} catch (error) {
  if (error.code === 'INVALID_CONFIG') {
    console.error('Configuration error:', error.message);
    // Handle specific configuration errors
  }
}
```

## Next Steps

- Implement [Security Best Practices](../guides/security-best-practices.md)
- Set up your [Update Server](../examples/server-setup.md)
- Explore [Advanced Features](../features/live-updates.md)

---

Made with ❤️ by Ahsan Mahmood
