import React, { useState, useEffect } from 'react';
import type { UpdateService } from '../services/update-service';
import type {
  BundleInfo,
  LatestVersion,
  SyncResult,
} from 'native-update';

interface LiveUpdatePanelProps {
  updateService: UpdateService;
}

export const LiveUpdatePanel: React.FC<LiveUpdatePanelProps> = ({
  updateService,
}) => {
  const [currentBundle, setCurrentBundle] = useState<BundleInfo | null>(null);
  const [bundles, setBundles] = useState<BundleInfo[]>([]);
  const [latestVersion, setLatestVersion] = useState<LatestVersion | null>(
    null
  );
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('production');

  useEffect(() => {
    loadBundleInfo();

    // Set up progress listener
    updateService.onDownloadProgress((event) => {
      setDownloadProgress(event.percent);
    });
  }, [updateService]);

  const loadBundleInfo = async () => {
    try {
      const current = await updateService.getCurrentBundle();
      setCurrentBundle(current);

      const allBundles = await updateService.listBundles();
      setBundles(allBundles);
    } catch (error) {
      console.error('Failed to load bundle info:', error);
    }
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      const result = await updateService.checkForUpdates();

      if (result.status === 'UPDATE_AVAILABLE') {
        const latest = await updateService.getLatestVersion();
        setLatestVersion(latest);
        setMessage({
          type: 'info',
          text: `Update available: v${result.version}`,
        });
      } else if (result.status === 'UP_TO_DATE') {
        setMessage({ type: 'success', text: 'You have the latest version' });
      } else {
        setMessage({
          type: 'error',
          text: result.error?.message || 'Update check failed',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check for updates' });
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!latestVersion || !latestVersion.url) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const bundle = await updateService.downloadUpdate(
        latestVersion.url,
        latestVersion.version!,
        latestVersion.checksum || ''
      );

      setMessage({ type: 'success', text: 'Update downloaded successfully' });

      // Ask user to apply update
      if (confirm('Update downloaded. Apply now?')) {
        await updateService.applyUpdate(bundle);
        setMessage({ type: 'info', text: 'Update applied. Reloading app...' });

        setTimeout(() => {
          updateService.reloadApp();
        }, 2000);
      }

      await loadBundleInfo();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download update' });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const applyBundle = async (bundle: BundleInfo) => {
    try {
      await updateService.applyUpdate(bundle);
      setMessage({
        type: 'success',
        text: 'Bundle applied. Reload to see changes.',
      });
      await loadBundleInfo();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to apply bundle' });
    }
  };

  const deleteBundle = async (bundleId: string) => {
    if (!confirm('Delete this bundle?')) return;

    try {
      await updateService.deleteBundle(bundleId);
      setMessage({ type: 'success', text: 'Bundle deleted' });
      await loadBundleInfo();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete bundle' });
    }
  };

  const resetToOriginal = async () => {
    if (!confirm('Reset to original bundle? This will delete all updates.'))
      return;

    try {
      await updateService.resetToOriginal();
      setMessage({ type: 'success', text: 'Reset to original bundle' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset' });
    }
  };

  const changeChannel = async (channel: string) => {
    try {
      await updateService.setChannel(channel);
      setSelectedChannel(channel);
      setMessage({ type: 'success', text: `Switched to ${channel} channel` });
      setLatestVersion(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change channel' });
    }
  };

  const cleanupOldBundles = async () => {
    try {
      await updateService.cleanupOldBundles(3);
      setMessage({ type: 'success', text: 'Old bundles cleaned up' });
      await loadBundleInfo();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cleanup bundles' });
    }
  };

  return (
    <div className='panel'>
      <h2>Live Updates (OTA)</h2>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className='panel-section'>
        <h3>Current Bundle</h3>
        <div className='info-group'>
          <span className='info-label'>Version:</span>
          <span className='info-value'>
            {currentBundle?.version || 'Unknown'}
          </span>
        </div>
        <div className='info-group'>
          <span className='info-label'>Bundle ID:</span>
          <span className='info-value'>
            {currentBundle?.bundleId || 'Unknown'}
          </span>
        </div>
        <div className='info-group'>
          <span className='info-label'>Status:</span>
          <span
            className={`status-badge ${currentBundle?.status.toLowerCase()}`}
          >
            {currentBundle?.status || 'Unknown'}
          </span>
        </div>
      </div>

      <div className='panel-section'>
        <h3>Update Channel</h3>
        <div className='channel-selector'>
          <select
            value={selectedChannel}
            onChange={(e) => changeChannel(e.target.value)}
          >
            <option value='production'>Production</option>
            <option value='staging'>Staging</option>
            <option value='development'>Development</option>
          </select>
        </div>

        <div className='button-group'>
          <button
            className='primary'
            onClick={checkForUpdates}
            disabled={isChecking || isDownloading}
          >
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </button>

          {latestVersion?.available && (
            <button
              className='primary'
              onClick={downloadAndInstall}
              disabled={isDownloading}
            >
              {isDownloading
                ? 'Downloading...'
                : `Download v${latestVersion.version}`}
            </button>
          )}
        </div>

        {isDownloading && (
          <div className='progress-bar'>
            <div
              className='progress-fill'
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
      </div>

      <div className='panel-section'>
        <h3>Downloaded Bundles</h3>
        {bundles.length === 0 ? (
          <p>No bundles downloaded</p>
        ) : (
          <ul className='bundle-list'>
            {bundles.map((bundle) => (
              <li
                key={bundle.bundleId}
                className='bundle-item'
              >
                <div className='bundle-info'>
                  <div className='bundle-version'>v{bundle.version}</div>
                  <div className='bundle-meta'>
                    {updateService.formatDate(bundle.downloadTime)} ·
                    {updateService.formatBytes(bundle.size)} ·
                    <span
                      className={`status-badge ${bundle.status.toLowerCase()}`}
                    >
                      {bundle.status}
                    </span>
                  </div>
                </div>
                <div className='button-group'>
                  {bundle.status !== 'ACTIVE' && (
                    <button
                      className='secondary'
                      onClick={() => applyBundle(bundle)}
                    >
                      Apply
                    </button>
                  )}
                  <button
                    className='danger'
                    onClick={() => deleteBundle(bundle.bundleId)}
                    disabled={bundle.status === 'ACTIVE'}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className='button-group'>
          <button
            className='secondary'
            onClick={cleanupOldBundles}
          >
            Cleanup Old Bundles
          </button>
          <button
            className='danger'
            onClick={resetToOriginal}
          >
            Reset to Original
          </button>
          <button
            className='secondary'
            onClick={() => updateService.reloadApp()}
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
};
