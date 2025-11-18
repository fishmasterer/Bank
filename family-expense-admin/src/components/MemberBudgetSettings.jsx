import React, { useState, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useMemberBudget } from '../hooks/useMemberBudget';
import './MemberBudgetSettings.css';

const MemberBudgetSettings = ({ selectedYear, selectedMonth, onClose, onSuccess, onError }) => {
  const { familyMembers, getMonthlyTotal } = useExpenses();
  const { memberBudgets, loading, saveMemberBudget, copyMemberBudgetsFromPrevMonth } = useMemberBudget(selectedYear, selectedMonth);
  const [budgetInputs, setBudgetInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Initialize budget inputs when data loads
  useEffect(() => {
    const inputs = {};
    familyMembers.forEach(member => {
      inputs[member.id] = memberBudgets[member.id]?.limit || '';
    });
    setBudgetInputs(inputs);
  }, [familyMembers, memberBudgets]);

  const handleInputChange = (memberId, value) => {
    setBudgetInputs(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const promises = familyMembers.map(member => {
        const amount = parseFloat(budgetInputs[member.id]) || 0;
        return saveMemberBudget(member.id, amount);
      });

      await Promise.all(promises);
      onSuccess?.('Member budgets updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving member budgets:', err);
      onError?.('Failed to save member budgets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyFromPrevMonth = async () => {
    setIsCopying(true);
    try {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const count = await copyMemberBudgetsFromPrevMonth(prevYear, prevMonth);
      if (count > 0) {
        onSuccess?.(`Copied ${count} member budget${count > 1 ? 's' : ''} from last month`);
      } else {
        onSuccess?.('No budgets to copy or all already set');
      }
    } catch (err) {
      console.error('Error copying budgets:', err);
      onError?.('Failed to copy budgets from previous month');
    } finally {
      setIsCopying(false);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const totalBudget = Object.values(budgetInputs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-budget-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Member Budgets</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="member-budget-form">
          {loading ? (
            <div className="loading-state">
              <div className="spinner-small"></div>
              <p>Loading budgets...</p>
            </div>
          ) : (
            <>
              <p className="budget-description">
                Set individual spending limits for <strong>{monthName}</strong>
              </p>

              <button
                type="button"
                className="btn-secondary copy-btn"
                onClick={handleCopyFromPrevMonth}
                disabled={isCopying}
              >
                {isCopying ? 'Copying...' : '📋 Copy from last month'}
              </button>

              <div className="member-budget-list">
                {familyMembers.map(member => {
                  const spent = getMonthlyTotal(selectedYear, selectedMonth, member.id);
                  const budgetLimit = parseFloat(budgetInputs[member.id]) || 0;
                  const percentage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

                  return (
                    <div key={member.id} className="member-budget-item">
                      <div className="member-info">
                        <span className="member-name">{member.name}</span>
                        <span className="member-spent">
                          Spent: ${spent.toFixed(2)}
                        </span>
                      </div>
                      <div className="member-budget-input">
                        <label htmlFor={`budget-${member.id}`}>Budget ($)</label>
                        <input
                          type="number"
                          id={`budget-${member.id}`}
                          value={budgetInputs[member.id] || ''}
                          onChange={(e) => handleInputChange(member.id, e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      {budgetLimit > 0 && (
                        <div className="member-budget-progress">
                          <div className="progress-bar">
                            <div
                              className={`progress-fill ${percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : ''}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`progress-text ${percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : ''}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="total-budget">
                <span>Total Member Budgets:</span>
                <span className="total-amount">${totalBudget.toFixed(2)}</span>
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
                    'Save Budgets'
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

export default MemberBudgetSettings;
