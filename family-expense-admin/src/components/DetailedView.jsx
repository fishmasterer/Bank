import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useCategoryBudget } from '../hooks/useCategoryBudget';
import { SkeletonDetailedView } from './SkeletonLoader';
import EmptyState from './EmptyState';
import MultiSelect from './MultiSelect';
import FilterPresets from './FilterPresets';
import './DetailedView.css';

const DetailedView = ({ selectedYear, selectedMonth, onEditExpense, onAddExpense }) => {
  const { getCategoryBreakdown, familyMembers, deleteExpense, readOnly, loading } = useExpenses();
  const { getCategoryBudgetStatus } = useCategoryBudget(selectedYear, selectedMonth);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showPresets, setShowPresets] = useState(false);

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

    // Filter by categories (multi-select)
    if (selectedCategories.length > 0) {
      const filtered = {};
      selectedCategories.forEach(cat => {
        if (breakdown[cat]) {
          filtered[cat] = breakdown[cat];
        }
      });
      filteredBreakdown = filtered;
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

      // Filter by members (multi-select)
      if (selectedMembers.length > 0) {
        expenses = expenses.filter(exp => selectedMembers.includes(exp.paidBy));
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

  const hasFilters = searchTerm.trim() || selectedCategories.length > 0 || selectedMembers.length > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedMembers([]);
  };

  const handleLoadPreset = (filters) => {
    setSearchTerm(filters.searchTerm || '');
    setSelectedCategories(filters.selectedCategories || []);
    setSelectedMembers(filters.selectedMembers || []);
  };

  const getCurrentFilters = () => ({
    searchTerm,
    selectedCategories,
    selectedMembers
  });

  // Show skeleton while loading
  if (loading) {
    return <SkeletonDetailedView />;
  }

  // Prepare options for multi-select
  const categoryOptions = allCategories.map(cat => ({ value: cat, label: cat }));
  const memberOptions = familyMembers.map(m => ({ value: m.id, label: m.name }));

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

          <MultiSelect
            options={categoryOptions}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="All Categories"
            label="Categories"
          />

          <MultiSelect
            options={memberOptions}
            selected={selectedMembers}
            onChange={setSelectedMembers}
            placeholder="All Members"
            label="Members"
          />

          <div className="filter-actions">
            {hasFilters && (
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            )}
            <button onClick={() => setShowPresets(true)} className="presets-btn">
              💾 Presets
            </button>
          </div>
        </div>
      </div>

      {categories.length === 0 ? (
        hasFilters ? (
          <EmptyState
            illustration="search"
            title="No matches found"
            message="Try adjusting your filters or search term"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            illustration="expenses"
            title="No expenses yet"
            message="Start tracking your expenses for this month"
            actionLabel="Add First Expense"
            onAction={onAddExpense}
          />
        )
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

      {showPresets && (
        <FilterPresets
          currentFilters={getCurrentFilters()}
          onLoadPreset={handleLoadPreset}
          onClose={() => setShowPresets(false)}
        />
      )}
    </div>
  );
};

export default DetailedView;
