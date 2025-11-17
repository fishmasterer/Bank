import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useCategoryBudget } from '../hooks/useCategoryBudget';
import { SkeletonDetailedView } from './SkeletonLoader';
import './DetailedView.css';

const DetailedView = ({ selectedYear, selectedMonth, onEditExpense }) => {
  const { getCategoryBreakdown, familyMembers, deleteExpense, readOnly, getExpensesByMonth, loading } = useExpenses();
  const { getCategoryBudgetStatus } = useCategoryBudget(selectedYear, selectedMonth);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMember, setFilterMember] = useState('all');

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const allCategories = Object.keys(breakdown).sort();

  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Apply filters
  const getFilteredBreakdown = () => {
    let filteredBreakdown = { ...breakdown };

    // Filter by category
    if (filterCategory !== 'all') {
      filteredBreakdown = {
        [filterCategory]: breakdown[filterCategory]
      };
    }

    // Apply search and member filter to expenses within each category
    Object.keys(filteredBreakdown).forEach(category => {
      let expenses = filteredBreakdown[category].expenses;

      // Filter by search term
      if (searchTerm.trim()) {
        expenses = expenses.filter(exp =>
          exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Filter by member
      if (filterMember !== 'all') {
        expenses = expenses.filter(exp => exp.paidBy === parseInt(filterMember));
      }

      filteredBreakdown[category].expenses = expenses;

      // Recalculate totals for filtered expenses
      filteredBreakdown[category].planned = expenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
      filteredBreakdown[category].paid = expenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    });

    // Remove categories with no expenses after filtering
    Object.keys(filteredBreakdown).forEach(category => {
      if (filteredBreakdown[category].expenses.length === 0) {
        delete filteredBreakdown[category];
      }
    });

    return filteredBreakdown;
  };

  const filteredBreakdown = getFilteredBreakdown();
  const categories = Object.keys(filteredBreakdown).sort();

  const hasFilters = searchTerm.trim() || filterCategory !== 'all' || filterMember !== 'all';
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterMember('all');
  };

  // Show skeleton while loading
  if (loading) {
    return <SkeletonDetailedView />;
  }

  return (
    <div className="detailed-view">
      <div className="detailed-header">
        <h2>Breakdown by Category</h2>

        <div className="filters-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Members</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="no-expenses">
          {hasFilters ? 'No expenses match your filters' : 'No expenses for this month'}
        </p>
      ) : (
        <div className="categories-list">
          {categories.map(category => {
            const data = filteredBreakdown[category];
            const isExpanded = expandedCategory === category;
            const budgetStatus = getCategoryBudgetStatus(category, data.paid);

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

                {budgetStatus.status !== 'none' && (
                  <div className={`category-budget-indicator ${budgetStatus.status}`}>
                    <div className="budget-bar-small">
                      <div
                        className="budget-bar-fill-small"
                        style={{ width: `${budgetStatus.percentage}%` }}
                      ></div>
                    </div>
                    <div className="budget-info-small">
                      <span className="budget-label-small">
                        Budget: ${budgetStatus.spent.toFixed(0)} / ${budgetStatus.limit.toFixed(0)}
                      </span>
                      {budgetStatus.status === 'exceeded' && (
                        <span className="budget-status-small exceeded">
                          ⚠️ Over by ${(budgetStatus.spent - budgetStatus.limit).toFixed(0)}
                        </span>
                      )}
                      {budgetStatus.status === 'critical' && (
                        <span className="budget-status-small critical">
                          ⚠️ ${budgetStatus.remaining.toFixed(0)} left
                        </span>
                      )}
                      {budgetStatus.status === 'warning' && (
                        <span className="budget-status-small warning">
                          ⚡ ${budgetStatus.remaining.toFixed(0)} left
                        </span>
                      )}
                      {budgetStatus.status === 'good' && (
                        <span className="budget-status-small good">
                          ✓ ${budgetStatus.remaining.toFixed(0)} left
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
