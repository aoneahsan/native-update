import { Validator } from '../security/validator';
import type { LatestVersion } from '../definitions';

/**
 * Manages version checking and comparison
 */
export class VersionManager {
  private static readonly VERSION_CHECK_CACHE_KEY =
    'capacitor_native_update_version_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check for latest version from server
   */
  static async checkForUpdates(
    serverUrl: string,
    channel: string,
    currentVersion: string,
    appId: string
  ): Promise<LatestVersion | null> {
    // Check cache first
    const cached = this.getCachedVersionInfo();
    if (
      cached &&
      cached.channel === channel &&
      Date.now() - cached.timestamp < this.CACHE_DURATION
    ) {
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
      });

      if (!response.ok) {
        throw new Error(`Version check failed: ${response.status}`);
      }

      const data = await response.json();

      // Validate response
      if (data.version && !Validator.validateVersion(data.version).valid) {
        throw new Error('Invalid version format in response');
      }

      // Cache the result
      this.cacheVersionInfo(channel, data);

      return data;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Compare two versions
   */
  static isNewerVersion(version1: string, version2: string): boolean {
    return Validator.compareVersions(version1, version2) > 0;
  }

  /**
   * Check if update is mandatory based on minimum version
   */
  static isUpdateMandatory(
    currentVersion: string,
    minimumVersion?: string
  ): boolean {
    if (!minimumVersion) return false;

    return Validator.compareVersions(currentVersion, minimumVersion) < 0;
  }

  /**
   * Parse version metadata
   */
  static parseVersionMetadata(version: string): {
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
      throw new Error('Invalid version format');
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
  static buildVersionString(components: {
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
  static isCompatibleWithNativeVersion(
    bundleVersion: string,
    nativeVersion: string,
    compatibility?: { [key: string]: string }
  ): boolean {
    if (!compatibility) return true;

    // Check if there's a specific native version requirement for this bundle version
    const requiredNativeVersion = compatibility[bundleVersion];
    if (!requiredNativeVersion) return true;

    return Validator.compareVersions(nativeVersion, requiredNativeVersion) >= 0;
  }

  /**
   * Get version from cache
   */
  private static getCachedVersionInfo(): {
    channel: string;
    data: LatestVersion;
    timestamp: number;
  } | null {
    try {
      const cached = localStorage.getItem(this.VERSION_CHECK_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache version info
   */
  private static cacheVersionInfo(channel: string, data: LatestVersion): void {
    try {
      localStorage.setItem(
        this.VERSION_CHECK_CACHE_KEY,
        JSON.stringify({
          channel,
          data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn('Failed to cache version info:', error);
    }
  }

  /**
   * Clear version cache
   */
  static clearVersionCache(): void {
    localStorage.removeItem(this.VERSION_CHECK_CACHE_KEY);
  }
}
