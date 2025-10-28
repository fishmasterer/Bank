import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt for future use
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a week
    const dismissedUntil = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('installPromptDismissed', dismissedUntil);
  };

  // Check if user previously dismissed the prompt
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('installPromptDismissed');
    if (dismissedUntil && new Date().getTime() < parseInt(dismissedUntil)) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📱</div>
        <div className="install-prompt-text">
          <h4>Install App</h4>
          <p>Add to your home screen for quick access</p>
        </div>
        <div className="install-prompt-actions">
          <button onClick={handleInstall} className="btn-install">
            Install
          </button>
          <button onClick={handleDismiss} className="btn-dismiss">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
