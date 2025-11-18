import React, { useMemo, useState, useCallback } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import ChartDrillDown from './ChartDrillDown';
import { SkeletonChart } from './SkeletonLoader';
import { getThemeColors, hexToRgba, getChartColorPalette } from '../utils/themeColors';
import './MemberSpendingChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const MemberSpendingChart = ({ selectedYear, selectedMonth, loading = false }) => {
  const { familyMembers, getMonthlyTotal, getExpensesByMonth } = useExpenses();
  const [drillDown, setDrillDown] = useState({ isOpen: false, member: null, expenses: [] });

  const memberSpendingData = useMemo(() => {
    const memberSpending = familyMembers.map(member => ({
      id: member.id,
      name: member.name,
      amount: getMonthlyTotal(selectedYear, selectedMonth, member.id)
    })).filter(m => m.amount > 0);

    return memberSpending;
  }, [familyMembers, getMonthlyTotal, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    if (memberSpendingData.length === 0) {
      return null;
    }

    const total = memberSpendingData.reduce((sum, m) => sum + m.amount, 0);

    // Use theme color palette
    const colorPalette = getChartColorPalette();
    const backgroundColors = colorPalette.map(color => hexToRgba(color, 0.8));
    const borderColors = colorPalette;

    return {
      labels: memberSpendingData.map(m => m.name),
      datasets: [{
        label: 'Amount Paid',
        data: memberSpendingData.map(m => m.amount),
        backgroundColor: backgroundColors.slice(0, memberSpendingData.length),
        borderColor: borderColors.slice(0, memberSpendingData.length),
        borderWidth: 3,
        hoverOffset: window.innerWidth < 640 ? 8 : 15,
        spacing: 2,
      }]
    };
  }, [memberSpendingData]);

  const handleChartClick = useCallback((event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const memberInfo = memberSpendingData[index];
      const allExpenses = getExpensesByMonth(selectedYear, selectedMonth);
      const memberExpenses = allExpenses.filter(exp => exp.paidBy === memberInfo.id);

      setDrillDown({
        isOpen: true,
        member: memberInfo.name,
        expenses: memberExpenses
      });
    }
  }, [memberSpendingData, getExpensesByMonth, selectedYear, selectedMonth]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    cutout: '60%',  // Makes it a donut instead of pie
    plugins: {
      legend: {
        position: window.innerWidth < 640 ? 'bottom' : 'right',
        labels: {
          padding: window.innerWidth < 640 ? 12 : 20,
          font: {
            size: window.innerWidth < 640 ? 11 : 12,
            weight: '500'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: window.innerWidth < 640 ? 10 : 12,
          boxHeight: window.innerWidth < 640 ? 10 : 12,
          generateLabels: (chart) => {
            const data = chart.data;
            if (!data.labels || data.labels.length === 0) return [];

            const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);

            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i];
              const percentage = ((value / total) * 100).toFixed(1);

              return {
                text: `${label}: $${value.toFixed(0)} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].borderColor[i],
                lineWidth: 2,
                hidden: false,
                index: i
              };
            });
          }
        }
      },
      title: {
        display: true,
        text: 'Member Spending Breakdown (Click to drill down)',
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
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);

            return [
              `${label}`,
              `Amount: $${value.toFixed(2)}`,
              `Share: ${percentage}%`
            ];
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
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
        <p className="chart-empty-icon">👥</p>
        <p className="chart-empty-text">No member spending data</p>
        <p className="chart-empty-hint">Members will appear here once they pay expenses</p>
      </div>
    );
  }

  return (
    <>
      <div className="member-spending-chart-container animate-fade-in-up hover-lift">
        <div className="member-spending-chart">
          <Doughnut data={chartData} options={options} />
        </div>
      </div>

      <ChartDrillDown
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown({ isOpen: false, member: null, expenses: [] })}
        title={`${drillDown.member}'s Expenses`}
        expenses={drillDown.expenses}
        type="member"
      />
    </>
  );
};

export default MemberSpendingChart;
