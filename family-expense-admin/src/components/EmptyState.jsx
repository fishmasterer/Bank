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
            <defs>
              <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)" />
                <stop offset="100%" stopColor="var(--secondary-color)" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="var(--bg-tertiary)" opacity="0.5" />
            <circle cx="100" cy="100" r="60" fill="var(--bg-secondary)" />
            {/* Wallet */}
            <rect x="65" y="75" width="70" height="50" rx="8" fill="url(#expenseGrad)" className="svg-float" />
            <rect x="75" y="85" width="50" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
            <rect x="75" y="100" width="35" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
            {/* Coins */}
            <circle cx="145" cy="130" r="12" fill="var(--warning-color)" className="svg-bounce" style={{ animationDelay: '0.2s' }} />
            <circle cx="155" cy="115" r="10" fill="var(--success-color)" className="svg-bounce" style={{ animationDelay: '0.4s' }} />
            <circle cx="55" cy="70" r="8" fill="var(--warning-color)" opacity="0.7" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chartGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary-color)" />
              </linearGradient>
              <linearGradient id="chartGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="var(--success-color)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--success-color)" />
              </linearGradient>
              <linearGradient id="chartGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="var(--secondary-color)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--secondary-color)" />
              </linearGradient>
            </defs>
            <rect x="30" y="160" width="140" height="4" rx="2" fill="var(--border-color)" />
            <rect x="40" y="120" width="25" height="40" rx="4" fill="url(#chartGrad1)" className="svg-grow" style={{ transformOrigin: 'bottom' }} />
            <rect x="75" y="85" width="25" height="75" rx="4" fill="url(#chartGrad2)" className="svg-grow" style={{ animationDelay: '0.1s', transformOrigin: 'bottom' }} />
            <rect x="110" y="100" width="25" height="60" rx="4" fill="url(#chartGrad3)" className="svg-grow" style={{ animationDelay: '0.2s', transformOrigin: 'bottom' }} />
            <rect x="145" y="65" width="25" height="95" rx="4" fill="url(#chartGrad1)" className="svg-grow" style={{ animationDelay: '0.3s', transformOrigin: 'bottom' }} />
            {/* Trend line */}
            <path d="M40 100 Q100 40 170 50" stroke="var(--primary-color)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" fill="none" />
          </svg>
        );
      case 'search':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)" />
                <stop offset="100%" stopColor="var(--secondary-color)" />
              </linearGradient>
            </defs>
            <circle cx="85" cy="85" r="50" fill="var(--bg-tertiary)" opacity="0.5" />
            <circle cx="85" cy="85" r="35" stroke="url(#searchGrad)" strokeWidth="6" fill="none" className="svg-pulse" />
            <path d="M110 110L145 145" stroke="url(#searchGrad)" strokeWidth="8" strokeLinecap="round" />
            {/* Question mark */}
            <text x="85" y="95" textAnchor="middle" fontSize="30" fill="var(--text-tertiary)" fontWeight="bold" className="svg-float">?</text>
            {/* Decorative elements */}
            <circle cx="150" cy="60" r="6" fill="var(--warning-color)" opacity="0.6" />
            <circle cx="45" cy="50" r="4" fill="var(--success-color)" opacity="0.6" />
          </svg>
        );
      case 'savings':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="savingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--success-color)" />
                <stop offset="100%" stopColor="#38ef7d" />
              </linearGradient>
            </defs>
            {/* Piggy bank body */}
            <ellipse cx="100" cy="110" rx="55" ry="45" fill="url(#savingsGrad)" />
            <ellipse cx="100" cy="110" rx="45" ry="35" fill="rgba(255,255,255,0.2)" />
            {/* Coin slot */}
            <rect x="85" y="65" width="30" height="6" rx="3" fill="rgba(0,0,0,0.2)" />
            {/* Eye */}
            <circle cx="130" cy="95" r="4" fill="rgba(0,0,0,0.3)" />
            {/* Legs */}
            <rect x="65" y="140" width="10" height="20" rx="3" fill="url(#savingsGrad)" />
            <rect x="125" y="140" width="10" height="20" rx="3" fill="url(#savingsGrad)" />
            {/* Falling coins */}
            <circle cx="100" cy="40" r="8" fill="var(--warning-color)" className="svg-bounce" />
            <circle cx="140" cy="55" r="6" fill="var(--warning-color)" opacity="0.7" className="svg-bounce" style={{ animationDelay: '0.3s' }} />
          </svg>
        );
      case 'notifications':
        return (
          <svg className="empty-state-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-color)" />
                <stop offset="100%" stopColor="var(--secondary-color)" />
              </linearGradient>
            </defs>
            {/* Bell */}
            <path d="M100 50C80 50 65 70 65 95V115L55 130H145L135 115V95C135 70 120 50 100 50Z" fill="url(#bellGrad)" className="svg-ring" />
            <circle cx="100" cy="145" r="10" fill="url(#bellGrad)" />
            {/* Clapper */}
            <ellipse cx="100" cy="42" rx="8" ry="6" fill="var(--text-secondary)" />
            {/* Zzz */}
            <text x="145" y="75" fontSize="16" fill="var(--text-tertiary)" fontWeight="bold" opacity="0.6">z</text>
            <text x="155" y="60" fontSize="14" fill="var(--text-tertiary)" fontWeight="bold" opacity="0.4">z</text>
            <text x="162" y="48" fontSize="12" fill="var(--text-tertiary)" fontWeight="bold" opacity="0.2">z</text>
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
