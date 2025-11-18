import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './StatsPanel.css';

export default function StatsPanel({ view, selectedYear, selectedMonth, onClose }) {
  const { familyMembers, getMonthlyTotal, getMonthlyPlanned } = useExpenses();

  // Get previous month
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const currentMonthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'short' });
  const prevMonthName = new Date(prevYear, prevMonth - 1).toLocaleDateString('en-US', { month: 'short' });

  // Calculate totals
  const currentTotal = familyMembers.reduce((sum, member) =>
    sum + getMonthlyTotal(selectedYear, selectedMonth, member.id), 0
  );
  const prevTotal = familyMembers.reduce((sum, member) =>
    sum + getMonthlyTotal(prevYear, prevMonth, member.id), 0
  );
  const plannedTotal = familyMembers.reduce((sum, member) =>
    sum + getMonthlyPlanned(selectedYear, selectedMonth, member.id), 0
  );

  const renderMemberExpenses = () => (
    <div className="stats-content">
      <h3 className="stats-subtitle">Expenses by Member</h3>
      <div className="member-expense-list">
        {familyMembers.map(member => {
          const spent = getMonthlyTotal(selectedYear, selectedMonth, member.id);
          return (
            <div key={member.id} className="member-expense-item">
              <div className="member-info">
                <span className="member-name">{member.name}</span>
                <span className="member-amount">${spent.toFixed(2)}</span>
              </div>
              <div className="expense-bar">
                <div
                  className="expense-bar-fill"
                  style={{
                    width: currentTotal > 0 ? `${(spent / currentTotal) * 100}%` : '0%'
                  }}
                />
              </div>
              <span className="expense-percent">
                {currentTotal > 0 ? `${((spent / currentTotal) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="stats-total">
        <span>Total</span>
        <span>${currentTotal.toFixed(2)}</span>
      </div>
    </div>
  );

  const renderMonthlyStats = () => {
    const difference = currentTotal - prevTotal;
    const percentChange = prevTotal > 0 ? ((difference / prevTotal) * 100) : 0;
    const isIncrease = difference > 0;

    return (
      <div className="stats-content">
        <h3 className="stats-subtitle">Monthly Comparison</h3>
        <div className="comparison-cards">
          <div className="comparison-card">
            <span className="comparison-label">{prevMonthName}</span>
            <span className="comparison-value">${prevTotal.toFixed(2)}</span>
          </div>
          <div className="comparison-arrow">
            {isIncrease ? '+' : '-'}
          </div>
          <div className="comparison-card current">
            <span className="comparison-label">{currentMonthName}</span>
            <span className="comparison-value">${currentTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className={`change-indicator ${isIncrease ? 'increase' : 'decrease'}`}>
          <span className="change-icon">{isIncrease ? '^' : 'v'}</span>
          <span className="change-amount">${Math.abs(difference).toFixed(2)}</span>
          <span className="change-percent">({Math.abs(percentChange).toFixed(1)}%)</span>
        </div>
        <div className="member-comparison">
          <h4>By Member</h4>
          {familyMembers.map(member => {
            const curr = getMonthlyTotal(selectedYear, selectedMonth, member.id);
            const prev = getMonthlyTotal(prevYear, prevMonth, member.id);
            const diff = curr - prev;
            return (
              <div key={member.id} className="member-comparison-item">
                <span className="member-name">{member.name}</span>
                <div className="member-comparison-values">
                  <span className="prev-value">${prev.toFixed(0)}</span>
                  <span className="arrow">-{'>'}</span>
                  <span className="curr-value">${curr.toFixed(0)}</span>
                  <span className={`diff-value ${diff >= 0 ? 'increase' : 'decrease'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBudgetTracker = () => {
    const used = currentTotal;
    const budget = plannedTotal > 0 ? plannedTotal : currentTotal * 1.2; // Default budget if not set
    const remaining = budget - used;
    const percentUsed = budget > 0 ? (used / budget) * 100 : 0;
    const isOverBudget = remaining < 0;

    return (
      <div className="stats-content">
        <h3 className="stats-subtitle">Budget vs Actual</h3>
        <div className="budget-overview">
          <div className="budget-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isOverBudget ? 'var(--danger-color)' : 'var(--color-primary-60)'}
                strokeWidth="8"
                strokeDasharray={`${Math.min(percentUsed, 100) * 2.83} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="budget-circle-text">
              <span className="budget-percent">{Math.min(percentUsed, 100).toFixed(0)}%</span>
              <span className="budget-label">used</span>
            </div>
          </div>
        </div>
        <div className="budget-details">
          <div className="budget-item">
            <span className="budget-item-label">Budget</span>
            <span className="budget-item-value">${budget.toFixed(2)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-item-label">Used</span>
            <span className="budget-item-value">${used.toFixed(2)}</span>
          </div>
          <div className={`budget-item ${isOverBudget ? 'over-budget' : 'under-budget'}`}>
            <span className="budget-item-label">{isOverBudget ? 'Over' : 'Remaining'}</span>
            <span className="budget-item-value">${Math.abs(remaining).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (view) {
      case 'memberExpenses':
        return 'Member Expenses';
      case 'monthlyStats':
        return 'Monthly Statistics';
      case 'budgetTracker':
        return 'Budget Tracker';
      default:
        return 'Statistics';
    }
  };

  return (
    <>
      <div className="stats-overlay" onClick={onClose} />
      <div className="stats-panel">
        <div className="stats-header">
          <h2>{getTitle()}</h2>
          <button
            onClick={onClose}
            className="stats-close-btn"
            aria-label="Close panel"
          >
            x
          </button>
        </div>
        {view === 'memberExpenses' && renderMemberExpenses()}
        {view === 'monthlyStats' && renderMonthlyStats()}
        {view === 'budgetTracker' && renderBudgetTracker()}
      </div>
    </>
  );
}
