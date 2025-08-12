import React, { useState, useEffect } from 'react';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import LiveUpdateDemo from './components/LiveUpdateDemo';
import AppUpdateDemo from './components/AppUpdateDemo';
import AppReviewDemo from './components/AppReviewDemo';
import AdvancedFeatures from './components/AdvancedFeatures';
import SecurityDemo from './components/SecurityDemo';
import AnalyticsDemo from './components/AnalyticsDemo';
import { UpdateProvider } from './context/UpdateContext';

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [configError, setConfigError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'live' | 'app' | 'review' | 'advanced' | 'security' | 'analytics'>('live');

  useEffect(() => {
    // Initialize the plugin
    async function initialize() {
      try {
        await CapacitorNativeUpdate.configure({
          serverUrl: 'https://your-update-server.com/api/v1',
          autoCheck: true,
          checkInterval: 3600,
          channel: 'production',
          publicKey: 'YOUR_BASE64_PUBLIC_KEY_HERE',
          enforceMinVersion: true,
          security: {
            enforceHttps: true,
            validateSignatures: true
          },
          analytics: {
            enabled: true,
            provider: 'console' // Use console for demo
          }
        });

        // Set up global event listeners
        CapacitorNativeUpdate.addListener('updateStateChanged', (state) => {
          console.log('Update state changed:', state);
        });

        CapacitorNativeUpdate.addListener('downloadProgress', (progress) => {
          console.log('Download progress:', progress);
        });

        CapacitorNativeUpdate.addListener('error', (error) => {
          console.error('Update error:', error);
        });

        setIsConfigured(true);
      } catch (error) {
        setConfigError(error.message || 'Failed to configure plugin');
        console.error('Configuration error:', error);
      }
    }

    initialize();
  }, []);

  const tabs = [
    { id: 'live', label: 'Live Updates', icon: '🚀' },
    { id: 'app', label: 'App Updates', icon: '📱' },
    { id: 'review', label: 'App Reviews', icon: '⭐' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <UpdateProvider>
      <div className="container">
        <div className="header">
          <h1>Capacitor Native Update Demo</h1>
          <p>Comprehensive example showcasing all features</p>
          {!isConfigured && (
            <div className="status warning" style={{ marginTop: '10px' }}>
              {configError || 'Initializing plugin...'}
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`button ${activeTab === tab.id ? '' : 'secondary'}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isConfigured ? (
          <>
            {activeTab === 'live' && <LiveUpdateDemo />}
            {activeTab === 'app' && <AppUpdateDemo />}
            {activeTab === 'review' && <AppReviewDemo />}
            {activeTab === 'advanced' && <AdvancedFeatures />}
            {activeTab === 'security' && <SecurityDemo />}
            {activeTab === 'analytics' && <AnalyticsDemo />}
          </>
        ) : (
          <div className="card">
            <h2>⚠️ Plugin Not Configured</h2>
            <p>Please configure the plugin with your server URL and credentials.</p>
            <p className="status error">{configError}</p>
          </div>
        )}
      </div>
    </UpdateProvider>
  );
}

export default App;