import React, { useState, useEffect } from 'react';
import type { UpdateService } from '../services/update-service';

interface AppReviewPanelProps {
  updateService: UpdateService;
}

export const AppReviewPanel: React.FC<AppReviewPanelProps> = ({ updateService }) => {
  const [canRequest, setCanRequest] = useState<{ allowed: boolean; reason?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [reviewStats, setReviewStats] = useState({
    launchCount: 0,
    daysSinceInstall: 0,
    lastRequestDaysAgo: -1,
  });

  useEffect(() => {
    checkReviewEligibility();
    loadReviewStats();
  }, []);

  const checkReviewEligibility = async () => {
    setIsChecking(true);
    
    try {
      const result = await updateService.canRequestReview();
      setCanRequest(result);
    } catch (error) {
      console.error('Failed to check review eligibility:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const loadReviewStats = () => {
    // In a real app, these would come from the native side
    // For demo purposes, we'll use localStorage
    const installDate = localStorage.getItem('capacitor-native-update-install-date');
    const launchCount = localStorage.getItem('capacitor-native-update-launch-count');
    const lastReview = localStorage.getItem('capacitor-native-update-last-review');
    
    if (installDate) {
      const daysSinceInstall = Math.floor((Date.now() - parseInt(installDate)) / (1000 * 60 * 60 * 24));
      setReviewStats(prev => ({ ...prev, daysSinceInstall }));
    }
    
    if (launchCount) {
      setReviewStats(prev => ({ ...prev, launchCount: parseInt(launchCount) }));
    }
    
    if (lastReview) {
      const daysAgo = Math.floor((Date.now() - parseInt(lastReview)) / (1000 * 60 * 60 * 24));
      setReviewStats(prev => ({ ...prev, lastRequestDaysAgo: daysAgo }));
    }
  };

  const requestReview = async () => {
    setMessage(null);
    
    try {
      const shown = await updateService.requestReview();
      
      if (shown) {
        setMessage({ type: 'success', text: 'Review dialog was shown to the user' });
        // Update stats
        localStorage.setItem('capacitor-native-update-last-review', Date.now().toString());
        loadReviewStats();
        checkReviewEligibility();
      } else {
        setMessage({ type: 'info', text: 'Review dialog was not shown (platform restrictions or conditions not met)' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to request review' });
    }
  };

  const simulateUserActions = () => {
    // Simulate launch count increase
    const currentCount = parseInt(localStorage.getItem('capacitor-native-update-launch-count') || '0');
    const newCount = currentCount + 5;
    localStorage.setItem('capacitor-native-update-launch-count', newCount.toString());
    
    setMessage({ type: 'success', text: 'Simulated 5 app launches' });
    loadReviewStats();
    checkReviewEligibility();
  };

  const resetReviewData = () => {
    localStorage.removeItem('capacitor-native-update-last-review');
    localStorage.setItem('capacitor-native-update-launch-count', '0');
    localStorage.setItem('capacitor-native-update-install-date', Date.now().toString());
    
    setMessage({ type: 'success', text: 'Review data reset' });
    loadReviewStats();
    checkReviewEligibility();
  };

  return (
    <div className="panel">
      <h2>App Reviews</h2>
      
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="panel-section">
        <h3>Review Eligibility</h3>
        {isChecking ? (
          <p>Checking eligibility...</p>
        ) : canRequest ? (
          <div className="info-group">
            <span className="info-label">Can Request Review:</span>
            <span className={`status-badge ${canRequest.allowed ? 'active' : 'failed'}`}>
              {canRequest.allowed ? 'Yes' : 'No'}
            </span>
          </div>
        ) : null}
        
        {canRequest && !canRequest.allowed && canRequest.reason && (
          <div className="alert info">
            <strong>Reason:</strong> {canRequest.reason}
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>User Statistics</h3>
        <div className="info-group">
          <span className="info-label">App Launch Count:</span>
          <span className="info-value">{reviewStats.launchCount}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Days Since Install:</span>
          <span className="info-value">{reviewStats.daysSinceInstall}</span>
        </div>
        <div className="info-group">
          <span className="info-label">Last Review Request:</span>
          <span className="info-value">
            {reviewStats.lastRequestDaysAgo === -1 
              ? 'Never' 
              : `${reviewStats.lastRequestDaysAgo} days ago`}
          </span>
        </div>
      </div>

      <div className="panel-section">
        <h3>Actions</h3>
        <div className="button-group">
          <button 
            className="primary" 
            onClick={requestReview}
            disabled={!canRequest?.allowed && !message}
          >
            Request Review
          </button>
          
          <button 
            className="secondary" 
            onClick={checkReviewEligibility}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Eligibility'}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Testing Tools</h3>
        <div className="button-group">
          <button className="secondary" onClick={simulateUserActions}>
            Simulate User Activity
          </button>
          <button className="danger" onClick={resetReviewData}>
            Reset Review Data
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Platform Notes</h3>
        <div className="alert info">
          <p><strong>iOS:</strong> Limited to 3 review requests per year per user. Uses StoreKit framework.</p>
          <p><strong>Android:</strong> Uses Google Play In-App Review API. Has internal quotas managed by Google.</p>
          <p><strong>Web:</strong> Shows a custom dialog as fallback.</p>
        </div>
        
        <div className="alert info" style={{ marginTop: '1rem' }}>
          <p><strong>Best Practices:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Request reviews after positive experiences</li>
            <li>Don't interrupt critical user flows</li>
            <li>Respect platform quotas and limits</li>
            <li>Don't incentivize reviews</li>
          </ul>
        </div>
      </div>
    </div>
  );
};