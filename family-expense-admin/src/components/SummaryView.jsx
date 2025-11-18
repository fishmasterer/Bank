import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useBudget } from '../hooks/useBudget';
import CategoryPieChart from './CategoryPieChart';
import CategoryBarChart from './CategoryBarChart';
import SpendingTrendsChart from './SpendingTrendsChart';
import MemberSpendingChart from './MemberSpendingChart';
import { SkeletonSummaryView } from './SkeletonLoader';
import './SummaryView.css';

const SummaryView = ({ selectedYear, selectedMonth }) => {
  const { familyMembers, getMonthlyTotal, getMonthlyPlanned, loading } = useExpenses();
  const { budget, getBudgetStatus } = useBudget(selectedYear, selectedMonth);

  // Show skeleton while loading
  if (loading) {
    return <SkeletonSummaryView />;
  }

  const totalPlanned = getMonthlyPlanned(selectedYear, selectedMonth);
  const totalPaid = getMonthlyTotal(selectedYear, selectedMonth);

  const budgetStatus = getBudgetStatus(totalPaid);

  return (
    <div className="summary-view">
      {budget && budget.monthlyLimit && (
        <div className={`budget-warning budget-${budgetStatus.status} animate-fade-in-up`}>
          <div className="budget-header">
            <div className="budget-info">
              <span className="budget-label">Monthly Budget</span>
              <span className="budget-amount">
                ${totalPaid.toFixed(2)} / ${budgetStatus.limit.toFixed(2)}
              </span>
            </div>
            <div className="budget-percentage">
              {budgetStatus.percentage.toFixed(0)}%
            </div>
          </div>
          <div className="budget-bar">
            <div
              className="budget-bar-fill"
              style={{ width: `${budgetStatus.percentage}%` }}
            ></div>
          </div>
          {budgetStatus.status !== 'good' && (
            <div className="budget-message">
              {budgetStatus.status === 'exceeded' && (
                <span>⚠️ Budget exceeded by ${(totalPaid - budgetStatus.limit).toFixed(2)}</span>
              )}
              {budgetStatus.status === 'critical' && (
                <span>⚠️ Approaching budget limit - ${budgetStatus.remaining.toFixed(2)} remaining</span>
              )}
              {budgetStatus.status === 'warning' && (
                <span>⚡ 80% of budget used - ${budgetStatus.remaining.toFixed(2)} remaining</span>
              )}
            </div>
          )}
        </div>
      )}

      <CategoryPieChart
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <CategoryBarChart
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <SpendingTrendsChart
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <MemberSpendingChart
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

      <div className="summary-card total-card animate-fade-in-up hover-lift">
        <h2>Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
        <div className="amount-row">
          <div className="amount-item">
            <span className="label">Planned:</span>
            <span className="amount planned">${totalPlanned.toFixed(2)}</span>
          </div>
          <div className="amount-item">
            <span className="label">Paid:</span>
            <span className="amount paid">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="amount-item">
            <span className="label">Difference:</span>
            <span className={`amount ${totalPaid - totalPlanned > 0 ? 'over' : 'under'}`}>
              ${Math.abs(totalPaid - totalPlanned).toFixed(2)}
              {totalPaid > totalPlanned ? ' over' : totalPaid < totalPlanned ? ' under' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="members-grid stagger-fast">
        {familyMembers.map((member, index) => {
          const planned = getMonthlyPlanned(selectedYear, selectedMonth, member.id);
          const paid = getMonthlyTotal(selectedYear, selectedMonth, member.id);
          // Default colors for members without assigned color
          const defaultColors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
          const memberColor = member.color || defaultColors[(member.id - 1) % defaultColors.length];

          return (
            <div
              key={member.id}
              className="summary-card member-card stagger-item hover-lift"
              style={{
                '--member-index': index,
                '--member-color': memberColor,
                borderTopColor: memberColor
              }}
            >
              <div className="member-header">
                <span className="member-color-dot" style={{ backgroundColor: memberColor }} />
                <h3>{member.name}</h3>
              </div>
              <div className="amount-column">
                <div className="amount-item">
                  <span className="label">Planned:</span>
                  <span className="amount planned">${planned.toFixed(2)}</span>
                </div>
                <div className="amount-item">
                  <span className="label">Paid:</span>
                  <span className="amount paid">${paid.toFixed(2)}</span>
                </div>
                {(planned !== paid) && (
                  <div className="amount-item">
                    <span className="label">Difference:</span>
                    <span className={`amount ${paid - planned > 0 ? 'over' : 'under'}`}>
                      ${Math.abs(paid - planned).toFixed(2)}
                      {paid > planned ? ' over' : ' under'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryView;
