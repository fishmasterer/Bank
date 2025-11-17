import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAUpdateNotification.css';

const PWAUpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdate(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    setNeedRefresh(false);
  };

  // Show offline ready notification briefly
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  if (!showUpdate && !offlineReady) {
    return null;
  }

  return (
    <>
      {/* Update Available Notification */}
      {showUpdate && (
        <div className="pwa-update-notification update">
          <div className="pwa-update-content">
            <div className="pwa-update-icon">🔄</div>
            <div className="pwa-update-text">
              <h4>Update Available</h4>
              <p>A new version is ready. Reload to update.</p>
            </div>
            <div className="pwa-update-actions">
              <button
                className="pwa-update-btn primary"
                onClick={handleUpdate}
              >
                Reload
              </button>
              <button
                className="pwa-update-btn secondary"
                onClick={handleDismiss}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Ready Notification */}
      {offlineReady && (
        <div className="pwa-update-notification offline-ready">
          <div className="pwa-update-content">
            <div className="pwa-update-icon">✓</div>
            <div className="pwa-update-text">
              <h4>Ready for Offline Use</h4>
              <p>App is cached and will work offline</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAUpdateNotification;
