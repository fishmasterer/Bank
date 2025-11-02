import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import './CategoryPieChart.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryPieChart = ({ selectedYear, selectedMonth }) => {
  const { getCategoryBreakdown } = useExpenses();

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const categories = Object.keys(breakdown);

  if (categories.length === 0) {
    return (
      <div className="chart-empty">
        <p>No expenses to display</p>
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = {
    labels: categories,
    datasets: [
      {
        label: 'Amount Paid',
        data: categories.map(cat => breakdown[cat].paid),
        backgroundColor: [
          'rgba(194, 65, 12, 0.8)',   // Primary orange
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',   // Amber
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(139, 92, 246, 0.8)',   // Purple
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(20, 184, 166, 0.8)',   // Teal
          'rgba(251, 146, 60, 0.8)',   // Orange
          'rgba(14, 165, 233, 0.8)',   // Sky
          'rgba(168, 85, 247, 0.8)',   // Violet
        ],
        borderColor: [
          'rgba(194, 65, 12, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    <div className="pie-chart-container">
      <h3 className="chart-title">Spending by Category</h3>
      <div className="chart-wrapper">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CategoryPieChart;
