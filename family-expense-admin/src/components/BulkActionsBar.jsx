import React, { useState } from 'react';
import './BulkActionsBar.css';

const BulkActionsBar = ({
  selectedCount,
  onDeselectAll,
  onBulkDelete,
  onBulkEdit,
  onBulkExport
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    onBulkDelete();
    setShowConfirm(false);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-content">
        <div className="bulk-actions-info">
          <span className="selected-count">{selectedCount}</span>
          <span className="selected-text">
            {selectedCount === 1 ? 'expense' : 'expenses'} selected
          </span>
        </div>

        <div className="bulk-actions-buttons">
          <button
            onClick={onBulkEdit}
            className="bulk-action-btn edit"
            title="Edit selected expenses"
          >
            ✏️ Edit
          </button>

          <button
            onClick={onBulkExport}
            className="bulk-action-btn export"
            title="Export selected expenses"
          >
            📥 Export
          </button>

          <button
            onClick={handleDeleteClick}
            className="bulk-action-btn delete"
            title="Delete selected expenses"
          >
            🗑️ Delete
          </button>

          <button
            onClick={onDeselectAll}
            className="bulk-action-btn cancel"
            title="Deselect all"
          >
            ✕
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="bulk-confirm-overlay" onClick={cancelDelete}>
          <div className="bulk-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-confirm-header">
              <span className="bulk-confirm-icon">⚠️</span>
              <h3 className="bulk-confirm-title">Confirm Deletion</h3>
            </div>
            <p className="bulk-confirm-message">
              Are you sure you want to delete <strong>{selectedCount}</strong> {selectedCount === 1 ? 'expense' : 'expenses'}?
              This action cannot be undone.
            </p>
            <div className="bulk-confirm-actions">
              <button onClick={cancelDelete} className="bulk-confirm-btn cancel">
                Cancel
              </button>
              <button onClick={confirmDelete} className="bulk-confirm-btn confirm">
                Delete {selectedCount} {selectedCount === 1 ? 'expense' : 'expenses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsBar;
