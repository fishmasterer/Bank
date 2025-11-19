import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { COLOR_PALETTE } from '../utils/themeColors';
import './FamilyMembersModal.css';

const FamilyMembersModal = ({ onClose, onSuccess, onError }) => {
  const { familyMembers, addFamilyMember, updateFamilyMember, expenses } = useExpenses();
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('#667eea');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (member) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingColor(member.color || COLOR_PALETTE[(member.id - 1) % COLOR_PALETTE.length]);
  };

  const handleSave = async (memberId) => {
    if (!editingName.trim()) {
      onError?.('Member name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateFamilyMember(memberId, {
        name: editingName.trim(),
        color: editingColor
      });
      setEditingId(null);
      setEditingName('');
      setEditingColor('#667eea');
      onSuccess?.('Member updated successfully!');
    } catch (err) {
      onError?.('Failed to update member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('#667eea');
  };

  const handleAddMember = async () => {
    setIsSubmitting(true);
    try {
      await addFamilyMember();
      onSuccess?.('Member added successfully!');
    } catch (err) {
      onError?.('Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberExpenseCount = (memberId) => {
    return expenses.filter(exp => exp.paidBy === memberId).length;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content family-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Manage Family Members</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="family-content">
          <p className="family-description">
            Manage who can be assigned as the payer for expenses
          </p>

          <div className="members-list">
            {familyMembers.map(member => (
              <div key={member.id} className="member-item">
                {editingId === member.id ? (
                  <div className="member-edit">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Member name"
                      autoFocus
                      disabled={isSubmitting}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSave(member.id);
                        if (e.key === 'Escape') handleCancel();
                      }}
                    />
                    <div className="color-picker-section">
                      <label className="color-label">Member Color</label>
                      <div className="color-options">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`color-option ${editingColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEditingColor(color)}
                            disabled={isSubmitting}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                        <input
                          type="color"
                          value={editingColor}
                          onChange={(e) => setEditingColor(e.target.value)}
                          className="color-input-custom"
                          disabled={isSubmitting}
                          title="Choose custom color"
                        />
                      </div>
                    </div>
                    <div className="edit-actions">
                      <button
                        onClick={() => handleSave(member.id)}
                        className="btn-save"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="btn-cancel"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="member-display">
                    <div className="member-info">
                      <span
                        className="member-color-indicator"
                        style={{ backgroundColor: member.color || COLOR_PALETTE[(member.id - 1) % COLOR_PALETTE.length] }}
                      />
                      <div className="member-details">
                        <span className="member-name">{member.name}</span>
                        <span className="member-stats">
                          {getMemberExpenseCount(member.id)} expense{getMemberExpenseCount(member.id) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(member)}
                      className="btn-edit-small"
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddMember}
            className="btn-add-member"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span>
                Adding...
              </>
            ) : (
              <>+ Add Family Member</>
            )}
          </button>

          <div className="family-note">
            <strong>Note:</strong> Members with expenses cannot be deleted. Edit their names to update existing expenses.
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyMembersModal;
