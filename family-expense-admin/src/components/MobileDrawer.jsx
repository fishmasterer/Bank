import React, { useEffect, useRef } from 'react';
import './MobileDrawer.css';

const MobileDrawer = ({
  isOpen,
  onClose,
  onAddExpense,
  onCopyRecurring,
  onSetBudget,
  onCategoryBudgets,
  onManageFamily,
  onBudgetReport,
  onExport,
  readOnly
}) => {
  const drawerRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe to close
  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!drawerRef.current) return;

    currentXRef.current = e.touches[0].clientX;
    const diff = startXRef.current - currentXRef.current;

    // Only allow swiping left (to close)
    if (diff > 0) {
      const translateX = Math.min(diff, 300);
      drawerRef.current.style.transform = `translateX(-${translateX}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!drawerRef.current) return;

    const diff = startXRef.current - currentXRef.current;

    // Close if swiped more than 100px
    if (diff > 100) {
      onClose();
    }

    // Reset transform
    drawerRef.current.style.transform = '';
  };

  const handleItemClick = (action) => {
    action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        ref={drawerRef}
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="drawer-header">
          <h2>Actions</h2>
          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="drawer-nav">
          {!readOnly && (
            <>
              <button
                className="drawer-item drawer-item-primary"
                onClick={() => handleItemClick(onAddExpense)}
              >
                <span className="drawer-item-icon">+</span>
                <span className="drawer-item-text">Add Expense</span>
              </button>

              <button
                className="drawer-item"
                onClick={() => handleItemClick(onCopyRecurring)}
              >
                <span className="drawer-item-icon">🔄</span>
                <span className="drawer-item-text">Copy Recurring</span>
              </button>

              <button
                className="drawer-item"
                onClick={() => handleItemClick(onSetBudget)}
              >
                <span className="drawer-item-icon">💰</span>
                <span className="drawer-item-text">Set Budget</span>
              </button>

              <button
                className="drawer-item"
                onClick={() => handleItemClick(onCategoryBudgets)}
              >
                <span className="drawer-item-icon">📊</span>
                <span className="drawer-item-text">Category Budgets</span>
              </button>

              <button
                className="drawer-item"
                onClick={() => handleItemClick(onManageFamily)}
              >
                <span className="drawer-item-icon">👥</span>
                <span className="drawer-item-text">Manage Family</span>
              </button>

              <div className="drawer-divider" />
            </>
          )}

          <button
            className="drawer-item"
            onClick={() => handleItemClick(onBudgetReport)}
          >
            <span className="drawer-item-icon">📈</span>
            <span className="drawer-item-text">Budget Report</span>
          </button>

          <button
            className="drawer-item"
            onClick={() => handleItemClick(onExport)}
          >
            <span className="drawer-item-icon">📥</span>
            <span className="drawer-item-text">Export Data</span>
          </button>
        </nav>

        <div className="drawer-footer">
          <p>Swipe left to close</p>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
