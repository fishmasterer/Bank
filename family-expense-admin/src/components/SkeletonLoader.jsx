import React from 'react';
import './SkeletonLoader.css';

// Generic skeleton line
export const SkeletonLine = ({ width = '100%', height = '1rem', marginBottom = '0.5rem' }) => (
  <div
    className="skeleton-line"
    style={{ width, height, marginBottom }}
  ></div>
);

// Skeleton for chart
export const SkeletonChart = ({ height = '300px' }) => (
  <div className="skeleton-chart-container">
    <div className="skeleton-chart" style={{ height }}>
      <div className="skeleton-chart-bars">
        {[60, 80, 45, 90, 70, 55].map((height, i) => (
          <div key={i} className="skeleton-chart-bar">
            <div
              className="skeleton-chart-bar-fill"
              style={{ height: `${height}%` }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton for summary card
export const SkeletonSummaryCard = () => (
  <div className="skeleton-summary-card">
    <SkeletonLine width="60%" height="1.5rem" marginBottom="1rem" />
    <div className="skeleton-amounts">
      <div className="skeleton-amount-item">
        <SkeletonLine width="80px" height="0.875rem" marginBottom="0.5rem" />
        <SkeletonLine width="100px" height="1.25rem" />
      </div>
      <div className="skeleton-amount-item">
        <SkeletonLine width="80px" height="0.875rem" marginBottom="0.5rem" />
        <SkeletonLine width="100px" height="1.25rem" />
      </div>
      <div className="skeleton-amount-item">
        <SkeletonLine width="80px" height="0.875rem" marginBottom="0.5rem" />
        <SkeletonLine width="100px" height="1.25rem" />
      </div>
    </div>
  </div>
);

// Skeleton for expense item in detailed view
export const SkeletonExpenseItem = () => (
  <div className="skeleton-expense-item">
    <div className="skeleton-expense-main">
      <SkeletonLine width="150px" height="1.125rem" marginBottom="0.25rem" />
      <SkeletonLine width="100px" height="0.875rem" />
    </div>
    <div className="skeleton-expense-amounts">
      <SkeletonLine width="80px" height="1rem" marginBottom="0.25rem" />
      <SkeletonLine width="80px" height="1rem" />
    </div>
  </div>
);

// Skeleton for category section
export const SkeletonCategorySection = () => (
  <div className="skeleton-category-section">
    <div className="skeleton-category-header">
      <SkeletonLine width="120px" height="1.25rem" marginBottom="0.5rem" />
      <SkeletonLine width="100px" height="1rem" />
    </div>
    <div className="skeleton-expense-list">
      <SkeletonExpenseItem />
      <SkeletonExpenseItem />
      <SkeletonExpenseItem />
    </div>
  </div>
);

// Skeleton for detailed view (multiple categories)
export const SkeletonDetailedView = () => (
  <div className="skeleton-detailed-view">
    <SkeletonCategorySection />
    <SkeletonCategorySection />
    <SkeletonCategorySection />
  </div>
);

// Skeleton for member card
export const SkeletonMemberCard = () => (
  <div className="skeleton-member-card">
    <SkeletonLine width="100px" height="1.25rem" marginBottom="1rem" />
    <div className="skeleton-amounts">
      <div className="skeleton-amount-item">
        <SkeletonLine width="70px" height="0.875rem" marginBottom="0.5rem" />
        <SkeletonLine width="90px" height="1.125rem" />
      </div>
      <div className="skeleton-amount-item">
        <SkeletonLine width="70px" height="0.875rem" marginBottom="0.5rem" />
        <SkeletonLine width="90px" height="1.125rem" />
      </div>
    </div>
  </div>
);

// Full skeleton for summary view
export const SkeletonSummaryView = () => (
  <div className="skeleton-summary-view">
    {/* Budget skeleton */}
    <div className="skeleton-budget">
      <SkeletonLine width="200px" height="1.125rem" marginBottom="0.75rem" />
      <SkeletonLine width="100%" height="8px" />
    </div>

    {/* Charts */}
    <SkeletonChart height="350px" />
    <SkeletonChart height="320px" />
    <SkeletonChart height="350px" />

    {/* Total card */}
    <SkeletonSummaryCard />

    {/* Member cards */}
    <div className="skeleton-members-grid">
      <SkeletonMemberCard />
      <SkeletonMemberCard />
      <SkeletonMemberCard />
    </div>
  </div>
);

// Skeleton for Analytics Dashboard
export const SkeletonAnalyticsDashboard = () => (
  <div className="skeleton-analytics-dashboard">
    {/* Header */}
    <div className="skeleton-analytics-header">
      <SkeletonLine width="250px" height="2rem" marginBottom="0.5rem" />
      <SkeletonLine width="150px" height="1rem" />
    </div>

    {/* Metric Cards */}
    <div className="skeleton-metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-metric-card">
          <SkeletonLine width="100px" height="0.875rem" marginBottom="0.5rem" />
          <SkeletonLine width="120px" height="1.5rem" marginBottom="0.5rem" />
          <SkeletonLine width="140px" height="0.75rem" />
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="skeleton-charts-grid">
      <div className="skeleton-chart-large">
        <SkeletonChart height="220px" />
      </div>
      <div className="skeleton-chart-small">
        <SkeletonLine width="150px" height="1rem" marginBottom="1rem" />
        <SkeletonLine width="100%" height="140px" />
      </div>
    </div>

    {/* Widgets */}
    <div className="skeleton-widgets-grid">
      <div className="skeleton-widget">
        <SkeletonLine width="200px" height="1rem" marginBottom="1rem" />
        <SkeletonLine width="100%" height="120px" />
      </div>
      <div className="skeleton-widget">
        <SkeletonLine width="150px" height="1rem" marginBottom="1rem" />
        <SkeletonLine width="100%" height="120px" />
      </div>
    </div>
  </div>
);

export default SkeletonLine;
