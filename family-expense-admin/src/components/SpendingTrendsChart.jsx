import React, { useMemo, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import ChartDrillDown from './ChartDrillDown';
import { SkeletonChart } from './SkeletonLoader';
import { getThemeColors, hexToRgba } from '../utils/themeColors';
import './SpendingTrendsChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SpendingTrendsChart = ({ selectedYear, selectedMonth, loading = false }) => {
  const { getMonthlyTotal, getMonthlyPlanned, getExpensesByMonth } = useExpenses();
  const [drillDown, setDrillDown] = useState({ isOpen: false, month: null, year: null, expenses: [] });

  const monthsData = useMemo(() => {
    const months = [];
    const labels = [];
    const plannedData = [];
    const paidData = [];

    // Get last 6 months including current
    for (let i = 5; i >= 0; i--) {
      let month = selectedMonth - i;
      let year = selectedYear;

      // Handle year boundary
      while (month < 1) {
        month += 12;
        year -= 1;
      }

      months.push({ year, month });

      // Format label for mobile (short) and desktop (long)
      const date = new Date(year, month - 1);
      const shortLabel = date.toLocaleDateString('en-US', { month: 'short' });
      const longLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      labels.push(window.innerWidth < 640 ? shortLabel : longLabel);

      plannedData.push(getMonthlyPlanned(year, month));
      paidData.push(getMonthlyTotal(year, month));
    }

    return { months, labels, plannedData, paidData };
  }, [getMonthlyTotal, getMonthlyPlanned, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    const { labels, plannedData, paidData } = monthsData;
    const hasData = plannedData.some(v => v > 0) || paidData.some(v => v > 0);

    if (!hasData) {
      return null;
    }

    // Get theme colors dynamically
    const colors = getThemeColors();

    return {
      labels,
      datasets: [
        {
          label: 'Planned',
          data: plannedData,
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: window.innerWidth < 640 ? 4 : 5,
          pointHoverRadius: window.innerWidth < 640 ? 6 : 8,
          pointBackgroundColor: colors.primary,
          pointBorderColor: colors.bgPrimary,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
        },
        {
          label: 'Paid',
          data: paidData,
          borderColor: colors.success,
          backgroundColor: colors.successLight,
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: window.innerWidth < 640 ? 4 : 5,
          pointHoverRadius: window.innerWidth < 640 ? 6 : 8,
          pointBackgroundColor: colors.success,
          pointBorderColor: colors.bgPrimary,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
        }
      ]
    };
  }, [monthsData]);

  const handleChartClick = useCallback((event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const monthInfo = monthsData.months[index];
      const expenses = getExpensesByMonth(monthInfo.year, monthInfo.month);

      const date = new Date(monthInfo.year, monthInfo.month - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      setDrillDown({
        isOpen: true,
        month: monthInfo.month,
        year: monthInfo.year,
        monthName,
        expenses
      });
    }
  }, [monthsData, getExpensesByMonth]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: window.innerWidth < 640 ? 'bottom' : 'top',
        labels: {
          padding: window.innerWidth < 640 ? 10 : 15,
          font: {
            size: window.innerWidth < 640 ? 11 : 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: window.innerWidth < 640 ? 8 : 10,
          boxHeight: window.innerWidth < 640 ? 8 : 10,
        }
      },
      title: {
        display: true,
        text: 'Spending Trends (Last 6 Months - Click to drill down)',
        font: {
          size: window.innerWidth < 640 ? 14 : 16,
          weight: 'bold'
        },
        padding: {
          top: window.innerWidth < 640 ? 5 : 10,
          bottom: window.innerWidth < 640 ? 10 : 20
        }
      },
      tooltip: {
        backgroundColor: hexToRgba(getThemeColors().textPrimary, 0.9),
        padding: window.innerWidth < 640 ? 10 : 14,
        titleFont: {
          size: window.innerWidth < 640 ? 12 : 14,
          weight: 'bold'
        },
        bodyFont: {
          size: window.innerWidth < 640 ? 11 : 13
        },
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toFixed(2)}`;
          },
          afterBody: function(tooltipItems) {
            if (tooltipItems.length === 2) {
              const planned = tooltipItems[0].parsed.y;
              const paid = tooltipItems[1].parsed.y;
              const diff = paid - planned;

              if (diff !== 0) {
                return [`\nVariance: ${diff > 0 ? '+' : ''}$${diff.toFixed(2)}`];
              }
            }
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 11
          },
          maxRotation: 0,
          minRotation: 0,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: getThemeColors().borderColor,
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : 11
          },
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    hover: {
      animationDuration: 400
    }
  }), [handleChartClick]);

  if (loading) {
    return <SkeletonChart height="320px" />;
  }

  if (!chartData) {
    return (
      <div className="chart-empty-state">
        <p className="chart-empty-icon">📈</p>
        <p className="chart-empty-text">No spending history</p>
        <p className="chart-empty-hint">Add expenses to see trends over time</p>
      </div>
    );
  }

  return (
    <>
      <div className="spending-trends-chart-container animate-fade-in-up hover-lift">
        <div className="spending-trends-chart">
          <Line data={chartData} options={options} />
        </div>
      </div>

      <ChartDrillDown
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown({ isOpen: false, month: null, year: null, expenses: [] })}
        title={`${drillDown.monthName} - All Expenses`}
        expenses={drillDown.expenses}
        type="month"
      />
    </>
  );
};

export default SpendingTrendsChart;
