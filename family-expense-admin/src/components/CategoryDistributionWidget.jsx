import React from 'react';
import './CategoryDistributionWidget.css';

const CategoryDistributionWidget = ({ categoryBreakdown, currentTotal }) => {
  if (!categoryBreakdown || Object.keys(categoryBreakdown).length === 0) {
    return (
      <div className="category-distribution-widget">
        <h3>Category Distribution</h3>
        <div className="widget-empty">
          <p>No expense data available</p>
        </div>
      </div>
    );
  }

  // Sort categories by amount (descending)
  const sortedCategories = Object.entries(categoryBreakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / currentTotal) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Top 5 categories

  // Generate colors for categories
  const colors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b'
  ];

  return (
    <div className="category-distribution-widget">
      <h3>Top Categories</h3>

      <div className="category-list">
        {sortedCategories.map((item, index) => (
          <div key={item.category} className="category-item">
            <div className="category-header">
              <div className="category-info">
                <span
                  className="category-color"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></span>
                <span className="category-name">{item.category}</span>
              </div>
              <span className="category-amount">${item.amount.toFixed(2)}</span>
            </div>
            <div className="category-bar-container">
              <div
                className="category-bar"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: colors[index % colors.length]
                }}
              ></div>
            </div>
            <span className="category-percentage">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {Object.keys(categoryBreakdown).length > 5 && (
        <div className="category-footer">
          <span>+{Object.keys(categoryBreakdown).length - 5} more categories</span>
        </div>
      )}
    </div>
  );
};

export default CategoryDistributionWidget;
