import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './DetailedView.css';

const DetailedView = ({ selectedYear, selectedMonth, onEditExpense }) => {
  const { getCategoryBreakdown, familyMembers, deleteExpense, readOnly } = useExpenses();
  const [expandedCategory, setExpandedCategory] = useState(null);

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const categories = Object.keys(breakdown).sort();

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="detailed-view">
      <h2>Breakdown by Category</h2>
      {categories.length === 0 ? (
        <p className="no-expenses">No expenses for this month</p>
      ) : (
        <div className="categories-list">
          {categories.map(category => {
            const data = breakdown[category];
            const isExpanded = expandedCategory === category;

            return (
              <div key={category} className="category-card">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <h3>{category}</h3>
                  <div className="category-totals">
                    <span className="planned">Planned: ${data.planned.toFixed(2)}</span>
                    <span className="paid">Paid: ${data.paid.toFixed(2)}</span>
                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="expenses-list">
                    {data.expenses.map(expense => (
                      <div key={expense.id} className="expense-item">
                        <div className="expense-main">
                          <div className="expense-info">
                            <span className="expense-name">{expense.name}</span>
                            <span className="expense-type">
                              {expense.isRecurring ? '🔄 Recurring' : '📌 One-time'}
                            </span>
                          </div>
                          <div className="expense-amounts">
                            <span className="planned">
                              Planned: ${(expense.plannedAmount || 0).toFixed(2)}
                            </span>
                            <span className="paid">
                              Paid: ${(expense.paidAmount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="expense-meta">
                          <span className="paid-by">Paid by: {getMemberName(expense.paidBy)}</span>
                          {expense.notes && (
                            <span className="notes">Note: {expense.notes}</span>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="expense-actions">
                            <button
                              onClick={() => onEditExpense(expense)}
                              className="btn-edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this expense?')) {
                                  deleteExpense(expense.id);
                                }
                              }}
                              className="btn-delete"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DetailedView;
