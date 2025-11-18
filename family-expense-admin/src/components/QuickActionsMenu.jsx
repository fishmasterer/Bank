import React, { useEffect, useRef } from 'react';
import './QuickActionsMenu.css';

const QuickActionsMenu = ({
  isOpen,
  onClose,
  position,
  onEdit,
  onDelete,
  onDuplicate,
  expense,
  readOnly = false
}) => {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

  const handleAction = (action) => {
    onClose();
    // Small delay for visual feedback
    setTimeout(() => action(expense), 150);
  };

  // Adjust position to stay on screen
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (adjustedPosition.x + menuRect.width > viewportWidth - 16) {
      adjustedPosition.x = viewportWidth - menuRect.width - 16;
    }
    if (adjustedPosition.y + menuRect.height > viewportHeight - 16) {
      adjustedPosition.y = viewportHeight - menuRect.height - 16;
    }
  }

  return (
    <>
      <div className="quick-actions-backdrop" onClick={onClose} />
      <div
        ref={menuRef}
        className="quick-actions-menu"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
      >
        <div className="quick-actions-header">
          <span className="quick-actions-amount">
            ${expense?.amount?.toFixed(2)}
          </span>
          <span className="quick-actions-category">
            {expense?.category}
          </span>
        </div>

        <div className="quick-actions-divider" />

        {!readOnly && (
          <>
            <button
              className="quick-action-item"
              onClick={() => handleAction(onEdit)}
            >
              <span className="quick-action-icon">✏️</span>
              <span>Edit</span>
            </button>

            <button
              className="quick-action-item"
              onClick={() => handleAction(onDuplicate)}
            >
              <span className="quick-action-icon">📋</span>
              <span>Duplicate</span>
            </button>

            <div className="quick-actions-divider" />

            <button
              className="quick-action-item quick-action-danger"
              onClick={() => handleAction(onDelete)}
            >
              <span className="quick-action-icon">🗑️</span>
              <span>Delete</span>
            </button>
          </>
        )}

        {readOnly && (
          <div className="quick-actions-readonly">
            View only mode
          </div>
        )}
      </div>
    </>
  );
};

export default QuickActionsMenu;
