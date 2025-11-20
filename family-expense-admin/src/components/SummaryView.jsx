import React, { lazy, Suspense, memo, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { useBudget } from '../hooks/useBudget';
import { useToast } from '../hooks/useToast';
import { useCurrency } from '../contexts/CurrencyContext';
import { SkeletonSummaryView, SkeletonChart } from './SkeletonLoader';
import { COLOR_PALETTE } from '../utils/themeColors';
import QuickAddWidget from './QuickAddWidget';
import './SummaryView.css';

// Lazy load heavy chart components for better initial load performance
const CategoryPieChart = lazy(() => import('./CategoryPieChart'));
const CategoryBarChart = lazy(() => import('./CategoryBarChart'));
const SpendingTrendsChart = lazy(() => import('./SpendingTrendsChart'));
const MemberSpendingChart = lazy(() => import('./MemberSpendingChart'));

// Chart wrapper with suspense fallback
const ChartSuspense = ({ children, height = '350px' }) => (
  <Suspense fallback={<SkeletonChart height={height} />}>
    {children}
  </Suspense>
);

const SummaryView = ({ selectedYear, selectedMonth }) => {
  const { familyMembers, getMonthlyTotal, getMonthlyPlanned, getExpensesByMonth, loading } = useExpenses();
  const { budget, getBudgetStatus } = useBudget(selectedYear, selectedMonth);
  const { success, error: showError } = useToast();
  const { currencies = {}, convertToSGD, formatAmount } = useCurrency() || {};

  // Calculate currency breakdown
  const currencyBreakdown = useMemo(() => {
    const monthExpenses = getExpensesByMonth ? getExpensesByMonth(selectedYear, selectedMonth) : [];

    const breakdown = {
      SGD: { paid: 0, planned: 0 },
      AUD: { paid: 0, planned: 0 }
    };

    monthExpenses.forEach(exp => {
      const currency = exp.currency || 'SGD';
      if (breakdown[currency]) {
        breakdown[currency].paid += exp.paidAmount || 0;
        breakdown[currency].planned += exp.plannedAmount || 0;
      } else {
        // Default to SGD for unknown currencies
        breakdown.SGD.paid += exp.paidAmount || 0;
        breakdown.SGD.planned += exp.plannedAmount || 0;
      }
    });

    // Calculate AUD in SGD equivalent (fallback rate: 1 AUD ≈ 1.12 SGD)
    const audInSgd = convertToSGD
      ? convertToSGD(breakdown.AUD.paid, 'AUD')
      : breakdown.AUD.paid * 1.12;
    const totalInSgd = breakdown.SGD.paid + audInSgd;

    return {
      ...breakdown,
      audInSgd,
      totalInSgd
    };
  }, [selectedYear, selectedMonth, getExpensesByMonth, convertToSGD]);

  // Show skeleton while loading
  if (loading) {
    return <SkeletonSummaryView />;
  }

  const totalPlanned = getMonthlyPlanned(selectedYear, selectedMonth);
  const totalPaid = getMonthlyTotal(selectedYear, selectedMonth);

  const budgetStatus = getBudgetStatus(totalPaid);

  // Check if we have multi-currency expenses
  const hasMultiCurrency = currencyBreakdown.AUD.paid > 0 || currencyBreakdown.SGD.paid > 0;

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

      <QuickAddWidget
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSuccess={success}
        onError={showError}
      />

      <ChartSuspense height="350px">
        <CategoryPieChart
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </ChartSuspense>

      <ChartSuspense height="320px">
        <CategoryBarChart
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </ChartSuspense>

      <ChartSuspense height="350px">
        <SpendingTrendsChart
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </ChartSuspense>

      <ChartSuspense height="380px">
        <MemberSpendingChart
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </ChartSuspense>

      <div className="summary-card total-card animate-fade-in-up hover-lift">
        <h2>Total for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>

        {/* Currency Breakdown */}
        {hasMultiCurrency && (currencyBreakdown.SGD.paid > 0 || currencyBreakdown.AUD.paid > 0) && (
          <div className="currency-breakdown">
            {currencyBreakdown.SGD.paid > 0 && (
              <div className="currency-item">
                <span className="currency-flag">{currencies.SGD?.flag || '🇸🇬'}</span>
                <span className="currency-label">SGD</span>
                <span className="currency-amount">S${currencyBreakdown.SGD.paid.toFixed(2)}</span>
              </div>
            )}
            {currencyBreakdown.AUD.paid > 0 && (
              <div className="currency-item">
                <span className="currency-flag">{currencies.AUD?.flag || '🇦🇺'}</span>
                <span className="currency-label">AUD</span>
                <span className="currency-amount">
                  A${currencyBreakdown.AUD.paid.toFixed(2)}
                  <span className="currency-equiv">≈ S${currencyBreakdown.audInSgd.toFixed(2)}</span>
                </span>
              </div>
            )}
            {currencyBreakdown.AUD.paid > 0 && currencyBreakdown.SGD.paid > 0 && (
              <div className="currency-total">
                <span className="currency-total-label">Combined Total</span>
                <span className="currency-total-amount">S${currencyBreakdown.totalInSgd.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

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
          const memberColor = member.color || COLOR_PALETTE[(member.id - 1) % COLOR_PALETTE.length];

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

// Memoize to prevent unnecessary re-renders when parent state changes
export default memo(SummaryView);
