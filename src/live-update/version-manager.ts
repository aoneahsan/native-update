import type { LatestVersion } from '../definitions';
import { ConfigManager } from '../core/config';
import { Logger } from '../core/logger';
import { SecurityValidator } from '../core/security';
import { ValidationError, ErrorCode } from '../core/errors';
import type { Preferences } from '@capacitor/preferences';

interface CachedVersionInfo {
  channel: string;
  data: LatestVersion;
  timestamp: number;
}

/**
 * Manages version checking and comparison
 */
export class VersionManager {
  private readonly VERSION_CHECK_CACHE_KEY = 'capacitor_native_update_version_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private readonly securityValidator: SecurityValidator;
  private preferences: typeof Preferences | null = null;
  private memoryCache: Map<string, CachedVersionInfo> = new Map();

  constructor() {
    this.logger = Logger.getInstance();
    this.configManager = ConfigManager.getInstance();
    this.securityValidator = SecurityValidator.getInstance();
  }

  /**
   * Compare two semantic versions
   */
  static compareVersions(version1: string, version2: string): number {
    try {
      // Split version and pre-release
      const [v1Base, v1Pre] = version1.split('-');
      const [v2Base, v2Pre] = version2.split('-');
      
      const v1Parts = v1Base.split('.').map(Number);
      const v2Parts = v2Base.split('.').map(Number);
      
      // Compare major.minor.patch
      for (let i = 0; i < 3; i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part > v2Part) return 1;
        if (v1Part < v2Part) return -1;
      }
      
      // If base versions are equal, compare pre-release
      if (v1Pre && !v2Pre) return -1; // 1.0.0-alpha < 1.0.0
      if (!v1Pre && v2Pre) return 1;  // 1.0.0 > 1.0.0-alpha
      if (v1Pre && v2Pre) {
        return v1Pre.localeCompare(v2Pre);
      }
      
      return 0;
    } catch {
      if (version1 === version2) return 0;
      return version1 > version2 ? 1 : -1;
    }
  }

  /**
   * Validate semantic version format
   */
  static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(version);
  }

  /**
   * Check if update should be performed
   */
  static shouldUpdate(currentVersion: string, newVersion: string, minAppVersion?: string): boolean {
    if (minAppVersion && VersionManager.compareVersions(currentVersion, minAppVersion) < 0) {
      return false;
    }
    return VersionManager.compareVersions(currentVersion, newVersion) < 0;
  }

  /**
   * Initialize the version manager
   */
  async initialize(): Promise<void> {
    this.preferences = this.configManager.get('preferences');
    if (!this.preferences) {
      throw new ValidationError(
        ErrorCode.MISSING_DEPENDENCY,
        'Preferences not configured. Please configure the plugin first.'
      );
    }
  }

  /**
   * Check for latest version from server
   */
  async checkForUpdates(
    serverUrl: string,
    channel: string,
    currentVersion: string,
    appId: string
  ): Promise<LatestVersion | null> {
    // Validate inputs
    this.securityValidator.validateUrl(serverUrl);
    this.securityValidator.validateVersion(currentVersion);
    if (!channel || !appId) {
      throw new ValidationError(
        ErrorCode.INVALID_CONFIG,
        'Channel and appId are required'
      );
    }

    // Check cache first
    const cacheKey = `${channel}-${appId}`;
    const cached = await this.getCachedVersionInfo(cacheKey);
    if (
      cached &&
      cached.channel === channel &&
      Date.now() - cached.timestamp < this.CACHE_DURATION
    ) {
      this.logger.debug('Returning cached version info', { channel, version: cached.data.version });
      return cached.data;
    }

    try {
      const url = new URL(`${serverUrl}/check`);
      url.searchParams.append('channel', channel);
      url.searchParams.append('version', currentVersion);
      url.searchParams.append('appId', appId);
      url.searchParams.append('platform', 'web'); // Will be overridden by native platforms

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Version': currentVersion,
          'X-App-Id': appId,
        },
        signal: AbortSignal.timeout(this.configManager.get('downloadTimeout')),
      });

      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      const data = await response.json();

      // Validate response
      if (!data.version) {
        throw new ValidationError(
          ErrorCode.INVALID_BUNDLE_FORMAT,
          'No version in server response'
        );
      }

      this.securityValidator.validateVersion(data.version);

      // Additional validation
      if (data.bundleUrl) {
        this.securityValidator.validateUrl(data.bundleUrl);
      }
      if (data.minAppVersion) {
        this.securityValidator.validateVersion(data.minAppVersion);
      }

      // Cache the result
      await this.cacheVersionInfo(cacheKey, channel, data);

      this.logger.info('Version check completed', {
        channel,
        currentVersion,
        latestVersion: data.version,
        updateAvailable: this.isNewerVersion(data.version, currentVersion),
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to check for updates', error);
      return null;
    }
  }

  /**
   * Compare two versions
   */
  isNewerVersion(version1: string, version2: string): boolean {
    try {
      const v1 = this.parseVersion(version1);
      const v2 = this.parseVersion(version2);

      if (v1.major !== v2.major) return v1.major > v2.major;
      if (v1.minor !== v2.minor) return v1.minor > v2.minor;
      if (v1.patch !== v2.patch) return v1.patch > v2.patch;

      // If main versions are equal, check pre-release
      if (v1.prerelease && !v2.prerelease) return false; // v1 is pre-release, v2 is not
      if (!v1.prerelease && v2.prerelease) return true;  // v1 is not pre-release, v2 is
      if (v1.prerelease && v2.prerelease) {
        return v1.prerelease > v2.prerelease;
      }

      return false; // Versions are equal
    } catch (error) {
      this.logger.error('Failed to compare versions', { version1, version2, error });
      return false;
    }
  }

  /**
   * Check if update is mandatory based on minimum version
   */
  isUpdateMandatory(
    currentVersion: string,
    minimumVersion?: string
  ): boolean {
    if (!minimumVersion) return false;

    try {
      this.securityValidator.validateVersion(currentVersion);
      this.securityValidator.validateVersion(minimumVersion);
      return !this.isNewerVersion(currentVersion, minimumVersion) && currentVersion !== minimumVersion;
    } catch (error) {
      this.logger.error('Failed to check mandatory update', error);
      return false;
    }
  }

  /**
   * Parse version metadata
   */
  parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  } {
    const match = version.match(
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
    );

    if (!match) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Invalid version format'
      );
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5],
    };
  }

  /**
   * Generate version string from components
   */
  buildVersionString(components: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  }): string {
    let version = `${components.major}.${components.minor}.${components.patch}`;

    if (components.prerelease) {
      version += `-${components.prerelease}`;
    }

    if (components.build) {
      version += `+${components.build}`;
    }

    return version;
  }

  /**
   * Check if version is compatible with native version requirements
   */
  isCompatibleWithNativeVersion(
    bundleVersion: string,
    nativeVersion: string,
    compatibility?: { [key: string]: string }
  ): boolean {
    if (!compatibility) return true;

    try {
      // Check if there's a specific native version requirement for this bundle version
      const requiredNativeVersion = compatibility[bundleVersion];
      if (!requiredNativeVersion) return true;

      this.securityValidator.validateVersion(nativeVersion);
      this.securityValidator.validateVersion(requiredNativeVersion);

      return !this.isNewerVersion(requiredNativeVersion, nativeVersion);
    } catch (error) {
      this.logger.error('Failed to check compatibility', error);
      return false;
    }
  }

  /**
   * Get version from cache
   */
  private async getCachedVersionInfo(cacheKey: string): Promise<CachedVersionInfo | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(cacheKey);
    if (memCached && Date.now() - memCached.timestamp < this.CACHE_DURATION) {
      return memCached;
    }

    // Check persistent cache
    try {
      const { value } = await this.preferences!.get({ key: this.VERSION_CHECK_CACHE_KEY });
      if (!value) return null;

      const allCached: Record<string, CachedVersionInfo> = JSON.parse(value);
      const cached = allCached[cacheKey];
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        // Update memory cache
        this.memoryCache.set(cacheKey, cached);
        return cached;
      }
    } catch (error) {
      this.logger.debug('Failed to load cached version info', error);
    }

    return null;
  }

  /**
   * Cache version info
   */
  private async cacheVersionInfo(
    cacheKey: string,
    channel: string,
    data: LatestVersion
  ): Promise<void> {
    const cacheEntry: CachedVersionInfo = {
      channel,
      data,
      timestamp: Date.now(),
    };

    // Update memory cache
    this.memoryCache.set(cacheKey, cacheEntry);

    // Update persistent cache
    try {
      const { value } = await this.preferences!.get({ key: this.VERSION_CHECK_CACHE_KEY });
      const allCached: Record<string, CachedVersionInfo> = value ? JSON.parse(value) : {};
      
      // Clean old entries
      const now = Date.now();
      for (const key in allCached) {
        if (now - allCached[key].timestamp > this.CACHE_DURATION * 2) {
          delete allCached[key];
        }
      }

      allCached[cacheKey] = cacheEntry;

      await this.preferences!.set({
        key: this.VERSION_CHECK_CACHE_KEY,
        value: JSON.stringify(allCached)
      });
    } catch (error) {
      this.logger.warn('Failed to cache version info', error);
    }
  }

  /**
   * Clear version cache
   */
  async clearVersionCache(): Promise<void> {
    this.memoryCache.clear();
    try {
      await this.preferences!.remove({ key: this.VERSION_CHECK_CACHE_KEY });
    } catch (error) {
      this.logger.warn('Failed to clear version cache', error);
    }
  }

  /**
   * Check if downgrade protection should block update
   */
  shouldBlockDowngrade(currentVersion: string, newVersion: string): boolean {
    try {
      return this.securityValidator.isVersionDowngrade(currentVersion, newVersion);
    } catch (error) {
      this.logger.error('Failed to check downgrade', error);
      // Default to safe behavior - block if we can't determine
      return true;
    }
  }
}