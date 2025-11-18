import React, { useMemo, useState, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import ChartDrillDown from './ChartDrillDown';
import { SkeletonChart } from './SkeletonLoader';
import { getThemeColors, hexToRgba } from '../utils/themeColors';
import './CategoryBarChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CategoryBarChart = ({ selectedYear, selectedMonth, loading = false }) => {
  const { getCategoryBreakdown } = useExpenses();
  const [drillDown, setDrillDown] = useState({ isOpen: false, category: null, expenses: [] });

  const breakdown = useMemo(() => {
    return getCategoryBreakdown(selectedYear, selectedMonth);
  }, [getCategoryBreakdown, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    const categories = Object.keys(breakdown);

    if (categories.length === 0) {
      return null;
    }

    // Get theme colors dynamically
    const colors = getThemeColors();

    return {
      labels: categories,
      datasets: [
        {
          label: 'Planned',
          data: categories.map(cat => breakdown[cat].planned),
          backgroundColor: colors.primaryMedium,
          borderColor: colors.primary,
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 'flex',
          maxBarThickness: 40,
        },
        {
          label: 'Paid',
          data: categories.map(cat => breakdown[cat].paid),
          backgroundColor: hexToRgba(colors.success, 0.7),
          borderColor: colors.success,
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 'flex',
          maxBarThickness: 40,
        }
      ]
    };
  }, [breakdown]);

  const handleChartClick = useCallback((event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = Object.keys(breakdown)[index];
      const categoryData = breakdown[category];

      setDrillDown({
        isOpen: true,
        category,
        expenses: categoryData.expenses || []
      });
    }
  }, [breakdown]);

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
          pointStyle: 'rect',
          boxWidth: window.innerWidth < 640 ? 12 : 15,
          boxHeight: window.innerWidth < 640 ? 12 : 15,
        }
      },
      title: {
        display: true,
        text: 'Planned vs Paid by Category (Click to drill down)',
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
        padding: window.innerWidth < 640 ? 8 : 12,
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
            const datasetIndex = context.datasetIndex;
            const categoryIndex = context.dataIndex;

            // Get the other value for comparison
            const datasets = context.chart.data.datasets;
            const otherValue = datasetIndex === 0
              ? datasets[1].data[categoryIndex]
              : datasets[0].data[categoryIndex];

            const diff = datasetIndex === 0
              ? otherValue - value  // paid - planned
              : value - otherValue; // paid - planned

            const diffLabel = datasetIndex === 1 && diff !== 0
              ? ` (${diff > 0 ? '+' : ''}$${diff.toFixed(0)})`
              : '';

            return `${label}: $${value.toFixed(2)}${diffLabel}`;
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
            size: window.innerWidth < 640 ? 9 : 11
          },
          maxRotation: window.innerWidth < 640 ? 45 : 0,
          minRotation: window.innerWidth < 640 ? 45 : 0,
          autoSkip: false,
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
    return <SkeletonChart height="350px" />;
  }

  if (!chartData) {
    return (
      <div className="chart-empty-state">
        <p className="chart-empty-icon">📊</p>
        <p className="chart-empty-text">No expenses to display</p>
        <p className="chart-empty-hint">Add some expenses to see the comparison</p>
      </div>
    );
  }

  return (
    <>
      <div className="category-bar-chart-container animate-fade-in-up hover-lift">
        <div className="category-bar-chart">
          <Bar data={chartData} options={options} />
        </div>
      </div>

      <ChartDrillDown
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown({ isOpen: false, category: null, expenses: [] })}
        title={`${drillDown.category} Expenses`}
        expenses={drillDown.expenses}
        type="category"
      />
    </>
  );
};

export default CategoryBarChart;
