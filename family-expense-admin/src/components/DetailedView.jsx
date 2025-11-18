import React, { useState, useEffect, useCallback } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useCategoryBudget } from '../hooks/useCategoryBudget';
import { useNotifications } from '../context/NotificationContext';
import { useUndoDelete } from '../hooks/useUndoDelete';
import useLongPress from '../hooks/useLongPress';
import { SkeletonDetailedView } from './SkeletonLoader';
import EmptyState from './EmptyState';
import MultiSelect from './MultiSelect';
import FilterPresets from './FilterPresets';
import BulkActionsBar from './BulkActionsBar';
import BulkEditModal from './BulkEditModal';
import QuickActionsMenu from './QuickActionsMenu';
import { getCategoryGradientStyle, getCategoryIcon } from '../utils/categoryColors';
import './DetailedView.css';

// ExpenseItem component with long press support
const ExpenseItem = ({
  expense,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onLongPress,
  getMemberName,
  readOnly,
  trackDelete,
  addExpenseAction
}) => {
  const { handlers, isPressed } = useLongPress(
    // Long press handler
    () => {
      // Get center position of the item for menu placement
      const element = document.getElementById(`expense-${expense.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        onLongPress(expense, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    },
    // Click handler (no-op, let individual elements handle clicks)
    null,
    { delay: 500, movementThreshold: 10 }
  );

  return (
    <div
      id={`expense-${expense.id}`}
      className={`expense-item stagger-item ${isSelected ? 'selected' : ''} ${isPressed ? 'pressed' : ''}`}
      {...handlers}
    >
      {!readOnly && (
        <div className="expense-checkbox-wrapper">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(expense.id)}
            className="expense-checkbox"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${expense.name}`}
          />
        </div>
      )}
      <div className="expense-main">
        <div className="expense-info">
          <span className="expense-name">{expense.name}</span>
          <span className="expense-type">
            {expense.isRecurring ? '🔄 Recurring' : '📌 One-time'}
          </span>
        </div>
        <div className="expense-amounts">
          <span className="planned">
            Plan: ${(expense.plannedAmount || 0).toFixed(2)}
          </span>
          <span className="paid">
            Paid: ${(expense.paidAmount || 0).toFixed(2)}
          </span>
        </div>
      </div>
      <div className="expense-meta">
        <span className="paid-by">👤 {getMemberName(expense.paidBy)}</span>
        {expense.notes && (
          <span className="notes">💬 {expense.notes}</span>
        )}
        {expense.attachments && expense.attachments.length > 0 && (
          <div className="expense-attachments">
            <span className="attachments-label">
              📎 {expense.attachments.length} {expense.attachments.length === 1 ? 'receipt' : 'receipts'}
            </span>
            <div className="attachments-thumbnails">
              {expense.attachments.slice(0, 3).map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-thumb"
                  title={attachment.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  {attachment.type?.startsWith('image/') ? (
                    <img src={attachment.url} alt={attachment.name} />
                  ) : (
                    <span className="thumb-icon">📄</span>
                  )}
                </a>
              ))}
              {expense.attachments.length > 3 && (
                <span className="more-attachments">
                  +{expense.attachments.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {!readOnly && (
        <div className="expense-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const sourceElement = document.getElementById(`expense-${expense.id}`);
              onEdit(expense, sourceElement);
            }}
            className="btn-edit btn-press"
            aria-label={`Edit ${expense.name}`}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this expense?')) {
                trackDelete(expense);
                onDelete(expense.id);
                addExpenseAction('deleted', expense.name, expense.category);
              }
            }}
            className="btn-delete btn-press"
            aria-label={`Delete ${expense.name}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const DetailedView = ({ selectedYear, selectedMonth, onEditExpense, onAddExpense }) => {
  const { getCategoryBreakdown, familyMembers, deleteExpense, readOnly, loading, updateExpense } = useExpenses();
  const { getCategoryBudgetStatus } = useCategoryBudget(selectedYear, selectedMonth);
  const { addExpenseAction, addBudgetAlert } = useNotifications();
  const { trackDelete, undoDelete, canUndo, deletedItem } = useUndoDelete();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Quick actions menu state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({ x: 0, y: 0 });
  const [quickActionsExpense, setQuickActionsExpense] = useState(null);

  // Handlers for quick actions menu
  const handleQuickActionsOpen = useCallback((expense, clientX, clientY) => {
    setQuickActionsExpense(expense);
    setQuickActionsPosition({ x: clientX, y: clientY });
    setQuickActionsOpen(true);
  }, []);

  const handleQuickActionsClose = useCallback(() => {
    setQuickActionsOpen(false);
    setQuickActionsExpense(null);
  }, []);

  const handleQuickDelete = useCallback((expense) => {
    if (window.confirm('Delete this expense?')) {
      trackDelete(expense);
      deleteExpense(expense.id);
      addExpenseAction('deleted', expense.name, expense.category);
    }
  }, [trackDelete, deleteExpense, addExpenseAction]);

  const handleQuickDuplicate = useCallback((expense) => {
    // Create a duplicate expense (without ID, so it gets a new one)
    const duplicateExpense = {
      ...expense,
      name: `${expense.name} (Copy)`,
      id: undefined
    };
    onEditExpense(duplicateExpense);
  }, [onEditExpense]);

  // Wrapper to include source element for shared element transition
  const handleQuickEdit = useCallback((expense) => {
    const sourceElement = document.getElementById(`expense-${expense.id}`);
    onEditExpense(expense, sourceElement);
  }, [onEditExpense]);

  // Show/hide undo toast
  useEffect(() => {
    if (canUndo) {
      setShowUndoToast(true);
      const timer = setTimeout(() => setShowUndoToast(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowUndoToast(false);
    }
  }, [canUndo, deletedItem]);

  const handleUndo = async () => {
    const success = await undoDelete();
    if (success) {
      addExpenseAction('restored', deletedItem?.name || 'expense', deletedItem?.category || 'Unknown');
    }
    setShowUndoToast(false);
  };

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const allCategories = Object.keys(breakdown).sort();

  // Check budgets and notify when breakdown changes
  useEffect(() => {
    if (loading || !breakdown) return;

    Object.keys(breakdown).forEach(category => {
      const data = breakdown[category];
      const budgetStatus = getCategoryBudgetStatus(category, data.paid);

      // Only notify for warning, critical, or exceeded states
      if (['warning', 'critical', 'exceeded'].includes(budgetStatus.status)) {
        addBudgetAlert(category, budgetStatus.spent, budgetStatus.limit, budgetStatus.status);
      }
    });
  }, [breakdown, loading]); // Only run when breakdown changes

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

  // Bulk selection functions
  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const toggleCategorySelection = (category) => {
    const categoryExpenses = filteredBreakdown[category].expenses;
    const categoryExpenseIds = categoryExpenses.map(exp => exp.id);
    const allSelected = categoryExpenseIds.every(id => selectedExpenseIds.has(id));

    setSelectedExpenseIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        categoryExpenseIds.forEach(id => newSet.delete(id));
      } else {
        categoryExpenseIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const deselectAll = () => {
    setSelectedExpenseIds(new Set());
  };

  const getSelectedExpenses = () => {
    const allExpenses = [];
    Object.values(filteredBreakdown).forEach(catData => {
      allExpenses.push(...catData.expenses);
    });
    return allExpenses.filter(exp => selectedExpenseIds.has(exp.id));
  };

  const handleBulkDelete = async () => {
    const expensesToDelete = Array.from(selectedExpenseIds);
    for (const expenseId of expensesToDelete) {
      await deleteExpense(expenseId);
    }
    setSelectedExpenseIds(new Set());
  };

  const handleBulkEdit = () => {
    setShowBulkEdit(true);
  };

  const handleBulkEditSave = async (updates) => {
    const expensesToUpdate = getSelectedExpenses();
    for (const expense of expensesToUpdate) {
      const updatedExpense = { ...expense, ...updates };
      if (updates.paidAmount) {
        updatedExpense.paidAmount = expense.plannedAmount || 0;
      }
      await updateExpense(expense.id, updatedExpense);
    }
    setSelectedExpenseIds(new Set());
    setShowBulkEdit(false);
  };

  const handleBulkExport = () => {
    const expensesToExport = getSelectedExpenses();
    const csv = [
      ['Name', 'Category', 'Planned Amount', 'Paid Amount', 'Paid By', 'Recurring', 'Year', 'Month', 'Notes'].join(','),
      ...expensesToExport.map(exp => [
        `"${exp.name}"`,
        `"${exp.category}"`,
        exp.plannedAmount || 0,
        exp.paidAmount || 0,
        `"${getMemberName(exp.paidBy)}"`,
        exp.isRecurring ? 'Yes' : 'No',
        exp.year,
        exp.month,
        `"${exp.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${selectedYear}-${selectedMonth}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        <div className="categories-list stagger-fast">
          {categories.map((category) => {
            const data = filteredBreakdown[category];
            const isExpanded = expandedCategory === category;
            const budgetStatus = getCategoryBudgetStatus(category, data.paid);

            const categoryExpenseIds = data.expenses.map(exp => exp.id);
            const allCategorySelected = categoryExpenseIds.length > 0 && categoryExpenseIds.every(id => selectedExpenseIds.has(id));

            return (
              <div key={category} className="category-card stagger-item hover-lift">
                <div className="category-header">
                  {!readOnly && data.expenses.length > 0 && (
                    <div className="category-select-all" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={allCategorySelected}
                        onChange={() => toggleCategorySelection(category)}
                        className="category-checkbox"
                        title={allCategorySelected ? 'Deselect all in category' : 'Select all in category'}
                      />
                    </div>
                  )}
                  <div
                    className="category-header-content"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="category-name-wrapper">
                      <span
                        className="category-badge"
                        style={{ background: getCategoryGradientStyle(category) }}
                      >
                        <span className="category-icon">{getCategoryIcon(category)}</span>
                        {category}
                      </span>
                    </div>
                    <div className="category-totals">
                      <span className="planned">Planned: ${data.planned.toFixed(2)}</span>
                      <span className="paid">Paid: ${data.paid.toFixed(2)}</span>
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    </div>
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
                  <div className="expenses-list stagger-fast">
                    {data.expenses.map((expense) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        isSelected={selectedExpenseIds.has(expense.id)}
                        onToggleSelect={toggleExpenseSelection}
                        onEdit={onEditExpense}
                        onDelete={deleteExpense}
                        onLongPress={handleQuickActionsOpen}
                        getMemberName={getMemberName}
                        readOnly={readOnly}
                        trackDelete={trackDelete}
                        addExpenseAction={addExpenseAction}
                      />
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

      {!readOnly && (
        <BulkActionsBar
          selectedCount={selectedExpenseIds.size}
          onDeselectAll={deselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEdit}
          onBulkExport={handleBulkExport}
        />
      )}

      {showBulkEdit && (
        <BulkEditModal
          selectedExpenses={getSelectedExpenses()}
          familyMembers={familyMembers}
          onSave={handleBulkEditSave}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {/* Undo Delete Toast */}
      {showUndoToast && canUndo && (
        <div className="undo-toast">
          <span className="undo-message">
            Deleted "{deletedItem?.name}"
          </span>
          <button onClick={handleUndo} className="undo-button">
            Undo
          </button>
        </div>
      )}

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        isOpen={quickActionsOpen}
        onClose={handleQuickActionsClose}
        position={quickActionsPosition}
        onEdit={handleQuickEdit}
        onDelete={handleQuickDelete}
        onDuplicate={handleQuickDuplicate}
        expense={quickActionsExpense}
        readOnly={readOnly}
      />
    </div>
  );
};

export default DetailedView;
