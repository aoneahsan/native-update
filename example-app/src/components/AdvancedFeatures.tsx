import React, { useState } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { useUpdateContext } from '../context/UpdateContext';

export default function AdvancedFeatures() {
  const { addLog, logs } = useUpdateContext();
  const [updateUrl, setUpdateUrl] = useState('https://your-update-server.com/api/v1');
  const [maxRetries, setMaxRetries] = useState(3);
  const [keepVersions, setKeepVersions] = useState(3);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [backgroundDownload, setBackgroundDownload] = useState(true);

  const updateConfiguration = async () => {
    try {
      await CapacitorNativeUpdate.configure({
        serverUrl: updateUrl,
        autoCheck: autoCheckEnabled,
        maxRetries: maxRetries,
        keepVersions: keepVersions,
        backgroundDownload: backgroundDownload
      });
      addLog('success', 'Configuration updated');
    } catch (error) {
      addLog('error', `Failed to update configuration: ${error.message}`);
    }
  };

  const setUpdateServerUrl = async () => {
    try {
      await CapacitorNativeUpdate.setUpdateUrl(updateUrl);
      addLog('success', `Update URL set to: ${updateUrl}`);
    } catch (error) {
      addLog('error', `Failed to set update URL: ${error.message}`);
    }
  };

  const cleanupOldBundles = async () => {
    try {
      await CapacitorNativeUpdate.deleteBundle({ keepVersions: keepVersions });
      addLog('success', `Cleaned up old bundles, keeping ${keepVersions} versions`);
    } catch (error) {
      addLog('error', `Failed to cleanup bundles: ${error.message}`);
    }
  };

  const validateBundle = async () => {
    try {
      const current = await CapacitorNativeUpdate.getCurrentBundle();
      if (current.path) {
        const result = await CapacitorNativeUpdate.validateUpdate({
          bundlePath: current.path,
          checksum: current.checksum || ''
        });
        
        if (result.isValid) {
          addLog('success', 'Current bundle is valid');
        } else {
          addLog('error', 'Current bundle validation failed');
        }
      }
    } catch (error) {
      addLog('error', `Validation error: ${error.message}`);
    }
  };

  const pauseAutoUpdates = async () => {
    try {
      await CapacitorNativeUpdate.pauseAutoUpdates();
      addLog('info', 'Auto updates paused');
    } catch (error) {
      addLog('error', `Failed to pause auto updates: ${error.message}`);
    }
  };

  const resumeAutoUpdates = async () => {
    try {
      await CapacitorNativeUpdate.resumeAutoUpdates();
      addLog('info', 'Auto updates resumed');
    } catch (error) {
      addLog('error', `Failed to resume auto updates: ${error.message}`);
    }
  };

  const scheduleBackgroundCheck = async () => {
    try {
      await CapacitorNativeUpdate.scheduleBackgroundCheck({
        interval: 3600 // 1 hour
      });
      addLog('success', 'Background check scheduled for every hour');
    } catch (error) {
      addLog('error', `Failed to schedule background check: ${error.message}`);
    }
  };

  const cancelBackgroundCheck = async () => {
    try {
      await CapacitorNativeUpdate.cancelBackgroundCheck();
      addLog('info', 'Background check cancelled');
    } catch (error) {
      addLog('error', `Failed to cancel background check: ${error.message}`);
    }
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `update-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('success', 'Logs exported');
  };

  const testCrashRecovery = async () => {
    try {
      addLog('warning', 'Testing crash recovery...');
      // This would simulate a crash in a real scenario
      await CapacitorNativeUpdate.testCrashRecovery();
      addLog('success', 'Crash recovery test completed');
    } catch (error) {
      addLog('error', `Crash recovery test failed: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>⚙️ Advanced Configuration</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Update Server URL:</label>
          <input 
            type="text" 
            value={updateUrl}
            onChange={(e) => setUpdateUrl(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ddd' 
            }}
          />
          <button 
            className="button secondary" 
            onClick={setUpdateServerUrl}
            style={{ marginTop: '10px' }}
          >
            Update Server URL
          </button>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <strong>Max Retries</strong>
            <input 
              type="number" 
              value={maxRetries}
              onChange={(e) => setMaxRetries(parseInt(e.target.value))}
              style={{ width: '60px', padding: '4px' }}
            />
          </div>
          <div className="info-item">
            <strong>Keep Versions</strong>
            <input 
              type="number" 
              value={keepVersions}
              onChange={(e) => setKeepVersions(parseInt(e.target.value))}
              style={{ width: '60px', padding: '4px' }}
            />
          </div>
          <div className="info-item">
            <strong>Auto Check</strong>
            <input 
              type="checkbox" 
              checked={autoCheckEnabled}
              onChange={(e) => setAutoCheckEnabled(e.target.checked)}
            />
          </div>
          <div className="info-item">
            <strong>Background Download</strong>
            <input 
              type="checkbox" 
              checked={backgroundDownload}
              onChange={(e) => setBackgroundDownload(e.target.checked)}
            />
          </div>
        </div>

        <button 
          className="button" 
          onClick={updateConfiguration}
          style={{ marginTop: '15px' }}
        >
          Apply Configuration
        </button>
      </div>

      <div className="card">
        <h2>🔧 Maintenance & Utilities</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button className="button secondary" onClick={cleanupOldBundles}>
            Cleanup Old Bundles
          </button>
          
          <button className="button secondary" onClick={validateBundle}>
            Validate Current Bundle
          </button>
          
          <button className="button" onClick={pauseAutoUpdates}>
            Pause Auto Updates
          </button>
          
          <button className="button" onClick={resumeAutoUpdates}>
            Resume Auto Updates
          </button>
          
          <button className="button secondary" onClick={scheduleBackgroundCheck}>
            Schedule Background Check
          </button>
          
          <button className="button danger" onClick={cancelBackgroundCheck}>
            Cancel Background Check
          </button>
          
          <button className="button secondary" onClick={exportLogs}>
            Export Logs
          </button>
          
          <button className="button danger" onClick={testCrashRecovery}>
            Test Crash Recovery
          </button>
        </div>
      </div>

      <div className="card">
        <h2>📊 Update Logs</h2>
        <div className="logs">
          {logs.slice(-10).map((log, index) => (
            <div key={index} className={`log-entry ${log.level}`}>
              [{log.timestamp.toLocaleTimeString()}] {log.message}
            </div>
          ))}
        </div>
        {logs.length > 10 && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Showing last 10 entries. Export logs to see all.
          </p>
        )}
      </div>
    </div>
  );
}