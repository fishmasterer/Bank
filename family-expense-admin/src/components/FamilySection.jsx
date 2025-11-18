import React, { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './FamilySection.css';

const FamilySection = ({ selectedYear, selectedMonth }) => {
  const { expenses, familyMembers, getExpensesByMonth } = useExpenses();

  const monthExpenses = getExpensesByMonth(selectedYear, selectedMonth);
  const totalPaid = monthExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);

  // Calculate stats for each member
  const memberStats = useMemo(() => {
    return familyMembers.map(member => {
      const memberExpenses = monthExpenses.filter(exp => exp.paidBy === member.id);
      const paid = memberExpenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
      const planned = memberExpenses.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
      const percentage = totalPaid > 0 ? (paid / totalPaid) * 100 : 0;

      // Get category breakdown for this member
      const categoryBreakdown = {};
      memberExpenses.forEach(exp => {
        if (!categoryBreakdown[exp.category]) {
          categoryBreakdown[exp.category] = 0;
        }
        categoryBreakdown[exp.category] += exp.paidAmount || 0;
      });

      // Top category
      const topCategory = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        ...member,
        expenseCount: memberExpenses.length,
        paid,
        planned,
        percentage,
        categoryBreakdown,
        topCategory: topCategory ? topCategory[0] : null
      };
    }).sort((a, b) => b.paid - a.paid);
  }, [familyMembers, monthExpenses, totalPaid]);

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="family-section">
      {/* Header */}
      <div className="family-header-card">
        <h2>Family Members</h2>
        <p className="family-subtitle">{monthName}</p>
      </div>

      {/* Overview Stats */}
      <div className="family-overview">
        <div className="overview-stat">
          <span className="stat-value">{familyMembers.length}</span>
          <span className="stat-label">Members</span>
        </div>
        <div className="overview-stat">
          <span className="stat-value">${totalPaid.toLocaleString()}</span>
          <span className="stat-label">Total Spent</span>
        </div>
        <div className="overview-stat">
          <span className="stat-value">{monthExpenses.length}</span>
          <span className="stat-label">Expenses</span>
        </div>
      </div>

      {/* Member Cards */}
      <div className="member-cards">
        {memberStats.map(member => (
          <div key={member.id} className="member-card">
            <div className="member-card-header">
              <div
                className="member-avatar"
                style={{ backgroundColor: member.color || '#667eea' }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-contribution">
                  {member.percentage.toFixed(1)}% of total
                </p>
              </div>
            </div>

            <div className="member-spending">
              <div className="spending-main">
                <span className="spending-amount">${member.paid.toLocaleString()}</span>
                <span className="spending-label">spent this month</span>
              </div>

              {/* Contribution bar */}
              <div className="contribution-bar-container">
                <div className="contribution-bar">
                  <div
                    className="contribution-fill"
                    style={{
                      width: `${member.percentage}%`,
                      backgroundColor: member.color || '#667eea'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="member-details">
              <div className="detail-row">
                <span className="detail-label">Expenses</span>
                <span className="detail-value">{member.expenseCount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Planned</span>
                <span className="detail-value">${member.planned.toLocaleString()}</span>
              </div>
              {member.topCategory && (
                <div className="detail-row">
                  <span className="detail-label">Top Category</span>
                  <span className="detail-value">{member.topCategory}</span>
                </div>
              )}
            </div>

            {/* Category breakdown for member */}
            {Object.keys(member.categoryBreakdown).length > 0 && (
              <div className="member-categories">
                <h4>Spending by Category</h4>
                <div className="category-list">
                  {Object.entries(member.categoryBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([category, amount]) => (
                      <div key={category} className="category-row">
                        <span className="category-name">{category}</span>
                        <span className="category-amount">
                          ${amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {familyMembers.length === 0 && (
        <div className="empty-family">
          <span className="empty-icon">👥</span>
          <p className="empty-title">No family members</p>
          <p className="empty-hint">Add family members to track individual spending</p>
        </div>
      )}
    </div>
  );
};

export default FamilySection;
