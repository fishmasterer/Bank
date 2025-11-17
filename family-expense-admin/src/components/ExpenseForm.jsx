import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useNotifications } from '../context/NotificationContext';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ExpenseTemplates from './ExpenseTemplates';
import './ExpenseForm.css';

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

const ExpenseForm = ({ editingExpense, onClose, onSuccess, onError }) => {
  const { addExpense, updateExpense, familyMembers } = useExpenses();
  const { addExpenseAction } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    plannedAmount: '',
    paidAmount: '',
    paidBy: familyMembers[0]?.id || 1,
    isRecurring: false,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    notes: ''
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        name: editingExpense.name || '',
        category: editingExpense.category || CATEGORIES[0],
        plannedAmount: editingExpense.plannedAmount || '',
        paidAmount: editingExpense.paidAmount || '',
        paidBy: editingExpense.paidBy || familyMembers[0]?.id || 1,
        isRecurring: editingExpense.isRecurring || false,
        year: editingExpense.year || new Date().getFullYear(),
        month: editingExpense.month || new Date().getMonth() + 1,
        notes: editingExpense.notes || ''
      });
    }
  }, [editingExpense, familyMembers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const expenseData = {
        ...formData,
        plannedAmount: parseFloat(formData.plannedAmount) || 0,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        paidBy: parseInt(formData.paidBy),
        year: parseInt(formData.year),
        month: parseInt(formData.month)
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        addExpenseAction('updated', expenseData.name, expenseData.category);
        onSuccess?.('Expense updated successfully!');
      } else {
        await addExpense(expenseData);
        addExpenseAction('added', expenseData.name, expenseData.category);
        onSuccess?.('Expense added successfully!');
      }

      // Save as template if checkbox is checked
      if (saveAsTemplate && !editingExpense) {
        try {
          await addDoc(collection(db, 'expense-templates'), {
            name: formData.name,
            category: formData.category,
            plannedAmount: parseFloat(formData.plannedAmount) || 0,
            isRecurring: formData.isRecurring,
            notes: formData.notes || '',
            createdAt: new Date().toISOString()
          });
          onSuccess?.('Template saved!');
        } catch (err) {
          console.error('Error saving template:', err);
          // Don't fail the whole operation if template save fails
        }
      }

      onClose();
    } catch (err) {
      console.error('Error submitting expense:', err);
      onError?.(editingExpense ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      category: template.category,
      plannedAmount: template.plannedAmount || '',
      isRecurring: template.isRecurring || false,
      notes: template.notes || ''
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {!editingExpense && (
          <div className="template-actions-bar">
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="btn-template"
            >
              📝 Load Template
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="name">Expense Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Electric bill"
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
                {CATEGORIES.map(cat => (
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
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plannedAmount">Planned Amount ($) *</label>
              <input
                type="number"
                id="plannedAmount"
                name="plannedAmount"
                value={formData.plannedAmount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paidAmount">Paid Amount ($)</label>
              <input
                type="number"
                id="paidAmount"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
                min="2020"
                max="2030"
              />
            </div>

            <div className="form-group">
              <label htmlFor="month">Month *</label>
              <select
                id="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
              />
              <span>Recurring Expense</span>
            </label>
          </div>

          {!editingExpense && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                />
                <span>💾 Save as template for future use</span>
              </label>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  {editingExpense ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>{editingExpense ? 'Update' : 'Add'} Expense</>
              )}
            </button>
          </div>
        </form>
      </div>

      {showTemplates && (
        <ExpenseTemplates
          onClose={() => setShowTemplates(false)}
          onUseTemplate={handleUseTemplate}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}
    </div>
  );
};

export default ExpenseForm;
