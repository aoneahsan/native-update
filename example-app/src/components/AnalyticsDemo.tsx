import React, { useState, useEffect } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { useUpdateContext } from '../context/UpdateContext';

interface AnalyticsData {
  updateChecks: number;
  successfulUpdates: number;
  failedUpdates: number;
  averageDownloadTime: number;
  totalDownloadSize: number;
  rollbacks: number;
}

export default function AnalyticsDemo() {
  const { addLog } = useUpdateContext();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    updateChecks: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    averageDownloadTime: 0,
    totalDownloadSize: 0,
    rollbacks: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await CapacitorNativeUpdate.getAnalytics();
      setAnalyticsData(data);
      addLog('info', 'Analytics data loaded');
    } catch (error) {
      addLog('error', `Failed to load analytics: ${error.message}`);
    }
  };

  const trackEvent = async (eventName: string, properties?: any) => {
    try {
      await CapacitorNativeUpdate.trackEvent({
        name: eventName,
        properties: properties || {}
      });
      addLog('success', `Event tracked: ${eventName}`);
      await loadAnalytics();
    } catch (error) {
      addLog('error', `Failed to track event: ${error.message}`);
    }
  };

  const clearAnalytics = async () => {
    try {
      await CapacitorNativeUpdate.clearAnalytics();
      addLog('success', 'Analytics data cleared');
      await loadAnalytics();
    } catch (error) {
      addLog('error', `Failed to clear analytics: ${error.message}`);
    }
  };

  const exportAnalytics = async () => {
    try {
      const data = await CapacitorNativeUpdate.exportAnalytics();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('success', 'Analytics exported');
    } catch (error) {
      addLog('error', `Failed to export analytics: ${error.message}`);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>📊 Update Analytics</h2>
        
        <div className="info-grid">
          <div className="info-item">
            <strong>Update Checks</strong>
            <span>{analyticsData.updateChecks}</span>
          </div>
          <div className="info-item">
            <strong>Successful Updates</strong>
            <span>{analyticsData.successfulUpdates}</span>
          </div>
          <div className="info-item">
            <strong>Failed Updates</strong>
            <span>{analyticsData.failedUpdates}</span>
          </div>
          <div className="info-item">
            <strong>Rollbacks</strong>
            <span>{analyticsData.rollbacks}</span>
          </div>
          <div className="info-item">
            <strong>Avg Download Time</strong>
            <span>{(analyticsData.averageDownloadTime / 1000).toFixed(1)}s</span>
          </div>
          <div className="info-item">
            <strong>Total Downloaded</strong>
            <span>{(analyticsData.totalDownloadSize / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="button" onClick={loadAnalytics}>
            Refresh Analytics
          </button>
          <button className="button secondary" onClick={exportAnalytics}>
            Export Analytics
          </button>
          <button className="button danger" onClick={clearAnalytics}>
            Clear Analytics
          </button>
        </div>
      </div>

      <div className="card">
        <h2>🎯 Custom Event Tracking</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            className="button secondary" 
            onClick={() => trackEvent('user_interaction', { action: 'button_click' })}
          >
            Track Button Click
          </button>
          
          <button 
            className="button secondary" 
            onClick={() => trackEvent('update_prompt_shown')}
          >
            Track Update Prompt
          </button>
          
          <button 
            className="button secondary" 
            onClick={() => trackEvent('update_accepted')}
          >
            Track Update Accepted
          </button>
          
          <button 
            className="button secondary" 
            onClick={() => trackEvent('update_deferred')}
          >
            Track Update Deferred
          </button>
          
          <button 
            className="button secondary" 
            onClick={() => trackEvent('error_occurred', { type: 'network' })}
          >
            Track Error Event
          </button>
        </div>

        <div className="status info" style={{ marginTop: '20px' }}>
          <strong>Analytics Providers:</strong>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Console (development)</li>
            <li>Firebase Analytics</li>
            <li>Custom implementation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}