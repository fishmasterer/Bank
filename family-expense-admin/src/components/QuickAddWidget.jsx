import React, { useState } from 'react';
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
  const [addingPreset, setAddingPreset] = useState(null);

  if (readOnly) return null;

  const handleQuickAdd = async (preset) => {
    setAddingPreset(preset.name);

    try {
      // Use the first family member as default paidBy
      const defaultMember = familyMembers[0]?.id || 1;

      const expense = {
        name: preset.name,
        category: preset.category,
        plannedAmount: preset.amount,
        paidAmount: preset.amount,
        paidBy: defaultMember,
        year: selectedYear,
        month: selectedMonth,
        isRecurring: false,
        notes: ''
      };

      await addExpense(expense);
      onSuccess?.(`Added ${preset.name} ($${preset.amount})`);
    } catch (error) {
      onError?.(`Failed to add ${preset.name}`);
    } finally {
      setAddingPreset(null);
    }
  };

  return (
    <div className="quick-add-widget">
      <h3 className="quick-add-title">Quick Add</h3>
      <div className="quick-add-presets">
        {QUICK_ADD_PRESETS.map((preset) => (
          <button
            key={preset.name}
            className={`quick-add-btn ${addingPreset === preset.name ? 'adding' : ''}`}
            onClick={() => handleQuickAdd(preset)}
            disabled={addingPreset !== null}
            title={`Add ${preset.name} - $${preset.amount}`}
          >
            <span className="preset-icon">{preset.icon}</span>
            <span className="preset-name">{preset.name}</span>
            <span className="preset-amount">${preset.amount}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickAddWidget;
