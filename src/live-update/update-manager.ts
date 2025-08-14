import type { BundleInfo, UpdateOptions } from '../definitions';
import { PluginManager } from '../core/plugin-manager';
import { UpdateError, ValidationError, ErrorCode } from '../core/errors';
import { SecurityValidator } from '../core/security';
import type { Filesystem } from '@capacitor/filesystem';
import { Directory } from '@capacitor/filesystem';

interface UpdateState {
  currentBundle: BundleInfo | null;
  newBundle: BundleInfo;
  backupPath: string | null;
  startTime: number;
}

/**
 * Manages atomic bundle installation with rollback capability
 */
export class UpdateManager {
  private readonly pluginManager: PluginManager;
  private readonly securityValidator: SecurityValidator;
  private filesystem: typeof Filesystem | null = null;
  private updateInProgress = false;
  private currentState: UpdateState | null = null;

  constructor() {
    this.pluginManager = PluginManager.getInstance();
    this.securityValidator = SecurityValidator.getInstance();
  }

  /**
   * Initialize update manager
   */
  async initialize(): Promise<void> {
    this.filesystem = this.pluginManager.getConfigManager().get('filesystem');
    if (!this.filesystem) {
      throw new UpdateError(
        ErrorCode.MISSING_DEPENDENCY,
        'Filesystem not configured'
      );
    }
  }

  /**
   * Apply bundle update atomically
   */
  async applyUpdate(bundleId: string, options?: UpdateOptions): Promise<void> {
    if (this.updateInProgress) {
      throw new UpdateError(
        ErrorCode.UPDATE_FAILED,
        'Another update is already in progress'
      );
    }

    const logger = this.pluginManager.getLogger();
    const bundleManager = this.pluginManager.getBundleManager();

    try {
      this.updateInProgress = true;
      logger.info('Starting bundle update', { bundleId });

      // Get the new bundle
      const newBundle = await bundleManager.getBundle(bundleId);
      if (!newBundle) {
        throw new UpdateError(
          ErrorCode.FILE_NOT_FOUND,
          `Bundle ${bundleId} not found`
        );
      }

      // Verify bundle is ready
      if (newBundle.status !== 'READY' && newBundle.status !== 'ACTIVE') {
        throw new UpdateError(
          ErrorCode.BUNDLE_NOT_READY,
          `Bundle ${bundleId} is not ready for installation`
        );
      }

      // Get current active bundle
      const currentBundle = await bundleManager.getActiveBundle();

      // Initialize update state
      this.currentState = {
        currentBundle,
        newBundle,
        backupPath: null,
        startTime: Date.now(),
      };

      // Validate update
      await this.validateUpdate(currentBundle, newBundle, options);

      // Create backup of current state
      if (currentBundle && currentBundle.bundleId !== 'default') {
        this.currentState.backupPath = await this.createBackup(currentBundle);
      }

      // Apply the update
      await this.performUpdate(newBundle);

      // Verify the update
      await this.verifyUpdate(newBundle);

      // Mark as active
      await bundleManager.setActiveBundle(bundleId);

      // Clean up old bundles if configured
      if (options?.cleanupOldBundles) {
        await bundleManager.cleanupOldBundles(options.keepBundleCount || 3);
      }

      logger.info('Bundle update completed successfully', {
        bundleId,
        version: newBundle.version,
        duration: Date.now() - this.currentState.startTime,
      });

      // Clear state
      this.currentState = null;
    } catch (error) {
      logger.error('Bundle update failed', error);

      // Attempt rollback
      if (this.currentState) {
        await this.rollback();
      }

      throw error;
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Validate update before applying
   */
  private async validateUpdate(
    currentBundle: BundleInfo | null,
    newBundle: BundleInfo,
    options?: UpdateOptions
  ): Promise<void> {
    const logger = this.pluginManager.getLogger();
    const versionManager = this.pluginManager.getVersionManager();

    // Check if downgrade
    if (currentBundle && !options?.allowDowngrade) {
      if (
        versionManager.shouldBlockDowngrade(
          currentBundle.version,
          newBundle.version
        )
      ) {
        throw new ValidationError(
          ErrorCode.VERSION_DOWNGRADE,
          `Cannot downgrade from ${currentBundle.version} to ${newBundle.version}`
        );
      }
    }

    // Verify bundle integrity
    if (!newBundle.verified) {
      logger.warn('Bundle not verified, verifying now', {
        bundleId: newBundle.bundleId,
      });

      // Load bundle data
      const downloadManager = this.pluginManager.getDownloadManager();
      const blob = await downloadManager.loadBlob(newBundle.bundleId);

      if (!blob) {
        throw new UpdateError(
          ErrorCode.FILE_NOT_FOUND,
          'Bundle data not found'
        );
      }

      // Verify checksum
      const arrayBuffer = await blob.arrayBuffer();
      const isValid = await this.securityValidator.verifyChecksum(
        arrayBuffer,
        newBundle.checksum
      );

      if (!isValid) {
        throw new ValidationError(
          ErrorCode.CHECKSUM_MISMATCH,
          'Bundle checksum verification failed'
        );
      }

      // Verify signature if enabled
      if (newBundle.signature) {
        const signatureValid = await this.securityValidator.verifySignature(
          arrayBuffer,
          newBundle.signature
        );

        if (!signatureValid) {
          throw new ValidationError(
            ErrorCode.SIGNATURE_INVALID,
            'Bundle signature verification failed'
          );
        }
      }

      // Mark as verified
      await this.pluginManager
        .getBundleManager()
        .markBundleAsVerified(newBundle.bundleId);
    }

    logger.debug('Bundle validation passed', { bundleId: newBundle.bundleId });
  }

  /**
   * Create backup of current bundle
   */
  private async createBackup(bundle: BundleInfo): Promise<string> {
    const backupPath = `backups/${bundle.bundleId}_${Date.now()}`;
    const logger = this.pluginManager.getLogger();

    try {
      // Create backup directory
      await this.filesystem!.mkdir({
        path: backupPath,
        directory: Directory.Data,
        recursive: true,
      });

      // Copy bundle files
      await this.filesystem!.copy({
        from: bundle.path,
        to: backupPath,
        directory: Directory.Data,
      });

      logger.info('Backup created', { bundleId: bundle.bundleId, backupPath });
      return backupPath;
    } catch (error) {
      logger.error('Failed to create backup', error);
      throw new UpdateError(
        ErrorCode.UPDATE_FAILED,
        'Failed to create backup',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Perform the actual update
   */
  private async performUpdate(bundle: BundleInfo): Promise<void> {
    const logger = this.pluginManager.getLogger();

    try {
      // Extract bundle to target location
      const targetPath = `active/${bundle.bundleId}`;

      // Create target directory
      await this.filesystem!.mkdir({
        path: targetPath,
        directory: Directory.Data,
        recursive: true,
      });

      // Copy bundle files
      await this.filesystem!.copy({
        from: bundle.path,
        to: targetPath,
        directory: Directory.Data,
      });

      // Update bundle path
      bundle.path = targetPath;

      logger.debug('Bundle files installed', {
        bundleId: bundle.bundleId,
        targetPath,
      });
    } catch (error) {
      throw new UpdateError(
        ErrorCode.UPDATE_FAILED,
        'Failed to install bundle files',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Verify update was successful
   */
  private async verifyUpdate(bundle: BundleInfo): Promise<void> {
    try {
      // Check if main bundle files exist
      const indexPath = `${bundle.path}/index.html`;
      await this.filesystem!.stat({
        path: indexPath,
        directory: Directory.Data,
      });

      // Additional verification can be added here
    } catch (error) {
      throw new UpdateError(
        ErrorCode.UPDATE_FAILED,
        'Bundle verification failed after installation',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Rollback to previous state
   */
  async rollback(): Promise<void> {
    if (!this.currentState) {
      throw new UpdateError(
        ErrorCode.ROLLBACK_FAILED,
        'No update state to rollback'
      );
    }

    const logger = this.pluginManager.getLogger();
    logger.warn('Starting rollback', {
      from: this.currentState.newBundle.bundleId,
      to: this.currentState.currentBundle?.bundleId || 'default',
    });

    try {
      const bundleManager = this.pluginManager.getBundleManager();

      // Restore from backup if available
      if (this.currentState.backupPath && this.currentState.currentBundle) {
        const restoredPath = `active/${this.currentState.currentBundle.bundleId}`;

        await this.filesystem!.copy({
          from: this.currentState.backupPath,
          to: restoredPath,
          directory: Directory.Data,
        });

        // Update bundle path
        this.currentState.currentBundle.path = restoredPath;
        await bundleManager.saveBundleInfo(this.currentState.currentBundle);
      }

      // Restore active bundle
      if (this.currentState.currentBundle) {
        await bundleManager.setActiveBundle(
          this.currentState.currentBundle.bundleId
        );
      } else {
        // No previous bundle, clear active
        await bundleManager.clearActiveBundle();
      }

      logger.info('Rollback completed successfully');
    } catch (error) {
      logger.error('Rollback failed', error);
      throw new UpdateError(
        ErrorCode.ROLLBACK_FAILED,
        'Failed to rollback update',
        undefined,
        error as Error
      );
    } finally {
      // Clean up backup
      if (this.currentState.backupPath) {
        try {
          await this.filesystem!.rmdir({
            path: this.currentState.backupPath,
            directory: Directory.Data,
            recursive: true,
          });
        } catch (error) {
          logger.warn('Failed to clean up backup', error);
        }
      }
    }
  }

  /**
   * Get current update progress
   */
  getUpdateProgress(): {
    inProgress: boolean;
    bundleId?: string;
    startTime?: number;
  } {
    return {
      inProgress: this.updateInProgress,
      bundleId: this.currentState?.newBundle.bundleId,
      startTime: this.currentState?.startTime,
    };
  }

  /**
   * Cancel current update (if possible)
   */
  async cancelUpdate(): Promise<void> {
    if (!this.updateInProgress || !this.currentState) {
      return;
    }

    const logger = this.pluginManager.getLogger();
    logger.warn('Cancelling update', {
      bundleId: this.currentState.newBundle.bundleId,
    });

    // Attempt rollback
    await this.rollback();

    this.updateInProgress = false;
    this.currentState = null;
  }
}
