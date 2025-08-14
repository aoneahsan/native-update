export enum ErrorCode {
  // Configuration errors
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',

  // Download errors
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  DOWNLOAD_TIMEOUT = 'DOWNLOAD_TIMEOUT',
  INVALID_URL = 'INVALID_URL',
  UNAUTHORIZED_HOST = 'UNAUTHORIZED_HOST',
  BUNDLE_TOO_LARGE = 'BUNDLE_TOO_LARGE',

  // Validation errors
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  VERSION_DOWNGRADE = 'VERSION_DOWNGRADE',
  INVALID_BUNDLE_FORMAT = 'INVALID_BUNDLE_FORMAT',

  // Storage errors
  STORAGE_FULL = 'STORAGE_FULL',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Update errors
  UPDATE_FAILED = 'UPDATE_FAILED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  BUNDLE_NOT_READY = 'BUNDLE_NOT_READY',

  // Platform errors
  PLATFORM_NOT_SUPPORTED = 'PLATFORM_NOT_SUPPORTED',
  NATIVE_ERROR = 'NATIVE_ERROR',
}

export class NativeUpdateError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: unknown,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NativeUpdateError';
    Object.setPrototypeOf(this, NativeUpdateError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class ConfigurationError extends NativeUpdateError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.INVALID_CONFIG, message, details);
    this.name = 'ConfigurationError';
  }
}

export class DownloadError extends NativeUpdateError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'DownloadError';
  }
}

export class ValidationError extends NativeUpdateError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'ValidationError';
  }
}

export class StorageError extends NativeUpdateError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'StorageError';
  }
}

export class UpdateError extends NativeUpdateError {
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'UpdateError';
  }
}
