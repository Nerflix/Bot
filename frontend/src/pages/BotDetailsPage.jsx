import React, { useEffect, useState } from 'react';
import BotDetails from '../components/BotDetails';
import { testConnection } from '../utils/api';

const BotDetailsPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [error, setError] = useState(null);

  // Test API connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log('[checkConnection] Starting connection test...');
      try {
        setConnectionStatus('testing');
        console.log('[checkConnection] Calling testConnection...');
        const result = await testConnection();
        console.log('[checkConnection] testConnection result:', result);

        if (result.success) {
          console.log('[checkConnection] Success: Connected to server');
          setConnectionStatus('connected');
        } else {
          console.warn('[checkConnection] Failed: result.success is false');
          setConnectionStatus('failed');
          setError(result.message || 'Connection test failed');
        }
      } catch (err) {
        console.error('[checkConnection] Exception during test:', err);
        setConnectionStatus('failed');
        setError(err.message || 'Unable to connect to server');
      }
    };

    checkConnection();
  }, []);

  // Show connection status while testing
  if (connectionStatus === 'testing') {
    console.log('[render] Status = testing');
    return (
      <div className="bot-details-container">
        <div className="bot-details-card">
          <div className="header-section">
            <h1 className="site-title">Transaction Broadcaster Bot</h1>
            <div className="connection-loading">
              <div className="loading-spinner"></div>
              <p>Testing server connection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if connection failed
  if (connectionStatus === 'failed') {
    console.log('[render] Status = failed | Error:', error);
    return (
      <div className="bot-details-container">
        <div className="bot-details-card">
          <div className="header-section">
            <h1 className="site-title">Transaction Broadcaster Bot</h1>
            <div className="connection-error">
              <h2>Connection Error</h2>
              <p>{error}</p>
              <button 
                onClick={() => {
                  console.log('[Retry Button] Reloading page...');
                  window.location.reload();
                }} 
                className="btn btn-primary"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main component when connected
  console.log('[render] Status = connected');
  return (
    <>
      <div className="connection-indicator">
        <span className="status-dot connected"></span>
        <span className="status-text">Server Connected</span>
      </div>
      <BotDetails />
    </>
  );
};

export default BotDetailsPage;
