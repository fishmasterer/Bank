import React, { useMemo } from 'react';
import './InsightsWidget.css';

const InsightsWidget = ({
  currentMonthExpenses,
  categoryBreakdown,
  monthlyTotals,
  currentTotal
}) => {
  const insights = useMemo(() => {
    const insights = [];

    // Insight 1: Highest spending category
    if (Object.keys(categoryBreakdown).length > 0) {
      const sortedCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1]);

      const topCategory = sortedCategories[0];
      const percentage = (topCategory[1] / currentTotal) * 100;

      insights.push({
        icon: '🎯',
        type: 'info',
        title: 'Top Spending Category',
        message: `${topCategory[0]} accounts for ${percentage.toFixed(1)}% of spending ($${topCategory[1].toFixed(2)})`
      });
    }

    // Insight 2: Spending trend
    if (monthlyTotals.length >= 3) {
      const recent3 = monthlyTotals.slice(-3);
      const trend = recent3[2].total > recent3[1].total && recent3[1].total > recent3[0].total;
      const downtrend = recent3[2].total < recent3[1].total && recent3[1].total < recent3[0].total;

      if (trend) {
        insights.push({
          icon: '📈',
          type: 'warning',
          title: 'Increasing Trend',
          message: 'Spending has increased for 3 consecutive months'
        });
      } else if (downtrend) {
        insights.push({
          icon: '📉',
          type: 'success',
          title: 'Decreasing Trend',
          message: 'Great job! Spending has decreased for 3 months'
        });
      }
    }

    // Insight 3: Average expense amount
    if (currentMonthExpenses.length > 0) {
      const avgExpense = currentTotal / currentMonthExpenses.length;
      insights.push({
        icon: '💵',
        type: 'info',
        title: 'Average Expense',
        message: `Each expense averages $${avgExpense.toFixed(2)} this month`
      });
    }

    // Insight 4: Recurring vs One-time
    const recurringCount = currentMonthExpenses.filter(exp => exp.isRecurring).length;
    const recurringTotal = currentMonthExpenses
      .filter(exp => exp.isRecurring)
      .reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);

    if (recurringCount > 0) {
      const recurringPercentage = (recurringTotal / currentTotal) * 100;
      insights.push({
        icon: '🔄',
        type: 'info',
        title: 'Recurring Expenses',
        message: `${recurringCount} recurring expenses make up ${recurringPercentage.toFixed(1)}% of total spending`
      });
    }

    // Insight 5: Spending concentration
    if (Object.keys(categoryBreakdown).length >= 3) {
      const sortedCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1]);

      const top3Total = sortedCategories.slice(0, 3).reduce((sum, [_, amount]) => sum + amount, 0);
      const top3Percentage = (top3Total / currentTotal) * 100;

      if (top3Percentage > 70) {
        insights.push({
          icon: '⚠️',
          type: 'warning',
          title: 'Concentrated Spending',
          message: `${top3Percentage.toFixed(1)}% of spending is in just 3 categories`
        });
      }
    }

    // Insight 6: Monthly volatility
    if (monthlyTotals.length >= 3) {
      const amounts = monthlyTotals.map(m => m.total);
      const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avg) * 100;

      if (coefficientOfVariation > 30) {
        insights.push({
          icon: '📊',
          type: 'info',
          title: 'Variable Spending',
          message: 'Monthly spending varies significantly. Consider budgeting for consistency'
        });
      } else if (coefficientOfVariation < 15) {
        insights.push({
          icon: '✨',
          type: 'success',
          title: 'Consistent Spending',
          message: 'Your spending is very consistent month-to-month'
        });
      }
    }

    return insights;
  }, [currentMonthExpenses, categoryBreakdown, monthlyTotals, currentTotal]);

  return (
    <div className="insights-widget">
      <h3>Smart Insights</h3>

      {insights.length === 0 ? (
        <div className="no-insights">
          <p>Add more expenses to get personalized insights</p>
        </div>
      ) : (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-item ${insight.type}`}>
              <div className="insight-icon">{insight.icon}</div>
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsWidget;
