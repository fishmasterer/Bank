import React, { useState, useCallback } from 'react';
import './FloatingActionButton.css';

export default function FloatingActionButton({
  onMemberExpenses,
  onMonthlyStats,
  onBudgetTracker,
  onExport
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleOptionClick = useCallback((handler) => {
    setIsOpen(false);
    handler();
  }, []);

  return (
    <div className="fab-container">
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fab-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu Options */}
      <div className={`fab-menu ${isOpen ? 'open' : ''}`}>
        <button
          className="fab-menu-item"
          onClick={() => handleOptionClick(onExport)}
          style={{ transitionDelay: isOpen ? '0.15s' : '0s' }}
        >
          <span className="fab-menu-icon">^</span>
          <span className="fab-menu-label">Export Data</span>
        </button>
        <button
          className="fab-menu-item"
          onClick={() => handleOptionClick(onBudgetTracker)}
          style={{ transitionDelay: isOpen ? '0.1s' : '0.05s' }}
        >
          <span className="fab-menu-icon">$</span>
          <span className="fab-menu-label">Budget Tracker</span>
        </button>
        <button
          className="fab-menu-item"
          onClick={() => handleOptionClick(onMonthlyStats)}
          style={{ transitionDelay: isOpen ? '0.05s' : '0.1s' }}
        >
          <span className="fab-menu-icon">+/-</span>
          <span className="fab-menu-label">Monthly Stats</span>
        </button>
        <button
          className="fab-menu-item"
          onClick={() => handleOptionClick(onMemberExpenses)}
          style={{ transitionDelay: isOpen ? '0s' : '0.15s' }}
        >
          <span className="fab-menu-icon">@</span>
          <span className="fab-menu-label">Member Expenses</span>
        </button>
      </div>

      {/* Main FAB Button */}
      <button
        className={`fab-button ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span className="fab-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </span>
      </button>
    </div>
  );
}
