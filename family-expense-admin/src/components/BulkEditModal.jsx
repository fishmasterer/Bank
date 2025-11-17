import React, { useState } from 'react';
import './BulkEditModal.css';

const CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent/Mortgage',
  'Transportation',
  'Healthcare',
  'Education',
  'Entertainment',
  'Insurance',
  'Dining Out',
  'Shopping',
  'Other'
];

const BulkEditModal = ({ selectedExpenses, familyMembers, onSave, onClose }) => {
  const [editFields, setEditFields] = useState({
    category: '',
    paidBy: '',
    isRecurring: '',
    markAsPaid: false
  });

  const handleFieldChange = (field, value) => {
    setEditFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Only include fields that have been changed (non-empty values)
    const updates = {};

    if (editFields.category) updates.category = editFields.category;
    if (editFields.paidBy) updates.paidBy = parseInt(editFields.paidBy);
    if (editFields.isRecurring !== '') updates.isRecurring = editFields.isRecurring === 'true';
    if (editFields.markAsPaid) {
      updates.paidAmount = selectedExpenses.map(exp => exp.plannedAmount || 0);
    }

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    onSave(updates);
  };

  const hasChanges = editFields.category || editFields.paidBy || editFields.isRecurring !== '' || editFields.markAsPaid;

  return (
    <div className="bulk-edit-overlay" onClick={onClose}>
      <div className="bulk-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bulk-edit-header">
          <h3>✏️ Bulk Edit</h3>
          <button onClick={onClose} className="bulk-edit-close" aria-label="Close">
            ×
          </button>
        </div>

        <div className="bulk-edit-content">
          <p className="bulk-edit-info">
            Editing <strong>{selectedExpenses.length}</strong> {selectedExpenses.length === 1 ? 'expense' : 'expenses'}.
            Only selected fields will be updated.
          </p>

          <div className="bulk-edit-form">
            {/* Category */}
            <div className="bulk-edit-field">
              <label htmlFor="bulk-category">Change Category:</label>
              <select
                id="bulk-category"
                value={editFields.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="bulk-edit-select"
              >
                <option value="">-- Keep unchanged --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Paid By */}
            <div className="bulk-edit-field">
              <label htmlFor="bulk-paidBy">Change Paid By:</label>
              <select
                id="bulk-paidBy"
                value={editFields.paidBy}
                onChange={(e) => handleFieldChange('paidBy', e.target.value)}
                className="bulk-edit-select"
              >
                <option value="">-- Keep unchanged --</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Is Recurring */}
            <div className="bulk-edit-field">
              <label htmlFor="bulk-recurring">Change Recurring Status:</label>
              <select
                id="bulk-recurring"
                value={editFields.isRecurring}
                onChange={(e) => handleFieldChange('isRecurring', e.target.value)}
                className="bulk-edit-select"
              >
                <option value="">-- Keep unchanged --</option>
                <option value="true">🔄 Recurring</option>
                <option value="false">📌 One-time</option>
              </select>
            </div>

            {/* Mark as Paid */}
            <div className="bulk-edit-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={editFields.markAsPaid}
                  onChange={(e) => handleFieldChange('markAsPaid', e.target.checked)}
                />
                <span>Mark all as paid (set paid amount = planned amount)</span>
              </label>
            </div>
          </div>

          <div className="bulk-edit-preview">
            <p className="preview-title">Changes to apply:</p>
            {!hasChanges ? (
              <p className="preview-empty">No changes selected</p>
            ) : (
              <ul className="preview-list">
                {editFields.category && (
                  <li>Category → <strong>{editFields.category}</strong></li>
                )}
                {editFields.paidBy && (
                  <li>Paid By → <strong>{familyMembers.find(m => m.id === parseInt(editFields.paidBy))?.name}</strong></li>
                )}
                {editFields.isRecurring !== '' && (
                  <li>Recurring → <strong>{editFields.isRecurring === 'true' ? '🔄 Yes' : '📌 No'}</strong></li>
                )}
                {editFields.markAsPaid && (
                  <li>Set paid amount to planned amount for all</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="bulk-edit-actions">
          <button onClick={onClose} className="bulk-edit-btn cancel">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bulk-edit-btn save"
            disabled={!hasChanges}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;
