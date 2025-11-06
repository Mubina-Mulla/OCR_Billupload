import React, { useState, useEffect } from 'react';
import { getConnectionStatus } from '../firebase/config';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide online message after 3 seconds
  useEffect(() => {
    if (isOnline && showOfflineMessage === false) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  if (!showOfflineMessage && isOnline) {
    return null; // Don't show anything when online normally
  }

  return (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="connection-content">
        {isOnline ? (
          <>
            <span className="connection-icon">🟢</span>
            <span className="connection-text">Back online! Firebase connected.</span>
          </>
        ) : (
          <>
            <span className="connection-icon">🔴</span>
            <span className="connection-text">
              You're offline. App will work with limited functionality.
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;