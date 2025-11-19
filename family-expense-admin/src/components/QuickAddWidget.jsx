import React, { useState, useEffect, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './QuickAddWidget.css';

const QUICK_ADD_PRESETS = [
  { name: 'Coffee', amount: 5, category: 'Food & Dining', icon: '☕' },
  { name: 'Lunch', amount: 15, category: 'Food & Dining', icon: '🍽️' },
  { name: 'Gas', amount: 50, category: 'Transportation', icon: '⛽' },
  { name: 'Groceries', amount: 100, category: 'Groceries', icon: '🛒' },
  { name: 'Uber/Taxi', amount: 20, category: 'Transportation', icon: '🚕' },
  { name: 'Parking', amount: 10, category: 'Transportation', icon: '🅿️' },
];

const QuickAddWidget = ({ selectedYear, selectedMonth, onSuccess, onError }) => {
  const { addExpense, familyMembers, readOnly } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Set default member when familyMembers load
  useEffect(() => {
    if (familyMembers.length > 0 && selectedMember === null) {
      setSelectedMember(familyMembers[0].id);
    }
  }, [familyMembers, selectedMember]);

  // Focus input when preset is selected
  useEffect(() => {
    if (selectedPreset && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [selectedPreset]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (readOnly) return null;

  const handleOpen = () => {
    setIsOpen(true);
    setSelectedPreset(null);
    setCustomAmount('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedPreset(null);
    setCustomAmount('');
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    setCustomAmount(preset.amount.toString());
  };

  const handleSubmit = async () => {
    if (!selectedPreset || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const amount = parseFloat(customAmount) || selectedPreset.amount;
      const expense = {
        name: selectedPreset.name,
        category: selectedPreset.category,
        plannedAmount: amount,
        paidAmount: amount,
        paidBy: selectedMember || familyMembers[0]?.id || 1,
        year: selectedYear,
        month: selectedMonth,
        isRecurring: false,
        notes: ''
      };

      await addExpense(expense);
      const memberName = familyMembers.find(m => m.id === selectedMember)?.name || 'Unknown';
      onSuccess?.(`Added ${selectedPreset.name} ($${amount.toFixed(2)}) for ${memberName}`);
      handleClose();
    } catch (error) {
      onError?.(`Failed to add ${selectedPreset.name}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button className="quick-add-trigger" onClick={handleOpen}>
        <span className="trigger-icon">⚡</span>
        <span className="trigger-text">Quick Add</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div
            className="quick-add-backdrop"
            onClick={handleClose}
          />
          <div ref={menuRef} className="quick-add-modal">
            <div className="quick-add-header">
              <h3 className="quick-add-title">Quick Add Expense</h3>
              <button
                className="quick-add-close"
                onClick={handleClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Member Selector */}
            <div className="quick-add-member-row">
              <span className="member-label">For:</span>
              <div className="member-chips">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    className={`member-chip ${selectedMember === member.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Grid */}
            <div className="quick-add-presets">
              {QUICK_ADD_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  className={`quick-add-preset ${selectedPreset?.name === preset.name ? 'selected' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="preset-icon">{preset.icon}</span>
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-amount">${preset.amount}</span>
                </button>
              ))}
            </div>

            {/* Amount Adjustment */}
            {selectedPreset && (
              <div className="quick-add-amount-section">
                <div className="amount-header">
                  <span className="amount-label">Amount</span>
                  <span className="amount-preset-name">{selectedPreset.icon} {selectedPreset.name}</span>
                </div>
                <div className="amount-input-wrapper">
                  <span className="amount-prefix">$</span>
                  <input
                    ref={inputRef}
                    type="number"
                    className="amount-input"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyDown={handleKeyDown}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <button
                  className="quick-add-submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !customAmount}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Adding...
                    </>
                  ) : (
                    <>Add Expense</>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default QuickAddWidget;
