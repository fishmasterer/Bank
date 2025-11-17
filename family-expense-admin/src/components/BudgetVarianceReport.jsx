import React, { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useBudget } from '../hooks/useBudget';
import { useCategoryBudget } from '../hooks/useCategoryBudget';
import './BudgetVarianceReport.css';

const BudgetVarianceReport = ({ isOpen, onClose, selectedYear, selectedMonth }) => {
  const { getCategoryBreakdown, getMonthlyTotal, getMonthlyPlanned } = useExpenses();
  const { budget, getBudgetStatus } = useBudget(selectedYear, selectedMonth);
  const { categoryBudgets, getCategoryBudgetStatus } = useCategoryBudget(selectedYear, selectedMonth);

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const totalPaid = getMonthlyTotal(selectedYear, selectedMonth);
  const totalPlanned = getMonthlyPlanned(selectedYear, selectedMonth);

  const budgetStatus = getBudgetStatus(totalPaid);

  const categoryVariances = useMemo(() => {
    const categories = Object.keys(breakdown);
    return categories.map(category => {
      const categoryData = breakdown[category];
      const budgetStatus = getCategoryBudgetStatus(category, categoryData.paid);
      const plannedVsActual = categoryData.paid - categoryData.planned;

      return {
        category,
        planned: categoryData.planned,
        paid: categoryData.paid,
        budget: budgetStatus.limit,
        budgetStatus: budgetStatus.status,
        variance: budgetStatus.limit ? (categoryData.paid - budgetStatus.limit) : null,
        plannedVariance: plannedVsActual,
        percentage: budgetStatus.percentage
      };
    }).sort((a, b) => {
      // Sort by status priority: exceeded > critical > warning > good > none
      const statusPriority = { exceeded: 0, critical: 1, warning: 2, good: 3, none: 4 };
      return statusPriority[a.budgetStatus] - statusPriority[b.budgetStatus];
    });
  }, [breakdown, getCategoryBudgetStatus]);

  const insights = useMemo(() => {
    const insights = [];

    // Overall budget insight
    if (budgetStatus.status === 'exceeded') {
      insights.push({
        type: 'danger',
        icon: '🚨',
        message: `You're over your monthly budget by $${(totalPaid - budgetStatus.limit).toFixed(2)}`
      });
    } else if (budgetStatus.status === 'critical') {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        message: `Only $${budgetStatus.remaining.toFixed(2)} left in your monthly budget`
      });
    } else if (budget && budget.monthlyLimit) {
      insights.push({
        type: 'success',
        icon: '✅',
        message: `Within budget - $${budgetStatus.remaining.toFixed(2)} remaining`
      });
    }

    // Category insights
    const exceededCategories = categoryVariances.filter(c => c.budgetStatus === 'exceeded');
    if (exceededCategories.length > 0) {
      insights.push({
        type: 'danger',
        icon: '📊',
        message: `${exceededCategories.length} ${exceededCategories.length === 1 ? 'category has' : 'categories have'} exceeded their budget`
      });
    }

    const warningCategories = categoryVariances.filter(c => c.budgetStatus === 'warning' || c.budgetStatus === 'critical');
    if (warningCategories.length > 0) {
      insights.push({
        type: 'warning',
        icon: '⚡',
        message: `${warningCategories.length} ${warningCategories.length === 1 ? 'category is' : 'categories are'} approaching their budget limit`
      });
    }

    // Planned vs actual insight
    const plannedDiff = totalPaid - totalPlanned;
    if (Math.abs(plannedDiff) > totalPlanned * 0.1) {
      insights.push({
        type: plannedDiff > 0 ? 'warning' : 'info',
        icon: plannedDiff > 0 ? '📈' : '📉',
        message: `You've spent $${Math.abs(plannedDiff).toFixed(2)} ${plannedDiff > 0 ? 'more' : 'less'} than planned (${Math.abs((plannedDiff / totalPlanned) * 100).toFixed(0)}%)`
      });
    }

    return insights;
  }, [budgetStatus, budget, categoryVariances, totalPaid, totalPlanned]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'exceeded': return '🔴';
      case 'critical': return '🟠';
      case 'warning': return '🟡';
      case 'good': return '🟢';
      default: return '⚪';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="variance-report-overlay" onClick={handleBackdropClick}>
      <div className="variance-report-modal">
        <div className="variance-report-header">
          <div>
            <h2 className="variance-report-title">📊 Budget Variance Report</h2>
            <p className="variance-report-subtitle">{monthName}</p>
          </div>
          <button
            className="variance-report-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="variance-report-content">
          {/* Overall Summary */}
          <div className="variance-section">
            <h3 className="section-title">📈 Overall Summary</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Total Planned</div>
                <div className="summary-value">{formatCurrency(totalPlanned)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Total Paid</div>
                <div className="summary-value">{formatCurrency(totalPaid)}</div>
              </div>
              {budget && budget.monthlyLimit && (
                <div className="summary-card">
                  <div className="summary-label">Budget Limit</div>
                  <div className="summary-value">{formatCurrency(budget.monthlyLimit)}</div>
                </div>
              )}
              <div className="summary-card">
                <div className="summary-label">Variance</div>
                <div className={`summary-value ${totalPaid - totalPlanned > 0 ? 'negative' : 'positive'}`}>
                  {totalPaid - totalPlanned >= 0 ? '+' : ''}{formatCurrency(totalPaid - totalPlanned)}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="variance-section">
              <h3 className="section-title">💡 Key Insights</h3>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className={`insight-card insight-${insight.type}`}>
                    <span className="insight-icon">{insight.icon}</span>
                    <span className="insight-message">{insight.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="variance-section">
            <h3 className="section-title">📦 Category Breakdown</h3>
            <div className="category-variance-list">
              {categoryVariances.length === 0 ? (
                <div className="empty-state">
                  <p>No categories to display</p>
                </div>
              ) : (
                categoryVariances.map(cat => (
                  <div key={cat.category} className={`category-variance-item status-${cat.budgetStatus}`}>
                    <div className="category-variance-header">
                      <div className="category-name-section">
                        <span className="status-icon">{getStatusIcon(cat.budgetStatus)}</span>
                        <span className="category-name">{cat.category}</span>
                      </div>
                      <div className="category-amounts">
                        <span className="amount-paid">{formatCurrency(cat.paid)}</span>
                        {cat.budget && (
                          <span className="amount-budget">/ {formatCurrency(cat.budget)}</span>
                        )}
                      </div>
                    </div>

                    <div className="category-variance-details">
                      <div className="detail-row">
                        <span className="detail-label">Planned:</span>
                        <span className="detail-value">{formatCurrency(cat.planned)}</span>
                      </div>
                      {cat.plannedVariance !== 0 && (
                        <div className="detail-row">
                          <span className="detail-label">vs Planned:</span>
                          <span className={`detail-value ${cat.plannedVariance > 0 ? 'over' : 'under'}`}>
                            {cat.plannedVariance > 0 ? '+' : ''}{formatCurrency(cat.plannedVariance)}
                          </span>
                        </div>
                      )}
                      {cat.budget && (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">vs Budget:</span>
                            <span className={`detail-value ${cat.variance > 0 ? 'over' : 'under'}`}>
                              {cat.variance > 0 ? '+' : ''}{formatCurrency(cat.variance)}
                            </span>
                          </div>
                          <div className="budget-progress">
                            <div className="progress-bar-small">
                              <div
                                className={`progress-fill-small status-${cat.budgetStatus}`}
                                style={{ width: `${cat.percentage}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">{cat.percentage.toFixed(0)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="variance-report-footer">
          <button className="btn-close-report" onClick={onClose}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetVarianceReport;
