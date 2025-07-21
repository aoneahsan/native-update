import React, { useEffect, useState } from 'react';
import { UpdateService } from './services/update-service';
import { LiveUpdatePanel } from './components/LiveUpdatePanel';
import { AppUpdatePanel } from './components/AppUpdatePanel';
import { AppReviewPanel } from './components/AppReviewPanel';
import { SecurityInfoPanel } from './components/SecurityInfoPanel';
import './App.css';

const updateService = UpdateService.getInstance();

function App() {
  const [activeTab, setActiveTab] = useState<
    'live' | 'app' | 'review' | 'security'
  >('live');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeUpdateService();
  }, []);

  const initializeUpdateService = async () => {
    try {
      await updateService.initialize();
      setIsInitialized(true);

      // Notify app is ready after successful initialization
      await updateService.notifyAppReady();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize update service'
      );
    }
  };

  if (error) {
    return (
      <div className='error-container'>
        <h2>Initialization Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className='loading-container'>
        <h2>Initializing Update Service...</h2>
      </div>
    );
  }

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>Capacitor Native Update Demo</h1>
      </header>

      <nav className='tab-nav'>
        <button
          className={activeTab === 'live' ? 'active' : ''}
          onClick={() => setActiveTab('live')}
        >
          Live Updates
        </button>
        <button
          className={activeTab === 'app' ? 'active' : ''}
          onClick={() => setActiveTab('app')}
        >
          App Updates
        </button>
        <button
          className={activeTab === 'review' ? 'active' : ''}
          onClick={() => setActiveTab('review')}
        >
          App Reviews
        </button>
        <button
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </nav>

      <main className='app-content'>
        {activeTab === 'live' && (
          <LiveUpdatePanel updateService={updateService} />
        )}
        {activeTab === 'app' && (
          <AppUpdatePanel updateService={updateService} />
        )}
        {activeTab === 'review' && (
          <AppReviewPanel updateService={updateService} />
        )}
        {activeTab === 'security' && (
          <SecurityInfoPanel updateService={updateService} />
        )}
      </main>
    </div>
  );
}

export default App;
