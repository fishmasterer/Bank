import React, { useMemo, useState, useCallback } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useExpenses } from '../context/ExpenseContext';
import ChartDrillDown from './ChartDrillDown';
import './MemberSpendingChart.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const MemberSpendingChart = ({ selectedYear, selectedMonth }) => {
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

    // Rich color palette for members
    const colors = [
      'rgba(194, 65, 12, 0.8)',   // Orange
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(251, 146, 60, 0.8)',   // Amber
      'rgba(6, 182, 212, 0.8)',    // Cyan
      'rgba(132, 204, 22, 0.8)',   // Lime
      'rgba(139, 92, 246, 0.8)',   // Violet
    ];

    const borderColors = colors.map(c => c.replace('0.8', '1'));

    return {
      labels: memberSpendingData.map(m => m.name),
      datasets: [{
        label: 'Amount Paid',
        data: memberSpendingData.map(m => m.amount),
        backgroundColor: colors.slice(0, memberSpendingData.length),
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
      <div className="member-spending-chart-container">
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
