import type { DownloadProgressEvent } from '../definitions';

/**
 * Manages file downloads with progress tracking
 */
export class DownloadManager {
  private static activeDownloads = new Map<string, AbortController>();

  /**
   * Download a file with progress tracking
   */
  static async download(
    url: string,
    bundleId: string,
    onProgress?: (event: DownloadProgressEvent) => void
  ): Promise<Blob> {
    // Create abort controller for this download
    const abortController = new AbortController();
    this.activeDownloads.set(bundleId, abortController);

    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      // Get total size from headers
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      // If no content length, fall back to simple download
      if (!totalBytes || !response.body) {
        return await response.blob();
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
      const blob = new Blob(chunks);
      return blob;
    } finally {
      // Clean up
      this.activeDownloads.delete(bundleId);
    }
  }

  /**
   * Cancel a download
   */
  static cancelDownload(bundleId: string): void {
    const controller = this.activeDownloads.get(bundleId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(bundleId);
    }
  }

  /**
   * Cancel all active downloads
   */
  static cancelAllDownloads(): void {
    for (const controller of this.activeDownloads.values()) {
      controller.abort();
    }
    this.activeDownloads.clear();
  }

  /**
   * Check if a download is active
   */
  static isDownloading(bundleId: string): boolean {
    return this.activeDownloads.has(bundleId);
  }

  /**
   * Get active download count
   */
  static getActiveDownloadCount(): number {
    return this.activeDownloads.size;
  }

  /**
   * Download with retry logic
   */
  static async downloadWithRetry(
    url: string,
    bundleId: string,
    maxRetries: number = 3,
    onProgress?: (event: DownloadProgressEvent) => void
  ): Promise<Blob> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay between retries (exponential backoff)
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return await this.download(url, bundleId, onProgress);
      } catch (error) {
        lastError = error as Error;

        // Don't retry if cancelled
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        console.warn(`Download attempt ${attempt + 1} failed:`, error);
      }
    }

    throw lastError || new Error('Download failed after all retries');
  }

  /**
   * Validate downloaded content
   */
  static async validateDownload(
    blob: Blob,
    expectedSize?: number
  ): Promise<boolean> {
    // Check size if provided
    if (expectedSize !== undefined && blob.size !== expectedSize) {
      console.error(
        `Size mismatch: expected ${expectedSize}, got ${blob.size}`
      );
      return false;
    }

    // Basic validation - ensure blob is not empty
    if (blob.size === 0) {
      console.error('Downloaded file is empty');
      return false;
    }

    return true;
  }

  /**
   * Convert blob to ArrayBuffer
   */
  static async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Save blob to IndexedDB or similar storage
   */
  static async saveBlob(bundleId: string, blob: Blob): Promise<void> {
    // In a real implementation, this would save to IndexedDB or similar
    // For now, we'll convert to base64 and store in localStorage
    // Note: This is not recommended for large files in production

    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    localStorage.setItem(`bundle_data_${bundleId}`, base64);
  }

  /**
   * Load blob from storage
   */
  static async loadBlob(bundleId: string): Promise<Blob | null> {
    const base64 = localStorage.getItem(`bundle_data_${bundleId}`);
    if (!base64) return null;

    try {
      const response = await fetch(base64);
      return await response.blob();
    } catch {
      return null;
    }
  }

  /**
   * Delete blob from storage
   */
  static deleteBlob(bundleId: string): void {
    localStorage.removeItem(`bundle_data_${bundleId}`);
  }
}
