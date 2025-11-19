import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './BudgetSettings.css';

const BudgetSettings = ({ selectedYear, selectedMonth, onClose, onSuccess, onError }) => {
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudget();
  }, [selectedYear, selectedMonth]);

  const loadBudget = async () => {
    try {
      const budgetId = `${selectedYear}-${selectedMonth}`;
      const budgetDoc = await getDoc(doc(db, 'budgets', budgetId));

      if (budgetDoc.exists()) {
        const data = budgetDoc.data();
        setMonthlyBudget(data.limit || data.monthlyLimit || '');
      }
    } catch (err) {
      console.error('Error loading budget:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const budgetId = `${selectedYear}-${selectedMonth}`;
      const budgetData = {
        limit: parseFloat(monthlyBudget) || 0,
        monthlyLimit: parseFloat(monthlyBudget) || 0, // Keep both for backward compatibility
        year: selectedYear,
        month: selectedMonth,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'budgets', budgetId), budgetData);
      onSuccess?.('Budget limit updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving budget:', err);
      // Provide more specific error message
      if (err.code === 'permission-denied') {
        onError?.('Permission denied. Please check Firestore rules for budgets collection.');
      } else if (err.code === 'unauthenticated') {
        onError?.('Please sign in to save budget.');
      } else {
        onError?.(`Failed to save budget: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Set Budget Limit</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="budget-form">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner-small"></div>
              <p>Loading budget...</p>
            </div>
          ) : (
            <>
              <p className="budget-description">
                Set a monthly spending limit for <strong>{monthName}</strong>
              </p>

              <div className="form-group">
                <label htmlFor="monthlyBudget">Monthly Budget Limit ($)</label>
                <input
                  type="number"
                  id="monthlyBudget"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 5000.00"
                  required
                  autoFocus
                />
                <small className="helper-text">
                  You'll see warnings when spending reaches 80% and 100% of this limit
                </small>
              </div>

              <div className="form-actions">
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
                  ) : (
                    'Save Budget'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BudgetSettings;
