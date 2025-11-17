import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  icon = '📊',
  title = 'No data yet',
  message = 'Get started by adding some data',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration = 'default'
}) => {
  const getIllustrationPath = () => {
    switch (illustration) {
      case 'expenses':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#F3F4F6" />
            <path d="M100 60V100L130 130" stroke="#667eea" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="100" r="8" fill="#667eea" />
            <path d="M70 140H130M70 150H110" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="120" width="30" height="50" fill="#E5E7EB" rx="4" />
            <rect x="85" y="90" width="30" height="80" fill="#E5E7EB" rx="4" />
            <rect x="130" y="60" width="30" height="110" fill="#E5E7EB" rx="4" />
            <path d="M30 50L170 50" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" />
          </svg>
        );
      case 'search':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="80" r="40" stroke="#E5E7EB" strokeWidth="8" />
            <path d="M110 110L140 140" stroke="#E5E7EB" strokeWidth="8" strokeLinecap="round" />
            <path d="M70 80H90M80 70V90" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="empty-state-container">
      <div className="empty-state-content">
        {illustration !== 'default' ? (
          getIllustrationPath()
        ) : (
          <div className="empty-state-icon">{icon}</div>
        )}

        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>

        {(actionLabel || secondaryActionLabel) && (
          <div className="empty-state-actions">
            {actionLabel && onAction && (
              <button className="empty-state-button primary" onClick={onAction}>
                {actionLabel}
              </button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <button className="empty-state-button secondary" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
