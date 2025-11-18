import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useCategories } from '../hooks/useCategories';
import { useRecurringTemplates } from '../hooks/useRecurringTemplates';
import './RecurringTemplateModal.css';

const RecurringTemplateModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  editingTemplate = null
}) => {
  const { familyMembers } = useExpenses();
  const { categories } = useCategories();
  const { addTemplate, updateTemplate, deleteTemplate } = useRecurringTemplates();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    plannedAmount: '',
    paidBy: '',
    dueDay: '1',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name || '',
        category: editingTemplate.category || '',
        plannedAmount: editingTemplate.plannedAmount || '',
        paidBy: editingTemplate.paidBy || '',
        dueDay: editingTemplate.dueDay || '1',
        notes: editingTemplate.notes || ''
      });
    } else {
      setFormData({
        name: '',
        category: categories[0] || '',
        plannedAmount: '',
        paidBy: familyMembers[0]?.id || '',
        dueDay: '1',
        notes: ''
      });
    }
  }, [editingTemplate, categories, familyMembers]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const templateData = {
        name: formData.name.trim(),
        category: formData.category,
        plannedAmount: parseFloat(formData.plannedAmount) || 0,
        paidBy: parseInt(formData.paidBy),
        dueDay: parseInt(formData.dueDay),
        notes: formData.notes.trim()
      };

      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateData);
        onSuccess?.('Template updated successfully!');
      } else {
        await addTemplate(templateData);
        onSuccess?.('Template created successfully!');
      }

      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      onError?.('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTemplate) return;

    if (window.confirm(`Delete template "${editingTemplate.name}"? This will not affect existing expenses.`)) {
      try {
        await deleteTemplate(editingTemplate.id);
        onSuccess?.('Template deleted');
        onClose();
      } catch (err) {
        console.error('Error deleting template:', err);
        onError?.('Failed to delete template');
      }
    }
  };

  // Generate day options (1-28 to be safe for all months)
  const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingTemplate ? '✏️ Edit Template' : '➕ New Recurring Template'}</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="template-form">
          <div className="form-group">
            <label htmlFor="name">Expense Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Netflix Subscription"
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="paidBy">Paid By *</label>
              <select
                id="paidBy"
                name="paidBy"
                value={formData.paidBy}
                onChange={handleChange}
                required
              >
                <option value="">Select member</option>
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plannedAmount">Amount ($) *</label>
              <input
                type="number"
                id="plannedAmount"
                name="plannedAmount"
                value={formData.plannedAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDay">Due Day of Month</label>
              <select
                id="dueDay"
                name="dueDay"
                value={formData.dueDay}
                onChange={handleChange}
              >
                {dayOptions.map(day => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes about this recurring expense"
              rows="2"
            />
          </div>

          <div className="form-actions">
            {editingTemplate && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger"
              >
                Delete
              </button>
            )}
            <div className="action-buttons">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : editingTemplate ? (
                  'Update Template'
                ) : (
                  'Create Template'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTemplateModal;
