import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import './ChartDrillDown.css';

const ChartDrillDown = ({ isOpen, onClose, title, expenses, type = 'category' }) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    const totalPlanned = expenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
    const totalPaid = expenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
    const variance = totalPaid - totalPlanned;
    const variancePercent = totalPlanned > 0 ? ((variance / totalPlanned) * 100) : 0;
    const count = expenses.length;
    const avgPlanned = totalPlanned / count;
    const avgPaid = totalPaid / count;

    return {
      totalPlanned,
      totalPaid,
      variance,
      variancePercent,
      count,
      avgPlanned,
      avgPaid
    };
  }, [expenses]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'over-budget';
    if (variance < 0) return 'under-budget';
    return 'on-budget';
  };

  return createPortal(
    <div className="chart-drilldown-overlay" onClick={handleBackdropClick}>
      <div className="chart-drilldown-modal">
        <div className="chart-drilldown-header">
          <div>
            <h2 className="chart-drilldown-title">{title}</h2>
            <p className="chart-drilldown-subtitle">
              {stats?.count} {stats?.count === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
          <button
            className="chart-drilldown-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {stats && (
          <div className="chart-drilldown-stats">
            <div className="stat-card">
              <div className="stat-label">Total Planned</div>
              <div className="stat-value planned">{formatCurrency(stats.totalPlanned)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Paid</div>
              <div className="stat-value paid">{formatCurrency(stats.totalPaid)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Variance</div>
              <div className={`stat-value ${getVarianceColor(stats.variance)}`}>
                {stats.variance >= 0 ? '+' : ''}{formatCurrency(stats.variance)}
                <span className="stat-percent">
                  ({stats.variancePercent >= 0 ? '+' : ''}{stats.variancePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Per Expense</div>
              <div className="stat-value">{formatCurrency(stats.avgPaid)}</div>
            </div>
          </div>
        )}

        <div className="chart-drilldown-content">
          <div className="expense-list">
            {expenses && expenses.length > 0 ? (
              expenses.map((expense, index) => {
                const variance = (expense.paidAmount || 0) - (expense.plannedAmount || 0);
                const isPaid = expense.paidAmount > 0;

                return (
                  <div key={expense.id || index} className="expense-item">
                    <div className="expense-main">
                      <div className="expense-name-section">
                        <span className="expense-name">{expense.name}</span>
                        {expense.isRecurring && (
                          <span className="expense-badge recurring">🔄 Recurring</span>
                        )}
                        {!isPaid && (
                          <span className="expense-badge unpaid">Unpaid</span>
                        )}
                      </div>
                      <div className="expense-amounts">
                        <div className="amount-row">
                          <span className="amount-label">Planned:</span>
                          <span className="amount-value planned">
                            {formatCurrency(expense.plannedAmount || 0)}
                          </span>
                        </div>
                        <div className="amount-row">
                          <span className="amount-label">Paid:</span>
                          <span className="amount-value paid">
                            {formatCurrency(expense.paidAmount || 0)}
                          </span>
                        </div>
                        {variance !== 0 && (
                          <div className="amount-row">
                            <span className="amount-label">Variance:</span>
                            <span className={`amount-value ${getVarianceColor(variance)}`}>
                              {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {expense.notes && (
                      <div className="expense-notes">
                        <span className="notes-icon">📝</span>
                        <span className="notes-text">{expense.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="expense-empty">
                <p>No expenses found</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-drilldown-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChartDrillDown;
