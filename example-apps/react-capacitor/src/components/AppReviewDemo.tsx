import React, { useState } from 'react';
import { NativeUpdate } from 'native-update';
import { useUpdateContext } from '../context/UpdateContext';

export default function AppReviewDemo() {
  const { addLog } = useUpdateContext();
  const [canRequestReview, setCanRequestReview] = useState<boolean | null>(null);
  const [lastRequestDate, setLastRequestDate] = useState<string>('');
  const [requestCount, setRequestCount] = useState<number>(0);

  const checkReviewStatus = async () => {
    try {
      const result = await NativeUpdate.canRequestReview();
      setCanRequestReview(result.canRequest);
      
      if (result.lastRequestDate) {
        setLastRequestDate(new Date(result.lastRequestDate).toLocaleDateString());
      }
      
      if (result.requestCount !== undefined) {
        setRequestCount(result.requestCount);
      }

      addLog('info', `Can request review: ${result.canRequest}`);
      if (result.reason) {
        addLog('info', `Reason: ${result.reason}`);
      }
    } catch (error) {
      addLog('error', `Failed to check review status: ${error.message}`);
    }
  };

  const requestReview = async () => {
    try {
      addLog('info', 'Requesting app review...');
      
      const result = await NativeUpdate.requestReview();
      
      if (result.displayed) {
        addLog('success', 'Review prompt was displayed');
      } else {
        addLog('warning', 'Review prompt was not displayed');
        if (result.reason) {
          addLog('info', `Reason: ${result.reason}`);
        }
      }

      // Update status after request
      await checkReviewStatus();
    } catch (error) {
      addLog('error', `Failed to request review: ${error.message}`);
    }
  };

  const forceRequestReview = async () => {
    try {
      addLog('warning', 'Force requesting review (bypassing rate limits)...');
      
      const result = await NativeUpdate.requestReview({ 
        force: true 
      });
      
      if (result.displayed) {
        addLog('success', 'Review prompt was force displayed');
      } else {
        addLog('error', 'Review prompt could not be displayed even with force');
      }
    } catch (error) {
      addLog('error', `Failed to force request review: ${error.message}`);
    }
  };

  const openStoreReview = async () => {
    try {
      addLog('info', 'Opening store review page...');
      await NativeUpdate.openStoreReview();
      addLog('success', 'Store review page opened');
    } catch (error) {
      addLog('error', `Failed to open store review: ${error.message}`);
    }
  };

  const resetReviewPrompts = async () => {
    try {
      addLog('info', 'Resetting review prompts...');
      await NativeUpdate.resetReviewPrompts();
      addLog('success', 'Review prompts reset');
      await checkReviewStatus();
    } catch (error) {
      addLog('error', `Failed to reset review prompts: ${error.message}`);
    }
  };

  const simulatePositiveEvent = () => {
    // In a real app, you would call requestReview after positive user interactions
    addLog('info', 'Simulating positive user event...');
    setTimeout(() => {
      addLog('success', 'User completed positive action!');
      addLog('info', 'This is a good time to request a review');
    }, 1000);
  };

  const getReviewUrl = async () => {
    try {
      const result = await NativeUpdate.getStoreReviewUrl();
      addLog('info', `Review URL: ${result.url}`);
      navigator.clipboard.writeText(result.url);
      addLog('success', 'Review URL copied to clipboard');
    } catch (error) {
      addLog('error', `Failed to get review URL: ${error.message}`);
    }
  };

  return (
    <div className="card">
      <h2>⭐ App Reviews</h2>
      
      <div className="info-grid">
        <div className="info-item">
          <strong>Can Request Review</strong>
          <span>{canRequestReview === null ? 'Not checked' : canRequestReview ? 'Yes' : 'No'}</span>
        </div>
        <div className="info-item">
          <strong>Last Request Date</strong>
          <span>{lastRequestDate || 'Never'}</span>
        </div>
        <div className="info-item">
          <strong>Request Count</strong>
          <span>{requestCount} times</span>
        </div>
        <div className="info-item">
          <strong>Platform Limits</strong>
          <span>iOS: 3/year, Android: Unlimited</span>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          className="button secondary" 
          onClick={checkReviewStatus}
        >
          Check Review Status
        </button>

        <button 
          className="button" 
          onClick={requestReview}
        >
          Request Review (Smart)
        </button>

        <button 
          className="button secondary" 
          onClick={forceRequestReview}
        >
          Force Request Review
        </button>

        <button 
          className="button" 
          onClick={openStoreReview}
        >
          Open Store Review Page
        </button>

        <button 
          className="button secondary" 
          onClick={getReviewUrl}
        >
          Copy Review URL
        </button>

        <button 
          className="button danger" 
          onClick={resetReviewPrompts}
        >
          Reset Review History
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Best Practices Demo</h3>
        
        <button 
          className="button secondary" 
          onClick={simulatePositiveEvent}
        >
          Simulate Positive Event
        </button>

        <div className="status info" style={{ marginTop: '10px' }}>
          <strong>When to request reviews:</strong>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>After user completes a key action</li>
            <li>After positive interaction (e.g., successful purchase)</li>
            <li>Not during onboarding or after errors</li>
            <li>Respect platform rate limits</li>
          </ul>
        </div>
      </div>

      <div className="status warning" style={{ marginTop: '20px' }}>
        <strong>Platform Behavior:</strong>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li><strong>iOS:</strong> Uses SKStoreReviewController (3 times per year limit)</li>
          <li><strong>Android:</strong> Uses Google Play In-App Review API</li>
          <li><strong>Web:</strong> Shows custom prompt with link to review</li>
        </ul>
      </div>
    </div>
  );
}