// Main plugin export
export { NativeUpdate } from './plugin';

// Type exports
export type {
  // Main plugin types
  NativeUpdatePlugin,
  NativeUpdateCombinedPlugin,
  NativeUpdateListeners,
  LiveUpdatePlugin,
  AppUpdatePlugin,
  AppReviewPlugin,
  
  // Configuration
  PluginConfig,
  UpdateConfig,
  LiveUpdateConfig,
  AppUpdateConfig,
  AppReviewConfig,
  
  // Live update types
  BundleInfo,
  BundleStatus,
  UpdateStrategy,
  InstallMode,
  DownloadOptions,
  DownloadProgressEvent,
  SyncOptions,
  SyncResult,
  DeleteOptions,
  LatestVersion,
  ValidateOptions,
  ValidationResult,
  
  // App update types
  AppUpdateInfo,
  OpenAppStoreOptions,
  
  // App review types
  ReviewResult,
  CanRequestReviewResult,
  
  // Events
  UpdateStateChangedEvent,
  AppUpdateStateChangedEvent,
  AppUpdateProgressEvent,
  AppUpdateAvailableEvent,
  AppUpdateReadyEvent,
  AppUpdateFailedEvent,
  AppUpdateNotificationClickedEvent,
  AppUpdateInstallClickedEvent,
  BackgroundUpdateProgressEvent,
  BackgroundUpdateNotificationEvent,
  
  // Error types
  UpdateError,
  UpdateErrorCode,
} from './definitions';

// Error exports
export {
  ErrorCode,
  NativeUpdateError,
  ConfigurationError,
  DownloadError,
  ValidationError,
  StorageError,
  UpdateError as UpdateErrorClass,
} from './core/errors';

// Core exports for advanced users
export { ConfigManager } from './core/config';
export { Logger, LogLevel } from './core/logger';
export { SecurityValidator } from './core/security';
export { PluginManager } from './core/plugin-manager';
export { CacheManager } from './core/cache-manager';

// Manager exports for advanced users
export { BundleManager } from './live-update/bundle-manager';
export { DownloadManager } from './live-update/download-manager';
export { VersionManager } from './live-update/version-manager';
export { UpdateManager } from './live-update/update-manager';

