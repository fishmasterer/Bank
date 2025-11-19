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
  const [selectedMember, setSelectedMember] = useState(null);

  // Set default member when familyMembers load
  React.useEffect(() => {
    if (familyMembers.length > 0 && selectedMember === null) {
      setSelectedMember(familyMembers[0].id);
    }
  }, [familyMembers, selectedMember]);

  if (readOnly) return null;

  const handleQuickAdd = async (preset) => {
    setAddingPreset(preset.name);

    try {
      const expense = {
        name: preset.name,
        category: preset.category,
        plannedAmount: preset.amount,
        paidAmount: preset.amount,
        paidBy: selectedMember || familyMembers[0]?.id || 1,
        year: selectedYear,
        month: selectedMonth,
        isRecurring: false,
        notes: ''
      };

      await addExpense(expense);
      const memberName = familyMembers.find(m => m.id === selectedMember)?.name || 'Unknown';
      onSuccess?.(`Added ${preset.name} ($${preset.amount}) for ${memberName}`);
    } catch (error) {
      onError?.(`Failed to add ${preset.name}`);
    } finally {
      setAddingPreset(null);
    }
  };

  return (
    <div className="quick-add-widget">
      <div className="quick-add-header">
        <h3 className="quick-add-title">Quick Add</h3>
        <div className="quick-add-member-select">
          <span className="member-label">For:</span>
          <select
            value={selectedMember || ''}
            onChange={(e) => setSelectedMember(Number(e.target.value))}
            className="member-dropdown"
          >
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>
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
