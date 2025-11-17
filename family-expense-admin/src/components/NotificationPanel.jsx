import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, budget, expense

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupNotifications = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifs.forEach(notif => {
      const notifDate = new Date(notif.createdAt);
      if (notifDate >= today) {
        groups.today.push(notif);
      } else if (notifDate >= yesterday) {
        groups.yesterday.push(notif);
      } else if (notifDate >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'budget') return n.type.startsWith('budget_');
    if (filter === 'expense') return n.type.startsWith('expense_');
    return true;
  });

  const grouped = groupNotifications(filteredNotifications);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const renderNotificationGroup = (title, notifs) => {
    if (notifs.length === 0) return null;

    return (
      <div className="notification-group">
        <h4 className="notification-group-title">{title}</h4>
        <div className="notification-items">
          {notifs.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.priority || 'low'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">{notification.icon}</div>
              <div className="notification-content">
                <div className="notification-header">
                  <h5 className="notification-title">{notification.title}</h5>
                  <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
              </div>
              <button
                className="notification-delete"
                onClick={(e) => handleDelete(e, notification.id)}
                aria-label="Delete notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        <div className="notification-panel-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-read-btn">
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="clear-all-btn">
              Clear all
            </button>
          )}
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="notification-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'budget' ? 'active' : ''}`}
            onClick={() => setFilter('budget')}
          >
            Budget ({notifications.filter(n => n.type.startsWith('budget_')).length})
          </button>
          <button
            className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
            onClick={() => setFilter('expense')}
          >
            Expenses ({notifications.filter(n => n.type.startsWith('expense_')).length})
          </button>
        </div>
      )}

      <div className="notification-panel-content">
        {filteredNotifications.length === 0 ? (
          <div className="notification-empty">
            <div className="empty-icon">🔔</div>
            <p className="empty-title">No notifications</p>
            <p className="empty-message">You're all caught up!</p>
          </div>
        ) : (
          <>
            {renderNotificationGroup('Today', grouped.today)}
            {renderNotificationGroup('Yesterday', grouped.yesterday)}
            {renderNotificationGroup('This Week', grouped.thisWeek)}
            {renderNotificationGroup('Older', grouped.older)}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
