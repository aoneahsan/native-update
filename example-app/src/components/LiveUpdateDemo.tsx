import React, { useState, useEffect } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { useUpdateContext } from '../context/UpdateContext';

export default function LiveUpdateDemo() {
  const { addLog, downloadProgress, setDownloadProgress } = useUpdateContext();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateStrategy, setUpdateStrategy] = useState<'immediate' | 'background' | 'manual'>('manual');
  const [channel, setChannel] = useState('production');
  const [bundles, setBundles] = useState<any[]>([]);

  useEffect(() => {
    loadCurrentVersion();
    loadBundles();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const current = await CapacitorNativeUpdate.getCurrentBundle();
      setCurrentVersion(current.version || '1.0.0');
      addLog('info', `Current version: ${current.version}`);
    } catch (error) {
      addLog('error', `Failed to get current version: ${error.message}`);
    }
  };

  const loadBundles = async () => {
    try {
      const result = await CapacitorNativeUpdate.getBundles();
      setBundles(result.bundles || []);
    } catch (error) {
      addLog('error', `Failed to load bundles: ${error.message}`);
    }
  };

  const checkForUpdates = async () => {
    setIsChecking(true);
    addLog('info', 'Checking for updates...');

    try {
      const result = await CapacitorNativeUpdate.checkForUpdate();
      
      if (result.available) {
        setUpdateAvailable(true);
        setLatestVersion(result.version);
        addLog('success', `Update available: v${result.version}`);
        
        if (updateStrategy === 'immediate') {
          await downloadAndApplyUpdate();
        } else if (updateStrategy === 'background') {
          downloadUpdate();
        }
      } else {
        setUpdateAvailable(false);
        addLog('info', 'No updates available');
      }
    } catch (error) {
      addLog('error', `Update check failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadUpdate = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    addLog('info', 'Starting download...');

    try {
      // Set up progress listener
      const progressListener = CapacitorNativeUpdate.addListener('downloadProgress', (progress) => {
        setDownloadProgress(progress.percent);
        addLog('info', `Download progress: ${progress.percent}%`);
      });

      const result = await CapacitorNativeUpdate.downloadUpdate({
        onProgress: (progress) => {
          setDownloadProgress(progress.percent);
        }
      });

      addLog('success', `Download complete: ${result.bundleId}`);
      progressListener.remove();
      await loadBundles();
    } catch (error) {
      addLog('error', `Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const applyUpdate = async (bundleId?: string) => {
    try {
      addLog('info', 'Applying update...');
      
      if (bundleId) {
        await CapacitorNativeUpdate.setBundle(bundleId);
      }
      
      await CapacitorNativeUpdate.applyUpdate();
      addLog('success', 'Update applied! App will restart...');
    } catch (error) {
      addLog('error', `Failed to apply update: ${error.message}`);
    }
  };

  const downloadAndApplyUpdate = async () => {
    await downloadUpdate();
    await applyUpdate();
  };

  const deleteBundle = async (bundleId: string) => {
    try {
      await CapacitorNativeUpdate.deleteBundle(bundleId);
      addLog('success', `Deleted bundle: ${bundleId}`);
      await loadBundles();
    } catch (error) {
      addLog('error', `Failed to delete bundle: ${error.message}`);
    }
  };

  const resetToOriginal = async () => {
    try {
      await CapacitorNativeUpdate.reset();
      addLog('success', 'Reset to original bundle');
      await loadCurrentVersion();
      await loadBundles();
    } catch (error) {
      addLog('error', `Failed to reset: ${error.message}`);
    }
  };

  const switchChannel = async (newChannel: string) => {
    try {
      await CapacitorNativeUpdate.setChannel(newChannel);
      setChannel(newChannel);
      addLog('success', `Switched to ${newChannel} channel`);
    } catch (error) {
      addLog('error', `Failed to switch channel: ${error.message}`);
    }
  };

  const notifyAppReady = async () => {
    try {
      await CapacitorNativeUpdate.notifyAppReady();
      addLog('success', 'App marked as ready');
    } catch (error) {
      addLog('error', `Failed to notify app ready: ${error.message}`);
    }
  };

  const syncUpdate = async () => {
    try {
      addLog('info', 'Starting sync...');
      const result = await CapacitorNativeUpdate.sync();
      
      switch (result.status) {
        case 'UPDATE_AVAILABLE':
          addLog('success', `Sync: Update available - v${result.version}`);
          break;
        case 'UP_TO_DATE':
          addLog('info', 'Sync: Already up to date');
          break;
        case 'ERROR':
          addLog('error', `Sync error: ${result.error?.message}`);
          break;
      }
    } catch (error) {
      addLog('error', `Sync failed: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>🚀 Live Updates (OTA)</h2>
        
        <div className="info-grid">
          <div className="info-item">
            <strong>Current Version</strong>
            <span>{currentVersion}</span>
          </div>
          <div className="info-item">
            <strong>Latest Version</strong>
            <span>{latestVersion || 'Not checked'}</span>
          </div>
          <div className="info-item">
            <strong>Update Channel</strong>
            <span>{channel}</span>
          </div>
          <div className="info-item">
            <strong>Update Available</strong>
            <span>{updateAvailable ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="toggle-group">
          <label>Update Strategy:</label>
          <select 
            value={updateStrategy} 
            onChange={(e) => setUpdateStrategy(e.target.value as any)}
          >
            <option value="manual">Manual</option>
            <option value="immediate">Immediate</option>
            <option value="background">Background</option>
          </select>

          <label>Channel:</label>
          <select 
            value={channel} 
            onChange={(e) => switchChannel(e.target.value)}
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button 
            className="button" 
            onClick={checkForUpdates}
            disabled={isChecking || isDownloading}
          >
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </button>
          
          <button 
            className="button secondary" 
            onClick={syncUpdate}
            disabled={isChecking || isDownloading}
          >
            Sync Updates
          </button>

          {updateAvailable && updateStrategy === 'manual' && (
            <button 
              className="button secondary" 
              onClick={downloadUpdate}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download Update'}
            </button>
          )}

          <button 
            className="button" 
            onClick={notifyAppReady}
          >
            Notify App Ready
          </button>

          <button 
            className="button danger" 
            onClick={resetToOriginal}
          >
            Reset to Original
          </button>
        </div>

        {isDownloading && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${downloadProgress}%` }}
            >
              {downloadProgress}%
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>📦 Bundle Management</h2>
        
        {bundles.length > 0 ? (
          <div className="bundle-list">
            {bundles.map((bundle) => (
              <div key={bundle.bundleId} className="bundle-item">
                <div className="bundle-info">
                  <strong>Version {bundle.version}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ID: {bundle.bundleId}<br />
                    Size: {(bundle.size / 1024 / 1024).toFixed(2)} MB<br />
                    Status: {bundle.status}
                  </div>
                </div>
                <div className="bundle-actions">
                  <button 
                    className="button secondary" 
                    onClick={() => applyUpdate(bundle.bundleId)}
                    disabled={bundle.status === 'ACTIVE'}
                  >
                    Apply
                  </button>
                  <button 
                    className="button danger" 
                    onClick={() => deleteBundle(bundle.bundleId)}
                    disabled={bundle.status === 'ACTIVE'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No bundles downloaded yet</p>
        )}

        <button 
          className="button" 
          onClick={loadBundles}
          style={{ marginTop: '10px' }}
        >
          Refresh Bundles
        </button>
      </div>
    </div>
  );
}