import React, { createContext, useContext, useState, useEffect } from 'react';

const ExpenseContext = createContext();

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

const STORAGE_KEY = 'family-expenses';

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: 'Family Member 1' },
    { id: 2, name: 'Family Member 2' }
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setExpenses(data.expenses || []);
      setFamilyMembers(data.familyMembers || familyMembers);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ expenses, familyMembers })
    );
  }, [expenses, familyMembers]);

  const addExpense = (expense) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = (id, updatedExpense) => {
    setExpenses(expenses.map(exp =>
      exp.id === id ? { ...exp, ...updatedExpense } : exp
    ));
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const updateFamilyMember = (id, name) => {
    setFamilyMembers(familyMembers.map(member =>
      member.id === id ? { ...member, name } : member
    ));
  };

  const addFamilyMember = () => {
    const newId = Math.max(...familyMembers.map(m => m.id), 0) + 1;
    setFamilyMembers([...familyMembers, { id: newId, name: `Family Member ${newId}` }]);
  };

  const getExpensesByMonth = (year, month) => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.year, exp.month - 1);
      return expDate.getFullYear() === year && expDate.getMonth() === month - 1;
    });
  };

  const getMonthlyTotal = (year, month, memberId = null) => {
    const monthExpenses = getExpensesByMonth(year, month);
    const filtered = memberId
      ? monthExpenses.filter(exp => exp.paidBy === memberId)
      : monthExpenses;

    return filtered.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
  };

  const getMonthlyPlanned = (year, month, memberId = null) => {
    const monthExpenses = getExpensesByMonth(year, month);
    const filtered = memberId
      ? monthExpenses.filter(exp => exp.paidBy === memberId)
      : monthExpenses;

    return filtered.reduce((sum, exp) => sum + (exp.plannedAmount || 0), 0);
  };

  const getCategoryBreakdown = (year, month) => {
    const monthExpenses = getExpensesByMonth(year, month);
    const breakdown = {};

    monthExpenses.forEach(exp => {
      if (!breakdown[exp.category]) {
        breakdown[exp.category] = {
          planned: 0,
          paid: 0,
          expenses: []
        };
      }
      breakdown[exp.category].planned += exp.plannedAmount || 0;
      breakdown[exp.category].paid += exp.paidAmount || 0;
      breakdown[exp.category].expenses.push(exp);
    });

    return breakdown;
  };

  const value = {
    expenses,
    familyMembers,
    addExpense,
    updateExpense,
    deleteExpense,
    updateFamilyMember,
    addFamilyMember,
    getExpensesByMonth,
    getMonthlyTotal,
    getMonthlyPlanned,
    getCategoryBreakdown
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
