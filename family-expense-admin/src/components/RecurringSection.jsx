import React, { useMemo, useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './RecurringSection.css';

const RecurringSection = ({ selectedYear, selectedMonth, onEditExpense, onSuccess, onError }) => {
  const { expenses, familyMembers, getExpensesByMonth, copyRecurringExpenses, deleteExpense } = useExpenses();
  const [copying, setCopying] = useState(false);

  // Get recurring expenses for current month
  const currentMonthExpenses = getExpensesByMonth(selectedYear, selectedMonth);
  const recurringExpenses = useMemo(() =>
    currentMonthExpenses.filter(exp => exp.isRecurring),
    [currentMonthExpenses]
  );

  // Get previous month's recurring expenses for comparison
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const prevMonthExpenses = getExpensesByMonth(prevYear, prevMonth);
  const prevRecurring = useMemo(() =>
    prevMonthExpenses.filter(exp => exp.isRecurring),
    [prevMonthExpenses]
  );

  // Calculate totals
  const totalPlanned = recurringExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  const totalPaid = recurringExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);

  // Group by category
  const byCategory = useMemo(() => {
    const grouped = {};
    recurringExpenses.forEach(exp => {
      if (!grouped[exp.category]) {
        grouped[exp.category] = [];
      }
      grouped[exp.category].push(exp);
    });
    return grouped;
  }, [recurringExpenses]);

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const getMemberColor = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member?.color || '#667eea';
  };

  const handleCopyRecurring = async () => {
    setCopying(true);
    try {
      const count = await copyRecurringExpenses(prevYear, prevMonth, selectedYear, selectedMonth);

      if (count > 0) {
        onSuccess(`Copied ${count} recurring expense${count > 1 ? 's' : ''} from last month`);
      } else {
        onSuccess('No new recurring expenses to copy');
      }
    } catch (err) {
      onError('Failed to copy recurring expenses');
    } finally {
      setCopying(false);
    }
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Delete "${expense.name}"?`)) {
      try {
        await deleteExpense(expense.id);
        onSuccess('Expense deleted');
      } catch (err) {
        onError('Failed to delete expense');
      }
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const prevMonthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('en-US', {
    month: 'long'
  });

  return (
    <div className="recurring-section">
      {/* Header with copy action */}
      <div className="recurring-header-card">
        <div className="recurring-header-content">
          <h2>Recurring Expenses</h2>
          <p className="recurring-subtitle">{monthName}</p>
        </div>

        {prevRecurring.length > 0 && (
          <button
            className="btn-primary copy-btn"
            onClick={handleCopyRecurring}
            disabled={copying}
          >
            {copying ? 'Copying...' : `Copy from ${prevMonthName}`}
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="recurring-stats">
        <div className="recurring-stat">
          <span className="stat-value">{recurringExpenses.length}</span>
          <span className="stat-label">Recurring Items</span>
        </div>
        <div className="recurring-stat">
          <span className="stat-value">${totalPlanned.toLocaleString()}</span>
          <span className="stat-label">Planned</span>
        </div>
        <div className="recurring-stat">
          <span className="stat-value">${totalPaid.toLocaleString()}</span>
          <span className="stat-label">Paid</span>
        </div>
      </div>

      {/* Recurring Expenses List */}
      {recurringExpenses.length > 0 ? (
        <div className="recurring-list">
          {Object.entries(byCategory)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([category, items]) => (
              <div key={category} className="recurring-category">
                <h3 className="category-header">{category}</h3>
                <div className="recurring-items">
                  {items.map(expense => (
                    <div key={expense.id} className="recurring-item">
                      <div className="recurring-item-main">
                        <div className="recurring-item-info">
                          <span className="expense-name">{expense.name}</span>
                          <div className="expense-meta">
                            <span
                              className="member-badge"
                              style={{ backgroundColor: getMemberColor(expense.paidBy) }}
                            >
                              {getMemberName(expense.paidBy)}
                            </span>
                          </div>
                        </div>
                        <div className="recurring-item-amounts">
                          <span className="amount-paid">
                            ${(expense.paidAmount || 0).toLocaleString()}
                          </span>
                          <span className="amount-planned">
                            of ${(expense.plannedAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="recurring-item-actions">
                        <button
                          className="btn-action"
                          onClick={() => onEditExpense(expense)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action btn-danger"
                          onClick={() => handleDelete(expense)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="empty-recurring">
          <span className="empty-icon">🔄</span>
          <p className="empty-title">No recurring expenses</p>
          <p className="empty-hint">
            {prevRecurring.length > 0
              ? `Copy ${prevRecurring.length} recurring expense${prevRecurring.length > 1 ? 's' : ''} from ${prevMonthName}`
              : 'Add expenses and mark them as recurring to see them here'
            }
          </p>
        </div>
      )}

      {/* Previous Month Preview */}
      {prevRecurring.length > 0 && recurringExpenses.length === 0 && (
        <div className="prev-month-preview">
          <h3>Available from {prevMonthName}</h3>
          <div className="preview-list">
            {prevRecurring.slice(0, 5).map(exp => (
              <div key={exp.id} className="preview-item">
                <span className="preview-name">{exp.name}</span>
                <span className="preview-amount">
                  ${(exp.plannedAmount || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {prevRecurring.length > 5 && (
              <p className="preview-more">
                +{prevRecurring.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringSection;
