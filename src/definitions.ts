export interface NativeUpdatePlugin {
  /**
   * Configure the plugin with initial settings
   */
  configure(options: UpdateConfig): Promise<void>;

  /**
   * Get current security configuration
   */
  getSecurityInfo(): Promise<SecurityInfo>;
}

/**
 * Live Update Plugin Interface
 */
export interface LiveUpdatePlugin {
  /**
   * Sync with update server and apply updates if available
   */
  sync(options?: SyncOptions): Promise<SyncResult>;

  /**
   * Download a specific bundle version
   */
  download(options: DownloadOptions): Promise<BundleInfo>;

  /**
   * Set the active bundle
   */
  set(bundle: BundleInfo): Promise<void>;

  /**
   * Reload the app with current bundle
   */
  reload(): Promise<void>;

  /**
   * Reset to original bundle
   */
  reset(): Promise<void>;

  /**
   * Get current bundle info
   */
  current(): Promise<BundleInfo>;

  /**
   * List all downloaded bundles
   */
  list(): Promise<BundleInfo[]>;

  /**
   * Delete bundles
   */
  delete(options: DeleteOptions): Promise<void>;

  /**
   * Notify app is ready after update
   */
  notifyAppReady(): Promise<void>;

  /**
   * Check for latest version
   */
  getLatest(): Promise<LatestVersion>;

  /**
   * Switch update channel
   */
  setChannel(channel: string): Promise<void>;

  /**
   * Set update server URL
   */
  setUpdateUrl(url: string): Promise<void>;

  /**
   * Validate an update bundle
   */
  validateUpdate(options: ValidateOptions): Promise<ValidationResult>;
}

/**
 * App Update Plugin Interface
 */
export interface AppUpdatePlugin {
  /**
   * Get app update information
   */
  getAppUpdateInfo(): Promise<AppUpdateInfo>;

  /**
   * Perform immediate update
   */
  performImmediateUpdate(): Promise<void>;

  /**
   * Start flexible update
   */
  startFlexibleUpdate(): Promise<void>;

  /**
   * Complete flexible update
   */
  completeFlexibleUpdate(): Promise<void>;

  /**
   * Open app store page
   */
  openAppStore(options?: OpenAppStoreOptions): Promise<void>;
}

/**
 * App Review Plugin Interface
 */
export interface AppReviewPlugin {
  /**
   * Request in-app review
   */
  requestReview(): Promise<ReviewResult>;

  /**
   * Check if review can be requested
   */
  canRequestReview(): Promise<CanRequestReviewResult>;
}

/**
 * Background Update Plugin Interface
 */
export interface BackgroundUpdatePlugin {
  /**
   * Enable background update checking
   */
  enableBackgroundUpdates(config: BackgroundUpdateConfig): Promise<void>;

  /**
   * Disable background update checking
   */
  disableBackgroundUpdates(): Promise<void>;

  /**
   * Get current background update status
   */
  getBackgroundUpdateStatus(): Promise<BackgroundUpdateStatus>;

  /**
   * Schedule background update check with specific interval
   */
  scheduleBackgroundCheck(interval: number): Promise<void>;

  /**
   * Manually trigger background update check
   */
  triggerBackgroundCheck(): Promise<BackgroundCheckResult>;

  /**
   * Configure notification preferences
   */
  setNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<void>;

  /**
   * Get notification permissions status
   */
  getNotificationPermissions(): Promise<NotificationPermissionStatus>;

  /**
   * Request notification permissions
   */
  requestNotificationPermissions(): Promise<boolean>;
}

/**
 * Combined plugin interface
 */
export interface NativeUpdateCombinedPlugin
  extends NativeUpdatePlugin,
    LiveUpdatePlugin,
    AppUpdatePlugin,
    AppReviewPlugin,
    BackgroundUpdatePlugin {}

/**
 * Configuration Types
 */
export interface UpdateConfig {
  liveUpdate?: LiveUpdateConfig;
  appUpdate?: AppUpdateConfig;
  appReview?: AppReviewConfig;
  backgroundUpdate?: BackgroundUpdateConfig;
  security?: SecurityConfig;
}

export interface LiveUpdateConfig {
  appId: string;
  serverUrl: string;
  channel?: string;
  autoUpdate?: boolean;
  updateStrategy?: UpdateStrategy;
  publicKey?: string;
  requireSignature?: boolean;
  checksumAlgorithm?: ChecksumAlgorithm;
  checkInterval?: number;
  allowEmulator?: boolean;
  mandatoryInstallMode?: InstallMode;
  optionalInstallMode?: InstallMode;
  maxBundleSize?: number;
  allowedHosts?: string[];
}

export interface AppUpdateConfig {
  minimumVersion?: string;
  updatePriority?: number;
  storeUrl?: {
    android?: string;
    ios?: string;
  };
  checkOnAppStart?: boolean;
  allowDowngrade?: boolean;
}

export interface AppReviewConfig {
  minimumDaysSinceInstall?: number;
  minimumDaysSinceLastPrompt?: number;
  minimumLaunchCount?: number;
  customTriggers?: string[];
  debugMode?: boolean;
}

export interface BackgroundUpdateConfig {
  enabled: boolean;
  checkInterval: number;
  updateTypes: BackgroundUpdateType[];
  autoInstall?: boolean;
  notificationPreferences?: NotificationPreferences;
  respectBatteryOptimization?: boolean;
  allowMeteredConnection?: boolean;
  minimumBatteryLevel?: number;
  requireWifi?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  taskIdentifier?: string;
}

export interface SecurityConfig {
  enforceHttps?: boolean;
  certificatePinning?: CertificatePinning;
  validateInputs?: boolean;
  secureStorage?: boolean;
  logSecurityEvents?: boolean;
}

export interface CertificatePinning {
  enabled: boolean;
  certificates: string[];
  includeSubdomains?: boolean;
  maxAge?: number;
}

/**
 * Live Update Types
 */
export interface SyncOptions {
  channel?: string;
  updateMode?: UpdateMode;
}

export interface SyncResult {
  status: SyncStatus;
  version?: string;
  description?: string;
  mandatory?: boolean;
  error?: UpdateError;
}

export interface DownloadOptions {
  url: string;
  version: string;
  checksum: string;
  signature?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface BundleInfo {
  bundleId: string;
  version: string;
  path: string;
  downloadTime: number;
  size: number;
  status: BundleStatus;
  checksum: string;
  signature?: string;
  verified: boolean;
  metadata?: Record<string, unknown>;
}

export interface DeleteOptions {
  bundleId?: string;
  keepVersions?: number;
  olderThan?: number;
}

export interface LatestVersion {
  available: boolean;
  version?: string;
  url?: string;
  mandatory?: boolean;
  notes?: string;
  size?: number;
}

export interface ValidateOptions {
  bundlePath: string;
  checksum: string;
  signature?: string;
  maxSize?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    checksumValid?: boolean;
    signatureValid?: boolean;
    sizeValid?: boolean;
    versionValid?: boolean;
  };
}

/**
 * App Update Types
 */
export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  updatePriority?: number;
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  clientVersionStalenessDays?: number;
  installStatus?: InstallStatus;
  bytesDownloaded?: number;
  totalBytesToDownload?: number;
}

export interface OpenAppStoreOptions {
  appId?: string;
}

/**
 * App Review Types
 */
export interface ReviewResult {
  shown: boolean;
  error?: string;
}

export interface CanRequestReviewResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Background Update Types
 */
export interface BackgroundUpdateStatus {
  enabled: boolean;
  lastCheckTime?: number;
  nextCheckTime?: number;
  lastUpdateTime?: number;
  currentTaskId?: string;
  isRunning: boolean;
  checkCount: number;
  failureCount: number;
  lastError?: UpdateError;
}

export interface BackgroundCheckResult {
  success: boolean;
  updatesFound: boolean;
  appUpdate?: AppUpdateInfo;
  liveUpdate?: LatestVersion;
  notificationSent: boolean;
  error?: UpdateError;
}

export interface NotificationPreferences {
  title?: string;
  description?: string;
  iconName?: string;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  showActions?: boolean;
  actionLabels?: {
    updateNow?: string;
    updateLater?: string;
    dismiss?: string;
  };
  channelId?: string;
  channelName?: string;
  priority?: NotificationPriority;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canRequest: boolean;
  shouldShowRationale?: boolean;
}

/**
 * Security Types
 */
export interface SecurityInfo {
  enforceHttps: boolean;
  certificatePinning: {
    enabled: boolean;
    certificates: string[];
  };
  validateInputs: boolean;
  secureStorage: boolean;
}

/**
 * Error Types
 */
export interface UpdateError {
  code: UpdateErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Enums
 */
export enum BackgroundUpdateType {
  APP_UPDATE = 'app_update',
  LIVE_UPDATE = 'live_update',
  BOTH = 'both',
}

export enum NotificationPriority {
  MIN = 'min',
  LOW = 'low',
  DEFAULT = 'default',
  HIGH = 'high',
  MAX = 'max',
}

export enum UpdateStrategy {
  IMMEDIATE = 'immediate',
  BACKGROUND = 'background',
  MANUAL = 'manual',
}

export enum UpdateMode {
  IMMEDIATE = 'immediate',
  ON_NEXT_RESTART = 'on_next_restart',
  ON_NEXT_RESUME = 'on_next_resume',
}

export enum InstallMode {
  IMMEDIATE = 'immediate',
  ON_NEXT_RESTART = 'on_next_restart',
  ON_NEXT_RESUME = 'on_next_resume',
}

export enum ChecksumAlgorithm {
  SHA256 = 'SHA-256',
  SHA512 = 'SHA-512',
}

export enum SyncStatus {
  UP_TO_DATE = 'UP_TO_DATE',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UPDATE_INSTALLED = 'UPDATE_INSTALLED',
  ERROR = 'ERROR',
}

export enum BundleStatus {
  PENDING = 'PENDING',
  DOWNLOADING = 'DOWNLOADING',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
  FAILED = 'FAILED',
}

export enum InstallStatus {
  UNKNOWN = 'UNKNOWN',
  PENDING = 'PENDING',
  DOWNLOADING = 'DOWNLOADING',
  DOWNLOADED = 'DOWNLOADED',
  INSTALLING = 'INSTALLING',
  INSTALLED = 'INSTALLED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum UpdateErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Download errors
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  SIZE_LIMIT_EXCEEDED = 'SIZE_LIMIT_EXCEEDED',

  // Security errors
  VERIFICATION_ERROR = 'VERIFICATION_ERROR',
  CHECKSUM_ERROR = 'CHECKSUM_ERROR',
  SIGNATURE_ERROR = 'SIGNATURE_ERROR',
  INSECURE_URL = 'INSECURE_URL',
  INVALID_CERTIFICATE = 'INVALID_CERTIFICATE',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',

  // Installation errors
  INSTALL_ERROR = 'INSTALL_ERROR',
  ROLLBACK_ERROR = 'ROLLBACK_ERROR',
  VERSION_MISMATCH = 'VERSION_MISMATCH',

  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // App update errors
  UPDATE_NOT_AVAILABLE = 'UPDATE_NOT_AVAILABLE',
  UPDATE_IN_PROGRESS = 'UPDATE_IN_PROGRESS',
  UPDATE_CANCELLED = 'UPDATE_CANCELLED',
  PLATFORM_NOT_SUPPORTED = 'PLATFORM_NOT_SUPPORTED',

  // Review errors
  REVIEW_NOT_SUPPORTED = 'REVIEW_NOT_SUPPORTED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONDITIONS_NOT_MET = 'CONDITIONS_NOT_MET',

  // General errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Event Types
 */
export interface DownloadProgressEvent {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
  bundleId: string;
}

export interface UpdateStateChangedEvent {
  status: BundleStatus;
  bundleId: string;
  version: string;
}

export interface BackgroundUpdateProgressEvent {
  type: BackgroundUpdateType;
  status: 'checking' | 'downloading' | 'installing' | 'completed' | 'failed';
  percent?: number;
  error?: UpdateError;
}

export interface BackgroundUpdateNotificationEvent {
  type: BackgroundUpdateType;
  updateAvailable: boolean;
  version?: string;
  action?: 'shown' | 'tapped' | 'dismissed';
}

/**
 * Plugin Events
 */
export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

export interface NativeUpdateListeners {
  /**
   * Listen for download progress
   */
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (event: DownloadProgressEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listen for update state changes
   */
  addListener(
    eventName: 'updateStateChanged',
    listenerFunc: (event: UpdateStateChangedEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listen for background update progress
   */
  addListener(
    eventName: 'backgroundUpdateProgress',
    listenerFunc: (event: BackgroundUpdateProgressEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Listen for background update notifications
   */
  addListener(
    eventName: 'backgroundUpdateNotification',
    listenerFunc: (event: BackgroundUpdateNotificationEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>;
}
