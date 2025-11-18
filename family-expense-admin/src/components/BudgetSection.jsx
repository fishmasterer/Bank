import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useBudget } from '../hooks/useBudget';
import { useCategoryBudget } from '../hooks/useCategoryBudget';
import { getThemeColors } from '../utils/themeColors';
import './BudgetSection.css';

const BudgetSection = ({ selectedYear, selectedMonth, onSuccess, onError }) => {
  const { expenses, getExpensesByMonth } = useExpenses();
  const { budget, loading: budgetLoading, saveBudget } = useBudget(selectedYear, selectedMonth);
  const { categoryBudgets, loading: categoryLoading } = useCategoryBudget(selectedYear, selectedMonth);

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');

  const monthExpenses = getExpensesByMonth(selectedYear, selectedMonth);
  const totalPlanned = monthExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = monthExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  const budgetLimit = budget?.limit || budget?.monthlyLimit || 0;
  const remaining = budgetLimit - totalPaid;
  const utilizationPercent = budgetLimit > 0 ? (totalPaid / budgetLimit) * 100 : 0;

  // Calculate category breakdown
  const categoryBreakdown = {};
  monthExpenses.forEach(exp => {
    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { planned: 0, paid: 0 };
    }
    categoryBreakdown[exp.category].planned += exp.plannedAmount || 0;
    categoryBreakdown[exp.category].paid += exp.paidAmount || 0;
  });

  const handleSaveBudget = async () => {
    try {
      const amount = parseFloat(budgetAmount);
      if (isNaN(amount) || amount < 0) {
        onError('Please enter a valid budget amount');
        return;
      }
      await saveBudget(amount);
      setEditingBudget(false);
      onSuccess('Budget saved successfully');
    } catch (err) {
      onError('Failed to save budget');
    }
  };

  const getStatusColor = (percent) => {
    if (percent >= 100) return '#ef4444';
    if (percent >= 80) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = (percent) => {
    if (percent >= 100) return 'Over Budget';
    if (percent >= 80) return 'Warning';
    return 'On Track';
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (budgetLoading || categoryLoading) {
    return (
      <div className="budget-section">
        <div className="loading-state">Loading budget data...</div>
      </div>
    );
  }

  return (
    <div className="budget-section">
      {/* Monthly Budget Overview */}
      <div className="budget-card main-budget">
        <div className="budget-card-header">
          <h2>Monthly Budget</h2>
          <span className="month-label">{monthName}</span>
        </div>

        {budgetLimit > 0 ? (
          <>
            <div className="budget-amount-display">
              <span className="budget-value">${budgetLimit.toLocaleString()}</span>
              {!editingBudget && (
                <button
                  className="btn-edit-inline"
                  onClick={() => {
                    setBudgetAmount(budgetLimit.toString());
                    setEditingBudget(true);
                  }}
                >
                  Edit
                </button>
              )}
            </div>

            <div className="budget-progress-container">
              <div className="budget-progress-bar">
                <div
                  className="budget-progress-fill"
                  style={{
                    width: `${Math.min(utilizationPercent, 100)}%`,
                    backgroundColor: getStatusColor(utilizationPercent)
                  }}
                />
              </div>
              <div className="budget-progress-labels">
                <span>${totalPaid.toLocaleString()} spent</span>
                <span style={{ color: getStatusColor(utilizationPercent) }}>
                  {utilizationPercent.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="budget-stats">
              <div className="budget-stat">
                <span className="stat-label">Remaining</span>
                <span className={`stat-value ${remaining < 0 ? 'negative' : 'positive'}`}>
                  ${Math.abs(remaining).toLocaleString()}
                  {remaining < 0 && ' over'}
                </span>
              </div>
              <div className="budget-stat">
                <span className="stat-label">Planned</span>
                <span className="stat-value">${totalPlanned.toLocaleString()}</span>
              </div>
              <div className="budget-stat">
                <span className="stat-label">Status</span>
                <span
                  className="stat-value status-badge"
                  style={{ backgroundColor: getStatusColor(utilizationPercent) }}
                >
                  {getStatusText(utilizationPercent)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="no-budget-set">
            <p>No budget set for this month</p>
            <button
              className="btn-primary"
              onClick={() => setEditingBudget(true)}
            >
              Set Budget
            </button>
          </div>
        )}

        {editingBudget && (
          <div className="budget-edit-form">
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="Enter budget amount"
              className="budget-input"
              autoFocus
            />
            <div className="budget-edit-actions">
              <button
                className="btn-secondary"
                onClick={() => setEditingBudget(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveBudget}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      <div className="budget-card">
        <h2>Spending by Category</h2>

        {Object.keys(categoryBreakdown).length > 0 ? (
          <div className="category-budget-list">
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1].paid - a[1].paid)
              .map(([category, data]) => {
                const categoryLimit = categoryBudgets?.[category] || 0;
                const categoryPercent = categoryLimit > 0
                  ? (data.paid / categoryLimit) * 100
                  : 0;

                return (
                  <div key={category} className="category-budget-item">
                    <div className="category-budget-header">
                      <span className="category-name">{category}</span>
                      <span className="category-amount">
                        ${data.paid.toLocaleString()}
                        {categoryLimit > 0 && (
                          <span className="category-limit"> / ${categoryLimit.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                    {categoryLimit > 0 && (
                      <div className="category-progress-bar">
                        <div
                          className="category-progress-fill"
                          style={{
                            width: `${Math.min(categoryPercent, 100)}%`,
                            backgroundColor: getStatusColor(categoryPercent)
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="empty-state">No expenses this month</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="budget-card">
        <h2>Quick Stats</h2>
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="quick-stat-icon">📊</span>
            <span className="quick-stat-value">{monthExpenses.length}</span>
            <span className="quick-stat-label">Expenses</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">📁</span>
            <span className="quick-stat-value">{Object.keys(categoryBreakdown).length}</span>
            <span className="quick-stat-label">Categories</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">💵</span>
            <span className="quick-stat-value">
              ${(totalPaid / Math.max(monthExpenses.length, 1)).toFixed(0)}
            </span>
            <span className="quick-stat-label">Avg/Expense</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-icon">📈</span>
            <span className="quick-stat-value">
              {totalPlanned > 0
                ? `${((totalPaid / totalPlanned) * 100).toFixed(0)}%`
                : '0%'
              }
            </span>
            <span className="quick-stat-label">Plan vs Actual</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
