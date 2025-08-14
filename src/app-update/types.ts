export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  updatePriority?: number;
  releaseNotes?: string;
  updateSize?: number;
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  clientVersionStalenessDays?: number;
  updateURL?: string;
}

export interface AppUpdateProgress {
  bytesDownloaded: number;
  totalBytesToDownload: number;
  percentComplete: number;
  downloadSpeed: number;
  estimatedTime: number;
}

export interface AppUpdateState {
  installStatus: AppUpdateInstallStatus;
  installErrorCode?: number;
  packageName: string;
  availableVersion: string;
}

export enum AppUpdateInstallStatus {
  UNKNOWN = 0,
  PENDING = 1,
  DOWNLOADING = 2,
  INSTALLING = 3,
  INSTALLED = 4,
  FAILED = 5,
  CANCELED = 6,
  DOWNLOADED = 11,
}

export interface AppUpdateOptions {
  allowedUpdateTypes?: ('immediate' | 'flexible')[];
  stalenessDays?: number;
  priority?: number;
}

export interface VersionInfo {
  currentVersion: string;
  buildNumber: string;
  packageName: string;
  platform: 'ios' | 'android' | 'web';
  availableVersion?: string;
  minimumVersion?: string;
}

export interface MinimumVersionCheck {
  isMet: boolean;
  currentVersion: string;
  minimumVersion: string;
  updateRequired: boolean;
}

export interface AppStoreInfo {
  url: string;
  platform: 'ios' | 'android' | 'web';
}
