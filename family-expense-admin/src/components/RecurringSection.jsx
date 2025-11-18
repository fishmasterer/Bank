import React, { useMemo, useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useRecurringTemplates } from '../hooks/useRecurringTemplates';
import RecurringTemplateModal from './RecurringTemplateModal';
import './RecurringSection.css';

const RecurringSection = ({ selectedYear, selectedMonth, onEditExpense, onSuccess, onError }) => {
  const { expenses, familyMembers, getExpensesByMonth, copyRecurringExpenses, deleteExpense, addExpense } = useExpenses();
  const {
    templates,
    loading: templatesLoading,
    generateExpensesFromTemplates,
    toggleTemplateActive,
    getTotalPlannedFromTemplates
  } = useRecurringTemplates();

  const [copying, setCopying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeView, setActiveView] = useState('expenses'); // 'expenses' or 'templates'

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

  const handleGenerateFromTemplates = async () => {
    setGenerating(true);
    try {
      const count = await generateExpensesFromTemplates(
        selectedYear,
        selectedMonth,
        addExpense,
        currentMonthExpenses
      );

      if (count > 0) {
        onSuccess(`Generated ${count} expense${count > 1 ? 's' : ''} from templates`);
      } else {
        onSuccess('All template expenses already exist for this month');
      }
    } catch (err) {
      console.error('Error generating expenses:', err);
      onError('Failed to generate expenses from templates');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleToggleTemplate = async (template) => {
    try {
      await toggleTemplateActive(template.id, !template.isActive);
      onSuccess(`Template ${template.isActive ? 'disabled' : 'enabled'}`);
    } catch (err) {
      onError('Failed to toggle template');
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const activeTemplates = templates.filter(t => t.isActive);
  const totalFromTemplates = getTotalPlannedFromTemplates();

  const prevMonthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('en-US', {
    month: 'long'
  });

  return (
    <div className="recurring-section">
      {/* Header with tabs */}
      <div className="recurring-header-card">
        <div className="recurring-header-content">
          <h2>Recurring Expenses</h2>
          <p className="recurring-subtitle">{monthName}</p>
        </div>

        <div className="recurring-tabs">
          <button
            className={`tab-btn ${activeView === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveView('expenses')}
          >
            This Month
          </button>
          <button
            className={`tab-btn ${activeView === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveView('templates')}
          >
            Templates ({templates.length})
          </button>
        </div>
      </div>

      {/* Action buttons based on view */}
      {activeView === 'expenses' ? (
        <div className="recurring-actions">
          {activeTemplates.length > 0 && (
            <button
              className="btn-primary"
              onClick={handleGenerateFromTemplates}
              disabled={generating}
            >
              {generating ? 'Generating...' : `⚡ Generate from Templates (${activeTemplates.length})`}
            </button>
          )}
          {prevRecurring.length > 0 && (
            <button
              className="btn-secondary"
              onClick={handleCopyRecurring}
              disabled={copying}
            >
              {copying ? 'Copying...' : `📋 Copy from ${prevMonthName}`}
            </button>
          )}
        </div>
      ) : (
        <div className="recurring-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setEditingTemplate(null);
              setShowTemplateModal(true);
            }}
          >
            ➕ Add Template
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {activeView === 'expenses' ? (
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
      ) : (
        <div className="recurring-stats">
          <div className="recurring-stat">
            <span className="stat-value">{templates.length}</span>
            <span className="stat-label">Total Templates</span>
          </div>
          <div className="recurring-stat">
            <span className="stat-value">{activeTemplates.length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="recurring-stat">
            <span className="stat-value">${totalFromTemplates.toLocaleString()}</span>
            <span className="stat-label">Monthly Total</span>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'expenses' ? (
        <>
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
                                {expense.dueDay && (
                                  <span className="due-badge">
                                    Due: {expense.dueDay}th
                                  </span>
                                )}
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
                {activeTemplates.length > 0
                  ? `Generate ${activeTemplates.length} expense${activeTemplates.length > 1 ? 's' : ''} from your templates`
                  : prevRecurring.length > 0
                    ? `Copy ${prevRecurring.length} recurring expense${prevRecurring.length > 1 ? 's' : ''} from ${prevMonthName}`
                    : 'Create templates or mark expenses as recurring to see them here'
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
        </>
      ) : (
        <>
          {/* Templates List */}
          {templatesLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading templates...</p>
            </div>
          ) : templates.length > 0 ? (
            <div className="templates-list">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-item ${!template.isActive ? 'inactive' : ''}`}
                >
                  <div className="template-main">
                    <div className="template-info">
                      <span className="template-name">{template.name}</span>
                      <div className="template-meta">
                        <span className="template-category">{template.category}</span>
                        <span className="template-member">
                          {getMemberName(template.paidBy)}
                        </span>
                        <span className="template-due">
                          Due: {template.dueDay || 1}th
                        </span>
                      </div>
                    </div>
                    <div className="template-amount">
                      ${(template.plannedAmount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="template-actions">
                    <button
                      className={`btn-toggle ${template.isActive ? 'active' : ''}`}
                      onClick={() => handleToggleTemplate(template)}
                      title={template.isActive ? 'Disable template' : 'Enable template'}
                    >
                      {template.isActive ? '✓' : '○'}
                    </button>
                    <button
                      className="btn-action"
                      onClick={() => handleEditTemplate(template)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-recurring">
              <span className="empty-icon">📝</span>
              <p className="empty-title">No templates yet</p>
              <p className="empty-hint">
                Create templates for your recurring expenses like rent, subscriptions, and utilities
              </p>
            </div>
          )}
        </>
      )}

      {/* Template Modal */}
      <RecurringTemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSuccess={onSuccess}
        onError={onError}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};

export default RecurringSection;
