import React, { useState, useEffect } from 'react';
import type { UpdateService } from '../services/update-service';
import type { AppUpdateInfo } from 'native-update';

interface AppUpdatePanelProps {
  updateService: UpdateService;
}

export const AppUpdatePanel: React.FC<AppUpdatePanelProps> = ({
  updateService,
}) => {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    // Check for app updates on component mount
    checkForAppUpdates();
  }, []);

  const checkForAppUpdates = async () => {
    setIsChecking(true);
    setMessage(null);

    try {
      const info = await updateService.checkAppStoreUpdate();
      setUpdateInfo(info);

      if (info.updateAvailable) {
        setMessage({
          type: 'info',
          text: `New version ${info.availableVersion} is available in the app store!`,
        });
      } else {
        setMessage({
          type: 'success',
          text: 'You have the latest app version',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check for app updates' });
    } finally {
      setIsChecking(false);
    }
  };

  const performImmediateUpdate = async () => {
    try {
      await updateService.performImmediateUpdate();
      // On Android, this will start the update flow
      // The app will be restarted after successful update
    } catch (error: any) {
      if (error?.code === 'UPDATE_CANCELLED') {
        setMessage({ type: 'info', text: 'Update cancelled by user' });
      } else if (error?.code === 'PLATFORM_NOT_SUPPORTED') {
        // On iOS, open the App Store instead
        await updateService.openAppStore();
      } else {
        setMessage({ type: 'error', text: 'Failed to start update' });
      }
    }
  };

  const openAppStore = async () => {
    try {
      await updateService.openAppStore();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open app store' });
    }
  };

  const getUpdatePriorityText = (priority?: number): string => {
    if (!priority) return 'Normal';
    if (priority >= 5) return 'Critical';
    if (priority >= 3) return 'High';
    return 'Normal';
  };

  const getUpdatePriorityColor = (priority?: number): string => {
    if (!priority) return 'info';
    if (priority >= 5) return 'danger';
    if (priority >= 3) return 'warning';
    return 'info';
  };

  return (
    <div className='panel'>
      <h2>Native App Updates</h2>

      {message && <div className={`alert ${message.type}`}>{message.text}</div>}

      <div className='panel-section'>
        <h3>Current Version</h3>
        <div className='info-group'>
          <span className='info-label'>Installed Version:</span>
          <span className='info-value'>
            {updateInfo?.currentVersion || 'Unknown'}
          </span>
        </div>

        {updateInfo?.updateAvailable && (
          <>
            <div className='info-group'>
              <span className='info-label'>Available Version:</span>
              <span className='info-value'>{updateInfo.availableVersion}</span>
            </div>

            {updateInfo.updatePriority !== undefined && (
              <div className='info-group'>
                <span className='info-label'>Update Priority:</span>
                <span
                  className={`status-badge ${getUpdatePriorityColor(updateInfo.updatePriority)}`}
                >
                  {getUpdatePriorityText(updateInfo.updatePriority)}
                </span>
              </div>
            )}

            {updateInfo.clientVersionStalenessDays !== undefined &&
              updateInfo.clientVersionStalenessDays > 0 && (
                <div className='info-group'>
                  <span className='info-label'>Days Since Release:</span>
                  <span className='info-value'>
                    {updateInfo.clientVersionStalenessDays} days
                  </span>
                </div>
              )}
          </>
        )}
      </div>

      <div className='panel-section'>
        <h3>Update Actions</h3>
        <div className='button-group'>
          <button
            className='primary'
            onClick={checkForAppUpdates}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </button>

          {updateInfo?.updateAvailable && (
            <>
              {updateInfo.immediateUpdateAllowed && (
                <button
                  className='primary'
                  onClick={performImmediateUpdate}
                >
                  Update Now
                </button>
              )}

              <button
                className='secondary'
                onClick={openAppStore}
              >
                Open App Store
              </button>
            </>
          )}
        </div>
      </div>

      <div className='panel-section'>
        <h3>Platform Information</h3>
        <div className='info-group'>
          <span className='info-label'>Immediate Updates:</span>
          <span className='info-value'>
            {updateInfo?.immediateUpdateAllowed ? 'Supported' : 'Not Supported'}
          </span>
        </div>
        <div className='info-group'>
          <span className='info-label'>Flexible Updates:</span>
          <span className='info-value'>
            {updateInfo?.flexibleUpdateAllowed ? 'Supported' : 'Not Supported'}
          </span>
        </div>

        {updateInfo?.installStatus && (
          <>
            <div className='info-group'>
              <span className='info-label'>Install Status:</span>
              <span className='info-value'>{updateInfo.installStatus}</span>
            </div>

            {updateInfo.bytesDownloaded !== undefined &&
              updateInfo.totalBytesToDownload !== undefined && (
                <div className='info-group'>
                  <span className='info-label'>Download Progress:</span>
                  <span className='info-value'>
                    {updateService.formatBytes(updateInfo.bytesDownloaded)} /
                    {updateService.formatBytes(updateInfo.totalBytesToDownload)}
                  </span>
                </div>
              )}
          </>
        )}
      </div>

      <div className='panel-section'>
        <h3>Platform Notes</h3>
        <div className='alert info'>
          <p>
            <strong>Android:</strong> Supports in-app updates through Google
            Play Core. Users can update without leaving the app.
          </p>
          <p>
            <strong>iOS:</strong> Updates must be done through the App Store.
            The app will open the App Store page.
          </p>
        </div>
      </div>
    </div>
  );
};
