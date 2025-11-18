import React, { useState, useEffect, useCallback } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './SummaryView.css';

const SummaryView = ({ selectedYear, selectedMonth }) => {
  const { familyMembers, getMonthlyTotal, getMonthlyPlanned } = useExpenses();

  // Initialize selected members from localStorage or default to all selected
  const [selectedMembers, setSelectedMembers] = useState(() => {
    const saved = localStorage.getItem('viewer-selected-members');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default: all members selected
    return familyMembers.map(m => m.id);
  });

  // Update selected members when family members load
  useEffect(() => {
    if (familyMembers.length > 0 && selectedMembers.length === 0) {
      const allIds = familyMembers.map(m => m.id);
      setSelectedMembers(allIds);
      localStorage.setItem('viewer-selected-members', JSON.stringify(allIds));
    }
  }, [familyMembers, selectedMembers.length]);

  // Save selection to localStorage
  useEffect(() => {
    if (selectedMembers.length > 0) {
      localStorage.setItem('viewer-selected-members', JSON.stringify(selectedMembers));
    }
  }, [selectedMembers]);

  const toggleMember = useCallback((memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // Don't allow deselecting the last member
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  }, []);

  // Calculate net total for selected members only
  const netTotal = selectedMembers.reduce((sum, memberId) => {
    return sum + getMonthlyTotal(selectedYear, selectedMonth, memberId);
  }, 0);

  const copyToClipboard = useCallback(() => {
    const amount = netTotal.toFixed(2);
    navigator.clipboard.writeText(amount).then(() => {
      // Brief visual feedback - could be enhanced with a toast
      const btn = document.querySelector('.copy-amount-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 1500);
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, [netTotal]);

  return (
    <div className="summary-view">
      {/* Prominent Net Total Card */}
      <div className="summary-card net-total-card">
        <div className="net-total-header">
          <h2>Net Total</h2>
          <span className="month-label">
            {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="net-total-amount">
          <span className="amount">${netTotal.toFixed(2)}</span>
          <button onClick={copyToClipboard} className="copy-amount-btn" title="Copy amount to clipboard">
            Copy
          </button>
        </div>
        <p className="net-total-hint">
          {selectedMembers.length === familyMembers.length
            ? 'All members included'
            : `${selectedMembers.length} of ${familyMembers.length} members selected`}
        </p>
      </div>

      {/* Member Selection */}
      <div className="member-selection">
        <h3>Include in Total</h3>
        <div className="member-toggles">
          {familyMembers.map(member => {
            const isSelected = selectedMembers.includes(member.id);
            const paid = getMonthlyTotal(selectedYear, selectedMonth, member.id);

            return (
              <label
                key={member.id}
                className={`member-toggle ${isSelected ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMember(member.id)}
                />
                <span className="member-toggle-content">
                  <span className="member-name">{member.name}</span>
                  <span className="member-amount">${paid.toFixed(2)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
