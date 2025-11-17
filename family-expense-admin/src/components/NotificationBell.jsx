import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import './NotificationBell.css';

const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);
  const bellRef = useRef(null);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPanel &&
        bellRef.current &&
        panelRef.current &&
        !bellRef.current.contains(event.target) &&
        !panelRef.current.contains(event.target)
      ) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const togglePanel = () => {
    setShowPanel(prev => !prev);
  };

  return (
    <div className="notification-bell-container">
      <button
        ref={bellRef}
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={togglePanel}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div ref={panelRef}>
          <NotificationPanel onClose={() => setShowPanel(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
