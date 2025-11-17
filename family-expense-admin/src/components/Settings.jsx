import { useState, useEffect } from 'react';
import ThemePicker from './ThemePicker';
import './Settings.css';

export default function Settings({ onClose }) {
  const [cacheSize, setCacheSize] = useState(null);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get cache size if supported
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const sizeInMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        setCacheSize(sizeInMB);
      });
    }

    // Get last updated from localStorage
    const lastUpdate = localStorage.getItem('lastAppUpdate');
    if (lastUpdate) {
      setLastUpdated(new Date(lastUpdate).toLocaleString());
    }
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleHardRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // Clear local storage (except theme preference)
      const theme = localStorage.getItem('theme');
      const colorTheme = localStorage.getItem('colorTheme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      if (colorTheme) localStorage.setItem('colorTheme', colorTheme);

      // Clear session storage
      sessionStorage.clear();

      // Set last update time
      localStorage.setItem('lastAppUpdate', new Date().toISOString());

      // Hard reload (bypass cache)
      window.location.reload(true);
    } catch (error) {
      console.error('Hard refresh failed:', error);
      setIsRefreshing(false);
      alert('Failed to clear cache. Please try again.');
    }
  };

  const handleCheckUpdates = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        alert('Checked for updates. If a new version is available, it will be installed on next refresh.');
      }
    } else {
      alert('Service worker not supported');
    }
  };

  const handleClearLocalData = () => {
    if (confirm('This will clear all local data except theme settings. Continue?')) {
      const theme = localStorage.getItem('theme');
      const colorTheme = localStorage.getItem('colorTheme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      if (colorTheme) localStorage.setItem('colorTheme', colorTheme);
      sessionStorage.clear();
      alert('Local data cleared successfully!');
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>
        <div className="settings-content">
          {/* Theme Settings */}
          <section className="settings-section">
            <h3>Appearance</h3>
            <ThemePicker />
          </section>

          {/* App Info */}
          <section className="settings-section">
            <h3>App Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Version</span>
                <span className="info-value">{appVersion}</span>
              </div>
              {cacheSize !== null && (
                <div className="info-item">
                  <span className="info-label">Cache Size</span>
                  <span className="info-value">{cacheSize} MB</span>
                </div>
              )}
              {lastUpdated && (
                <div className="info-item">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{lastUpdated}</span>
                </div>
              )}
            </div>
          </section>

          {/* Refresh & Cache Management */}
          <section className="settings-section">
            <h3>Refresh & Cache</h3>
            <div className="settings-actions">
              <button
                onClick={handleRefresh}
                className="settings-btn btn-secondary"
                title="Reload the page"
              >
                <span className="btn-icon">🔄</span>
                <span>Refresh App</span>
              </button>

              <button
                onClick={handleHardRefresh}
                className="settings-btn btn-warning"
                disabled={isRefreshing}
                title="Clear all cache and reload"
              >
                <span className="btn-icon">⚡</span>
                <span>{isRefreshing ? 'Refreshing...' : 'Hard Refresh'}</span>
              </button>

              <button
                onClick={handleCheckUpdates}
                className="settings-btn btn-secondary"
                title="Check for app updates"
              >
                <span className="btn-icon">🔍</span>
                <span>Check for Updates</span>
              </button>

              <button
                onClick={handleClearLocalData}
                className="settings-btn btn-danger"
                title="Clear local storage data"
              >
                <span className="btn-icon">🗑️</span>
                <span>Clear Local Data</span>
              </button>
            </div>

            <div className="settings-hint">
              <p><strong>Refresh:</strong> Simple page reload</p>
              <p><strong>Hard Refresh:</strong> Clears cache, service worker, and local data</p>
              <p><strong>Check Updates:</strong> Forces PWA to check for new version</p>
              <p><strong>Clear Data:</strong> Removes cached data (keeps theme settings)</p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
