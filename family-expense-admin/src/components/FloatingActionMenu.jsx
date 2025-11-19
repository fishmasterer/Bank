import React, { useState, useEffect, useCallback } from 'react';
import './FloatingActionMenu.css';

const FloatingActionMenu = ({
  onAddExpense,
  onCopyRecurring,
  onSetBudget,
  onCategoryBudgets,
  onMemberBudgets,
  onManageFamily,
  onBudgetReport,
  onExport,
  readOnly = false,
  bottomNavHidden = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleAction = useCallback((action) => {
    handleClose();
    // Small delay to let the menu close animation start
    setTimeout(() => {
      action();
    }, 150);
  }, [handleClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Prevent body scroll when menu is open
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

  const menuItems = [
    ...(readOnly ? [] : [
      { icon: '+', label: 'Add Expense', action: onAddExpense, primary: true },
      { icon: '🔄', label: 'Copy Recurring', action: onCopyRecurring },
      { icon: '💰', label: 'Set Budget', action: onSetBudget },
      { icon: '📊', label: 'Category Budgets', action: onCategoryBudgets },
      { icon: '👤', label: 'Member Budgets', action: onMemberBudgets },
      { icon: '👥', label: 'Manage Family', action: onManageFamily },
    ]),
    { icon: '📈', label: 'Budget Report', action: onBudgetReport },
    { icon: '📥', label: 'Export', action: onExport },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fab-menu-backdrop ${isOpen ? 'active' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Menu container */}
      <div className={`fab-menu-container ${isOpen ? 'open' : ''} ${bottomNavHidden ? 'nav-hidden' : ''}`}>
        {/* Menu items */}
        <div className="fab-menu-items">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`fab-menu-item ${item.primary ? 'primary' : ''}`}
              onClick={() => handleAction(item.action)}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : `${(menuItems.length - index - 1) * 30}ms`
              }}
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="fab-menu-item-icon">{item.icon}</span>
              <span className="fab-menu-item-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* FAB trigger button */}
        <button
          className={`fab-trigger ${isOpen ? 'open' : ''}`}
          onClick={handleToggle}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <div className="fab-trigger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
    </>
  );
};

export default FloatingActionMenu;
