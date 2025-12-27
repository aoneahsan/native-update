import { useState, useEffect } from 'react';
import { NativeUpdate } from 'native-update';
import './App.css';

function App() {
  const [status, setStatus] = useState('Initializing...');
  const [version, setVersion] = useState('1.0.0');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Initialize plugin
    async function init() {
      try {
        await NativeUpdate.configure({
          serverUrl: 'http://localhost:3000/api',
          autoCheck: false,
          channel: 'production',
        });
        setStatus('Ready - Connected to update server');
      } catch (error) {
        setStatus(`Error: ${error.message || 'Failed to initialize'}`);
      }
    }

    // Listen for download progress
    NativeUpdate.addListener('downloadProgress', (progress) => {
      setDownloadProgress(progress.percentage);
    });

    init();
  }, []);

  const checkForUpdates = async () => {
    setStatus('Checking for updates...');
    try {
      const result = await NativeUpdate.checkForUpdate();
      if (result.available) {
        setUpdateAvailable(true);
        setStatus(`Update available: v${result.latestVersion}`);
      } else {
        setStatus('No updates available - You have the latest version');
      }
    } catch (error) {
      setStatus(`Error checking: ${error.message}`);
    }
  };

  const downloadUpdate = async () => {
    setStatus('Downloading update...');
    try {
      await NativeUpdate.downloadUpdate();
      setStatus('Update downloaded successfully!');
    } catch (error) {
      setStatus(`Download failed: ${error.message}`);
    }
  };

  const applyUpdate = async () => {
    setStatus('Applying update...');
    try {
      await NativeUpdate.applyUpdate();
      setStatus('Update applied! App will reload...');
      // App will reload automatically
    } catch (error) {
      setStatus(`Apply failed: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🚀 Native Update Demo</h1>
        <p className="subtitle">Simple OTA Update Example</p>

        <div className="version-box">
          <h2>Current Version: {version}</h2>
          <div className="demo-text">
            <p>
              ✨ <strong>Change this text and deploy to test OTA updates!</strong> ✨
            </p>
            <p>
              This text will update when you deploy a new version via the update server.
              No app store approval needed!
            </p>
          </div>
        </div>

        <div className="controls">
          <button onClick={checkForUpdates} className="btn btn-primary">
            Check for Updates
          </button>

          {updateAvailable && (
            <>
              <button onClick={downloadUpdate} className="btn btn-secondary">
                Download Update
              </button>

              <button onClick={applyUpdate} className="btn btn-success">
                Apply Update & Reload
              </button>
            </>
          )}
        </div>

        {downloadProgress > 0 && downloadProgress < 100 && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${downloadProgress}%` }}
            />
            <span className="progress-text">{downloadProgress}%</span>
          </div>
        )}

        <div className="status-box">
          <strong>Status:</strong> {status}
        </div>

        <div className="instructions">
          <h3>How to Test:</h3>
          <ol>
            <li>Start the backend server (see backend examples)</li>
            <li>Click "Check for Updates"</li>
            <li>If an update is available, click "Download Update"</li>
            <li>Once downloaded, click "Apply Update & Reload"</li>
            <li>The app will reload with the new content!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
