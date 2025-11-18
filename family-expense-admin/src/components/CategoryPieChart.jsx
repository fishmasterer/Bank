import React, { memo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import { SkeletonChart } from './SkeletonLoader';
import { getThemeColors, hexToRgba, getChartColorPalette } from '../utils/themeColors';
import './CategoryPieChart.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryPieChart = ({ selectedYear, selectedMonth, loading = false }) => {
  const { getCategoryBreakdown } = useExpenses();

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const categories = Object.keys(breakdown);

  if (loading) {
    return (
      <div className="pie-chart-container">
        <h3 className="chart-title">Spending by Category</h3>
        <div className="chart-wrapper">
          <SkeletonChart height="300px" />
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="chart-empty">
        <p>No expenses to display</p>
      </div>
    );
  }

  // Prepare data for pie chart using theme colors
  const colorPalette = getChartColorPalette();
  const backgroundColors = colorPalette.map(color => hexToRgba(color, 0.8));
  const borderColors = colorPalette;

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Amount Paid',
        data: categories.map(cat => breakdown[cat].paid),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 800,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: getThemeColors().textPrimary,
          padding: 15,
          font: {
            size: 13,
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
          boxWidth: 15,
          boxHeight: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: $${value.toFixed(0)} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: hexToRgba(getThemeColors().textPrimary, 0.9),
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="pie-chart-container animate-fade-in-up hover-lift">
      <h3 className="chart-title">Spending by Category</h3>
      <div className="chart-wrapper">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(CategoryPieChart);
