import type { DownloadProgressEvent } from '../definitions';
import { ConfigManager } from '../core/config';
import { Logger } from '../core/logger';
import { DownloadError, ErrorCode, ValidationError } from '../core/errors';
import type { Filesystem } from '@capacitor/filesystem';
import { Directory } from '@capacitor/filesystem';

interface DownloadState {
  controller: AbortController;
  startTime: number;
  resumePosition?: number;
}

/**
 * Manages file downloads with progress tracking and resume capability
 */
export class DownloadManager {
  private activeDownloads = new Map<string, DownloadState>();
  private readonly logger: Logger;
  private readonly configManager: ConfigManager;
  private filesystem: typeof Filesystem | null = null;

  constructor() {
    this.logger = Logger.getInstance();
    this.configManager = ConfigManager.getInstance();
  }

  /**
   * Initialize the download manager
   */
  async initialize(): Promise<void> {
    this.filesystem = this.configManager.get('filesystem');
    if (!this.filesystem) {
      throw new DownloadError(
        ErrorCode.MISSING_DEPENDENCY,
        'Filesystem not configured. Please configure the plugin first.'
      );
    }
  }

  /**
   * Validate URL against allowed hosts
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);

      // Ensure HTTPS
      if (parsedUrl.protocol !== 'https:') {
        throw new ValidationError(
          ErrorCode.INVALID_URL,
          'Only HTTPS URLs are allowed for security reasons'
        );
      }

      // Check against allowed hosts if configured
      const allowedHosts = this.configManager.get('allowedHosts');
      if (
        allowedHosts.length > 0 &&
        !allowedHosts.includes(parsedUrl.hostname)
      ) {
        throw new ValidationError(
          ErrorCode.UNAUTHORIZED_HOST,
          `Host ${parsedUrl.hostname} is not in the allowed hosts list`
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(ErrorCode.INVALID_URL, 'Invalid URL format');
    }
  }

  /**
   * Download a file with progress tracking
   */
  async download(
    url: string,
    bundleId: string,
    onProgress?: (event: DownloadProgressEvent) => void
  ): Promise<Blob> {
    // Validate inputs
    this.validateUrl(url);
    if (!bundleId) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Bundle ID is required'
      );
    }

    // Check if already downloading
    if (this.activeDownloads.has(bundleId)) {
      throw new DownloadError(
        ErrorCode.DOWNLOAD_FAILED,
        `Download already in progress for bundle ${bundleId}`
      );
    }

    // Create abort controller for this download
    const abortController = new AbortController();
    const downloadState: DownloadState = {
      controller: abortController,
      startTime: Date.now(),
    };
    this.activeDownloads.set(bundleId, downloadState);

    try {
      const timeout = this.configManager.get('downloadTimeout');
      const timeoutId = setTimeout(() => abortController.abort(), timeout);

      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/octet-stream, application/zip',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new DownloadError(
          ErrorCode.DOWNLOAD_FAILED,
          `Download failed: ${response.status} ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (contentType && !this.isValidContentType(contentType)) {
        throw new ValidationError(
          ErrorCode.INVALID_BUNDLE_FORMAT,
          `Invalid content type: ${contentType}`
        );
      }

      // Get total size from headers
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // Check size limit
      if (totalBytes > this.configManager.get('maxBundleSize')) {
        throw new ValidationError(
          ErrorCode.BUNDLE_TOO_LARGE,
          `Bundle size ${totalBytes} exceeds maximum allowed size`
        );
      }

      // If no content length, fall back to simple download
      if (!totalBytes || !response.body) {
        const blob = await response.blob();
        this.validateBlobSize(blob);
        return blob;
      }

      // Stream the response with progress tracking
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        // Check if size exceeds limit during download
        if (receivedBytes > this.configManager.get('maxBundleSize')) {
          throw new ValidationError(
            ErrorCode.BUNDLE_TOO_LARGE,
            `Download size exceeds maximum allowed size`
          );
        }

        // Report progress
        if (onProgress) {
          const percent = Math.round((receivedBytes / totalBytes) * 100);
          onProgress({
            percent,
            bytesDownloaded: receivedBytes,
            totalBytes,
            bundleId,
          });
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks as BlobPart[]);
      this.validateBlobSize(blob);

      this.logger.info('Download completed', {
        bundleId,
        size: blob.size,
        duration: Date.now() - downloadState.startTime,
      });

      return blob;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const isTimeout =
          Date.now() - downloadState.startTime >=
          this.configManager.get('downloadTimeout');
        throw new DownloadError(
          isTimeout ? ErrorCode.DOWNLOAD_TIMEOUT : ErrorCode.DOWNLOAD_FAILED,
          isTimeout ? 'Download timed out' : 'Download cancelled',
          undefined,
          error
        );
      }
      throw error;
    } finally {
      // Clean up
      this.activeDownloads.delete(bundleId);
    }
  }

  /**
   * Validate content type
   */
  private isValidContentType(contentType: string): boolean {
    const validTypes = [
      'application/octet-stream',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-zip',
    ];
    return validTypes.some((type) => contentType.includes(type));
  }

  /**
   * Validate blob size
   */
  private validateBlobSize(blob: Blob): void {
    if (blob.size === 0) {
      throw new ValidationError(
        ErrorCode.INVALID_BUNDLE_FORMAT,
        'Downloaded file is empty'
      );
    }
    if (blob.size > this.configManager.get('maxBundleSize')) {
      throw new ValidationError(
        ErrorCode.BUNDLE_TOO_LARGE,
        `File size ${blob.size} exceeds maximum allowed size`
      );
    }
  }

  /**
   * Cancel a download
   */
  cancelDownload(bundleId: string): void {
    const state = this.activeDownloads.get(bundleId);
    if (state) {
      state.controller.abort();
      this.activeDownloads.delete(bundleId);
      this.logger.info('Download cancelled', { bundleId });
    }
  }

  /**
   * Cancel all active downloads
   */
  cancelAllDownloads(): void {
    for (const state of this.activeDownloads.values()) {
      state.controller.abort();
    }
    const count = this.activeDownloads.size;
    this.activeDownloads.clear();
    if (count > 0) {
      this.logger.info('All downloads cancelled', { count });
    }
  }

  /**
   * Check if a download is active
   */
  isDownloading(bundleId: string): boolean {
    return this.activeDownloads.has(bundleId);
  }

  /**
   * Get active download count
   */
  getActiveDownloadCount(): number {
    return this.activeDownloads.size;
  }

  /**
   * Download with retry logic
   */
  async downloadWithRetry(
    url: string,
    bundleId: string,
    onProgress?: (event: DownloadProgressEvent) => void
  ): Promise<Blob> {
    const maxRetries = this.configManager.get('retryAttempts');
    const retryDelay = this.configManager.get('retryDelay');
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay between retries (exponential backoff)
        if (attempt > 0) {
          const delay = Math.min(retryDelay * Math.pow(2, attempt - 1), 30000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          this.logger.debug('Retrying download', { bundleId, attempt, delay });
        }

        return await this.download(url, bundleId, onProgress);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if cancelled or validation error
        if (
          error instanceof ValidationError ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          throw error;
        }

        this.logger.warn(`Download attempt ${attempt + 1} failed`, {
          bundleId,
          error,
        });
      }
    }

    throw new DownloadError(
      ErrorCode.DOWNLOAD_FAILED,
      'Download failed after all retries',
      { attempts: maxRetries },
      lastError || undefined
    );
  }

  /**
   * Convert blob to ArrayBuffer
   */
  async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return blob.arrayBuffer();
  }

  /**
   * Save blob to filesystem
   */
  async saveBlob(bundleId: string, blob: Blob): Promise<string> {
    if (!this.filesystem) {
      throw new DownloadError(
        ErrorCode.MISSING_DEPENDENCY,
        'Filesystem not initialized'
      );
    }

    const arrayBuffer = await this.blobToArrayBuffer(blob);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const path = `bundles/${bundleId}/bundle.zip`;
    await this.filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    this.logger.debug('Bundle saved to filesystem', {
      bundleId,
      path,
      size: blob.size,
    });
    return path;
  }

  /**
   * Load blob from filesystem
   */
  async loadBlob(bundleId: string): Promise<Blob | null> {
    if (!this.filesystem) {
      throw new DownloadError(
        ErrorCode.MISSING_DEPENDENCY,
        'Filesystem not initialized'
      );
    }

    try {
      const path = `bundles/${bundleId}/bundle.zip`;
      const result = await this.filesystem.readFile({
        path,
        directory: Directory.Data,
      });

      const binaryString = atob(result.data as string);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: 'application/zip' });
    } catch (error) {
      this.logger.debug('Failed to load bundle from filesystem', {
        bundleId,
        error,
      });
      return null;
    }
  }

  /**
   * Delete blob from filesystem
   */
  async deleteBlob(bundleId: string): Promise<void> {
    if (!this.filesystem) {
      throw new DownloadError(
        ErrorCode.MISSING_DEPENDENCY,
        'Filesystem not initialized'
      );
    }

    try {
      const path = `bundles/${bundleId}`;
      await this.filesystem.rmdir({
        path,
        directory: Directory.Data,
        recursive: true,
      });
      this.logger.debug('Bundle deleted from filesystem', { bundleId });
    } catch (error) {
      this.logger.warn('Failed to delete bundle from filesystem', {
        bundleId,
        error,
      });
    }
  }
}
