import { PluginConfig } from '../core/config';
import { Logger } from '../core/logger';
import { AppUpdateInfo, AppUpdateOptions } from './types';

export class AppUpdateChecker {
  private config: PluginConfig;
  private logger: Logger;

  constructor(config: PluginConfig) {
    this.config = config;
    this.logger = new Logger('AppUpdateChecker');
  }

  async checkServerVersion(options?: AppUpdateOptions): Promise<Partial<AppUpdateInfo>> {
    if (!this.config.updateUrl) {
      return {};
    }

    try {
      const url = new URL(`${this.config.updateUrl}/app-version`);
      url.searchParams.append('platform', this.getPlatform());
      url.searchParams.append('current', await this.getCurrentVersion());
      
      if (this.config.channel) {
        url.searchParams.append('channel', this.config.channel);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-App-Version': await this.getCurrentVersion(),
          'X-App-Platform': this.getPlatform()
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      return {
        availableVersion: data.version,
        updatePriority: data.priority,
        releaseNotes: data.releaseNotes,
        updateSize: data.size,
        updateURL: data.downloadUrl
      };
    } catch (error) {
      this.logger.error('Failed to check server version', error);
      return {};
    }
  }

  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  isUpdateRequired(
    currentVersion: string,
    availableVersion: string,
    minimumVersion?: string
  ): boolean {
    // Check if current version is less than available
    if (this.compareVersions(currentVersion, availableVersion) < 0) {
      return true;
    }
    
    // Check if current version meets minimum requirement
    if (minimumVersion && this.compareVersions(currentVersion, minimumVersion) < 0) {
      return true;
    }
    
    return false;
  }

  determineUpdatePriority(
    versionDiff: string,
    stalenessDays?: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE' {
    // Parse version difference
    const [major, minor, patch] = versionDiff.split('.').map(Number);
    
    // Major version change = IMMEDIATE
    if (major > 0) {
      return 'IMMEDIATE';
    }
    
    // Minor version with high staleness = HIGH
    if (minor > 0 && stalenessDays && stalenessDays > 30) {
      return 'HIGH';
    }
    
    // Minor version = MEDIUM
    if (minor > 0) {
      return 'MEDIUM';
    }
    
    // Patch version = LOW
    return 'LOW';
  }

  private async getCurrentVersion(): Promise<string> {
    // This would be implemented by the native platform
    return '1.0.0';
  }

  private getPlatform(): string {
    // Detect platform
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      if (/android/i.test(userAgent)) {
        return 'android';
      } else if (/iPad|iPhone|iPod/.test(userAgent)) {
        return 'ios';
      }
    }
    return 'web';
  }
}