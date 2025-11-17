import React, { useMemo } from 'react';
import './MonthComparisonWidget.css';

const MonthComparisonWidget = ({
  currentMonth,
  currentYear,
  currentMonthExpenses,
  previousMonthExpenses,
  currentTotal,
  previousTotal,
  percentageChange
}) => {
  const currentMonthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
    month: 'long'
  });

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const previousMonthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('en-US', {
    month: 'long'
  });

  // Calculate category changes
  const categoryComparison = useMemo(() => {
    const currentCategories = {};
    const previousCategories = {};

    currentMonthExpenses.forEach(exp => {
      currentCategories[exp.category] = (currentCategories[exp.category] || 0) + (exp.paidAmount || 0);
    });

    previousMonthExpenses.forEach(exp => {
      previousCategories[exp.category] = (previousCategories[exp.category] || 0) + (exp.paidAmount || 0);
    });

    const allCategories = new Set([
      ...Object.keys(currentCategories),
      ...Object.keys(previousCategories)
    ]);

    const comparisons = Array.from(allCategories).map(category => {
      const current = currentCategories[category] || 0;
      const previous = previousCategories[category] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

      return {
        category,
        current,
        previous,
        change,
        diff: current - previous
      };
    });

    // Sort by absolute change
    return comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5);
  }, [currentMonthExpenses, previousMonthExpenses]);

  return (
    <div className="month-comparison-widget">
      <h3>Month-over-Month Comparison</h3>

      <div className="comparison-summary">
        <div className="month-card current">
          <span className="month-label">{currentMonthName}</span>
          <span className="month-value">${currentTotal.toFixed(2)}</span>
          <span className="month-count">{currentMonthExpenses.length} expenses</span>
        </div>

        <div className="comparison-arrow">
          <span className={percentageChange >= 0 ? 'arrow-up' : 'arrow-down'}>
            {percentageChange >= 0 ? '↑' : '↓'}
          </span>
          <span className={`percentage ${percentageChange >= 0 ? 'increase' : 'decrease'}`}>
            {Math.abs(percentageChange).toFixed(1)}%
          </span>
        </div>

        <div className="month-card previous">
          <span className="month-label">{previousMonthName}</span>
          <span className="month-value">${previousTotal.toFixed(2)}</span>
          <span className="month-count">{previousMonthExpenses.length} expenses</span>
        </div>
      </div>

      <div className="category-changes">
        <h4>Category Changes</h4>
        {categoryComparison.length > 0 ? (
          <div className="changes-list">
            {categoryComparison.map(item => (
              <div key={item.category} className="change-item">
                <div className="change-header">
                  <span className="change-category">{item.category}</span>
                  <span className={`change-value ${item.diff >= 0 ? 'increase' : 'decrease'}`}>
                    {item.diff >= 0 ? '+' : ''}${item.diff.toFixed(2)}
                  </span>
                </div>
                <div className="change-details">
                  <span className="detail">${item.previous.toFixed(2)} → ${item.current.toFixed(2)}</span>
                  <span className={`change-percent ${item.change >= 0 ? 'increase' : 'decrease'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-changes">No category changes to display</p>
        )}
      </div>
    </div>
  );
};

export default MonthComparisonWidget;
