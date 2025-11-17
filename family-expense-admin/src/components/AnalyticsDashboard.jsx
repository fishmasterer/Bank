import React, { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import AnalyticsSpendingChart from './AnalyticsSpendingChart';
import CategoryDistributionWidget from './CategoryDistributionWidget';
import MonthComparisonWidget from './MonthComparisonWidget';
import InsightsWidget from './InsightsWidget';
import { SkeletonAnalyticsDashboard } from './SkeletonLoader';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ selectedYear, selectedMonth }) => {
  const { expenses, loading } = useExpenses();
  const [timeRange, setTimeRange] = useState('3'); // 3, 6, or 12 months

  // Calculate date ranges
  const getMonthsData = useMemo(() => {
    const months = [];
    const rangeMonths = parseInt(timeRange);

    for (let i = rangeMonths - 1; i >= 0; i--) {
      let year = selectedYear;
      let month = selectedMonth - i;

      while (month <= 0) {
        month += 12;
        year -= 1;
      }

      months.push({ year, month });
    }

    return months;
  }, [selectedYear, selectedMonth, timeRange]);

  // Get expenses for a specific month
  const getMonthExpenses = (year, month) => {
    return expenses.filter(exp => exp.year === year && exp.month === month);
  };

  // Calculate total spending for each month
  const monthlyTotals = useMemo(() => {
    return getMonthsData.map(({ year, month }) => {
      const monthExpenses = getMonthExpenses(year, month);
      const total = monthExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
      return {
        year,
        month,
        total,
        label: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    });
  }, [getMonthsData, expenses]);

  // Get current month expenses
  const currentMonthExpenses = useMemo(() => {
    return getMonthExpenses(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, expenses]);

  // Calculate category breakdown for current month
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    currentMonthExpenses.forEach(exp => {
      if (!breakdown[exp.category]) {
        breakdown[exp.category] = 0;
      }
      breakdown[exp.category] += exp.paidAmount || 0;
    });
    return breakdown;
  }, [currentMonthExpenses]);

  // Get previous month for comparison
  const previousMonth = useMemo(() => {
    let prevMonth = selectedMonth - 1;
    let prevYear = selectedYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return { year: prevYear, month: prevMonth };
  }, [selectedYear, selectedMonth]);

  const previousMonthExpenses = useMemo(() => {
    return getMonthExpenses(previousMonth.year, previousMonth.month);
  }, [previousMonth, expenses]);

  // Calculate totals
  const currentTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  }, [currentMonthExpenses]);

  const previousTotal = useMemo(() => {
    return previousMonthExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  }, [previousMonthExpenses]);

  const percentageChange = useMemo(() => {
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }, [currentTotal, previousTotal]);

  if (loading) {
    return <SkeletonAnalyticsDashboard />;
  }

  const currentMonthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div>
          <h2>Analytics Dashboard</h2>
          <p className="analytics-subtitle">Spending insights for {currentMonthName}</p>
        </div>
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === '3' ? 'active' : ''}`}
            onClick={() => setTimeRange('3')}
          >
            3M
          </button>
          <button
            className={`time-range-btn ${timeRange === '6' ? 'active' : ''}`}
            onClick={() => setTimeRange('6')}
          >
            6M
          </button>
          <button
            className={`time-range-btn ${timeRange === '12' ? 'active' : ''}`}
            onClick={() => setTimeRange('12')}
          >
            12M
          </button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="analytics-summary">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h4>Total Spending</h4>
            <p className="metric-value">${currentTotal.toFixed(2)}</p>
            <span className={`metric-change ${percentageChange >= 0 ? 'increase' : 'decrease'}`}>
              {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(1)}% from last month
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h4>Categories</h4>
            <p className="metric-value">{Object.keys(categoryBreakdown).length}</p>
            <span className="metric-label">Active categories this month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🧾</div>
          <div className="metric-content">
            <h4>Expenses</h4>
            <p className="metric-value">{currentMonthExpenses.length}</p>
            <span className="metric-label">Total expense entries</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h4>Average/Day</h4>
            <p className="metric-value">
              ${(currentTotal / new Date(selectedYear, selectedMonth, 0).getDate()).toFixed(2)}
            </p>
            <span className="metric-label">Daily spending rate</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="analytics-charts">
        <div className="chart-card large">
          <AnalyticsSpendingChart
            monthlyTotals={monthlyTotals}
          />
        </div>

        <div className="chart-card">
          <CategoryDistributionWidget
            categoryBreakdown={categoryBreakdown}
            currentTotal={currentTotal}
          />
        </div>
      </div>

      {/* Widgets Row */}
      <div className="analytics-widgets">
        <div className="widget-card">
          <MonthComparisonWidget
            currentMonth={selectedMonth}
            currentYear={selectedYear}
            currentMonthExpenses={currentMonthExpenses}
            previousMonthExpenses={previousMonthExpenses}
            currentTotal={currentTotal}
            previousTotal={previousTotal}
            percentageChange={percentageChange}
          />
        </div>

        <div className="widget-card">
          <InsightsWidget
            currentMonthExpenses={currentMonthExpenses}
            categoryBreakdown={categoryBreakdown}
            monthlyTotals={monthlyTotals}
            currentTotal={currentTotal}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
