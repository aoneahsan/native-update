import type { Filesystem } from '@capacitor/filesystem';
import type { Preferences } from '@capacitor/preferences';
import type {
  UpdateStrategy,
  ChecksumAlgorithm,
  SecurityConfig,
} from '../definitions';

export interface PluginConfig {
  filesystem?: typeof Filesystem;
  preferences?: typeof Preferences;
  baseUrl?: string;
  allowedHosts?: string[];
  maxBundleSize?: number;
  downloadTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableSignatureValidation?: boolean;
  publicKey?: string;
  cacheExpiration?: number;
  enableLogging?: boolean;
  serverUrl?: string;
  channel?: string;
  autoCheck?: boolean;
  autoUpdate?: boolean;
  updateStrategy?: UpdateStrategy;
  requireSignature?: boolean;
  checksumAlgorithm?: ChecksumAlgorithm;
  checkInterval?: number;
  security?: SecurityConfig;
  // App review config
  promptAfterPositiveEvents?: boolean;
  maxPromptsPerVersion?: number;
  minimumDaysSinceLastPrompt?: number;
  isPremiumUser?: boolean;
  // Platform-specific config
  appStoreId?: string;
  iosAppId?: string;
  packageName?: string;
  webReviewUrl?: string;
  minimumVersion?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Required<PluginConfig>;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private getDefaultConfig(): Required<PluginConfig> {
    return {
      filesystem: null as unknown as typeof Filesystem,
      preferences: null as unknown as typeof Preferences,
      baseUrl: '',
      allowedHosts: [],
      maxBundleSize: 100 * 1024 * 1024, // 100MB
      downloadTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      enableSignatureValidation: true,
      publicKey: '',
      cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
      enableLogging: false,
      serverUrl: '',
      channel: 'production',
      autoCheck: true,
      autoUpdate: false,
      updateStrategy: 'background' as UpdateStrategy,
      requireSignature: true,
      checksumAlgorithm: 'SHA-256' as ChecksumAlgorithm,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      security: {
        enforceHttps: true,
        validateInputs: true,
        secureStorage: true,
        logSecurityEvents: false,
      },
      // App review config
      promptAfterPositiveEvents: false,
      maxPromptsPerVersion: 1,
      minimumDaysSinceLastPrompt: 7,
      isPremiumUser: false,
      // Platform-specific config
      appStoreId: '',
      iosAppId: '',
      packageName: '',
      webReviewUrl: '',
      minimumVersion: '1.0.0',
    };
  }

  configure(config: PluginConfig): void {
    this.config = { ...this.config, ...config };
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.maxBundleSize <= 0) {
      throw new Error('maxBundleSize must be greater than 0');
    }
    if (this.config.downloadTimeout <= 0) {
      throw new Error('downloadTimeout must be greater than 0');
    }
    if (this.config.retryAttempts < 0) {
      throw new Error('retryAttempts must be non-negative');
    }
    if (this.config.retryDelay < 0) {
      throw new Error('retryDelay must be non-negative');
    }
  }

  get<K extends keyof Required<PluginConfig>>(
    key: K
  ): Required<PluginConfig>[K] {
    return this.config[key];
  }

  set<K extends keyof Required<PluginConfig>>(
    key: K,
    value: Required<PluginConfig>[K]
  ): void {
    this.config[key] = value;
  }

  getAll(): Required<PluginConfig> {
    return { ...this.config };
  }

  isConfigured(): boolean {
    return !!(this.config.filesystem && this.config.preferences);
  }
}
