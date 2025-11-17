import React from 'react';
import './AnalyticsSpendingChart.css';

const AnalyticsSpendingChart = ({ monthlyTotals }) => {
  if (!monthlyTotals || monthlyTotals.length === 0) {
    return (
      <div className="analytics-spending-chart">
        <h3>Spending Trends</h3>
        <div className="chart-empty">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...monthlyTotals.map(m => m.total), 1);

  return (
    <div className="analytics-spending-chart">
      <h3>Spending Trends</h3>

      <div className="bars-chart">
        {monthlyTotals.map((month, index) => {
          const height = (month.total / maxValue) * 100;
          const isLast = index === monthlyTotals.length - 1;

          return (
            <div key={index} className="bar-container">
              <div className="bar-wrapper">
                <div
                  className={`bar ${isLast ? 'current' : ''}`}
                  style={{ height: `${height}%` }}
                >
                  <span className="bar-value">${month.total.toFixed(0)}</span>
                </div>
              </div>
              <div className="bar-label">
                <span className="bar-month">{month.label.split(' ')[0]}</span>
                <span className="bar-year">{month.label.split(' ')[1]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-legend">
        <span>Monthly spending over selected time range</span>
      </div>
    </div>
  );
};

export default AnalyticsSpendingChart;
