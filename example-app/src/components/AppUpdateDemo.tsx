import React, { useState } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { useUpdateContext } from '../context/UpdateContext';

export default function AppUpdateDemo() {
  const { addLog } = useUpdateContext();
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [installStatus, setInstallStatus] = useState<number>(0);

  const checkAppUpdate = async () => {
    setIsChecking(true);
    addLog('info', 'Checking for app store updates...');

    try {
      const result = await CapacitorNativeUpdate.checkAppUpdate();
      setUpdateInfo(result);

      if (result.updateAvailable) {
        addLog('success', `App update available: v${result.availableVersion}`);
        addLog('info', `Update type: ${result.updatePriority}`);
        
        if (result.immediateUpdateAllowed) {
          addLog('warning', 'Immediate (blocking) update is required');
        } else if (result.flexibleUpdateAllowed) {
          addLog('info', 'Flexible (background) update is available');
        }
      } else {
        addLog('info', 'App is up to date');
      }
    } catch (error) {
      addLog('error', `Failed to check app update: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const startImmediateUpdate = async () => {
    try {
      addLog('info', 'Starting immediate update...');
      
      // Set up install state listener
      const stateListener = CapacitorNativeUpdate.addListener('appUpdateStateChanged', (state) => {
        setInstallStatus(state.installStatus);
        addLog('info', `Update state: ${state.installStatus}`);
      });

      await CapacitorNativeUpdate.startImmediateUpdate();
      addLog('success', 'Immediate update started');
      
      stateListener.remove();
    } catch (error) {
      addLog('error', `Failed to start immediate update: ${error.message}`);
    }
  };

  const startFlexibleUpdate = async () => {
    try {
      addLog('info', 'Starting flexible update...');
      
      // Set up progress listener
      const progressListener = CapacitorNativeUpdate.addListener('appUpdateProgress', (progress) => {
        setInstallStatus(progress.bytesDownloaded / progress.totalBytesToDownload * 100);
        addLog('info', `Download progress: ${Math.round(progress.bytesDownloaded / progress.totalBytesToDownload * 100)}%`);
      });

      await CapacitorNativeUpdate.startFlexibleUpdate();
      addLog('success', 'Flexible update started');
      
      progressListener.remove();
    } catch (error) {
      addLog('error', `Failed to start flexible update: ${error.message}`);
    }
  };

  const completeFlexibleUpdate = async () => {
    try {
      addLog('info', 'Completing flexible update...');
      await CapacitorNativeUpdate.completeFlexibleUpdate();
      addLog('success', 'Update will be installed on next app restart');
    } catch (error) {
      addLog('error', `Failed to complete update: ${error.message}`);
    }
  };

  const openAppStore = async () => {
    try {
      addLog('info', 'Opening app store...');
      await CapacitorNativeUpdate.openAppStore();
      addLog('success', 'App store opened');
    } catch (error) {
      addLog('error', `Failed to open app store: ${error.message}`);
    }
  };

  const getAppStoreUrl = async () => {
    try {
      const result = await CapacitorNativeUpdate.getAppStoreUrl();
      addLog('info', `App Store URL: ${result.url}`);
      navigator.clipboard.writeText(result.url);
      addLog('success', 'URL copied to clipboard');
    } catch (error) {
      addLog('error', `Failed to get app store URL: ${error.message}`);
    }
  };

  const checkMinimumVersion = async () => {
    try {
      const result = await CapacitorNativeUpdate.isMinimumVersionMet();
      if (result.isMet) {
        addLog('success', 'App meets minimum version requirement');
      } else {
        addLog('warning', `App needs update. Min version: ${result.minimumVersion}, Current: ${result.currentVersion}`);
      }
    } catch (error) {
      addLog('error', `Failed to check minimum version: ${error.message}`);
    }
  };

  const getVersionInfo = async () => {
    try {
      const result = await CapacitorNativeUpdate.getVersionInfo();
      addLog('info', `Current version: ${result.currentVersion}`);
      addLog('info', `Build number: ${result.buildNumber}`);
      if (result.availableVersion) {
        addLog('info', `Available version: ${result.availableVersion}`);
      }
    } catch (error) {
      addLog('error', `Failed to get version info: ${error.message}`);
    }
  };

  return (
    <div className="card">
      <h2>📱 Native App Updates</h2>
      
      {updateInfo && (
        <div className="info-grid">
          <div className="info-item">
            <strong>Update Available</strong>
            <span>{updateInfo.updateAvailable ? 'Yes' : 'No'}</span>
          </div>
          <div className="info-item">
            <strong>Current Version</strong>
            <span>{updateInfo.currentVersion || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <strong>Available Version</strong>
            <span>{updateInfo.availableVersion || 'N/A'}</span>
          </div>
          <div className="info-item">
            <strong>Update Priority</strong>
            <span>{updateInfo.updatePriority || 'Normal'}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button 
          className="button" 
          onClick={checkAppUpdate}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Check App Store Update'}
        </button>

        <button 
          className="button secondary" 
          onClick={getVersionInfo}
        >
          Get Version Info
        </button>

        <button 
          className="button secondary" 
          onClick={checkMinimumVersion}
        >
          Check Min Version
        </button>

        <button 
          className="button" 
          onClick={openAppStore}
        >
          Open App Store
        </button>

        <button 
          className="button secondary" 
          onClick={getAppStoreUrl}
        >
          Copy Store URL
        </button>
      </div>

      {updateInfo?.updateAvailable && (
        <div style={{ marginTop: '20px' }}>
          <h3>Update Options</h3>
          
          {updateInfo.immediateUpdateAllowed && (
            <button 
              className="button danger" 
              onClick={startImmediateUpdate}
            >
              Start Immediate Update (Blocking)
            </button>
          )}

          {updateInfo.flexibleUpdateAllowed && (
            <>
              <button 
                className="button secondary" 
                onClick={startFlexibleUpdate}
              >
                Start Flexible Update (Background)
              </button>

              {installStatus > 0 && installStatus < 100 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${installStatus}%` }}
                  >
                    {Math.round(installStatus)}%
                  </div>
                </div>
              )}

              {installStatus === 100 && (
                <button 
                  className="button secondary" 
                  onClick={completeFlexibleUpdate}
                >
                  Complete Update Installation
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="status info" style={{ marginTop: '20px' }}>
        <strong>Note:</strong> App store updates behavior varies by platform:
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Android: Uses Google Play Core for in-app updates</li>
          <li>iOS: Opens App Store (in-app updates not supported)</li>
          <li>Web: Shows update notification only</li>
        </ul>
      </div>
    </div>
  );
}