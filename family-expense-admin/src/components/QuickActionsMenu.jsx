import React, { useEffect, useRef, useState } from 'react';
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
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position after menu renders to keep it on screen
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (newX + menuRect.width > viewportWidth - padding) {
      newX = viewportWidth - menuRect.width - padding;
    }
    if (newX < padding) {
      newX = padding;
    }

    // Adjust vertical position
    if (newY + menuRect.height > viewportHeight - padding) {
      newY = viewportHeight - menuRect.height - padding;
    }
    if (newY < padding) {
      newY = padding;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isOpen, position]);

  // Close on click outside - use longer delay to prevent closing on touch release
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

    // Longer delay to ensure touch events have fully completed
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 300);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
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

  return (
    <>
      <div
        className="quick-actions-backdrop"
        onClick={onClose}
        onTouchEnd={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
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
            ${(expense?.paidAmount || expense?.plannedAmount || 0).toFixed(2)}
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
