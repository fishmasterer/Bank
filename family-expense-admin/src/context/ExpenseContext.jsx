import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ExpenseContext = createContext();

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children, readOnly = false }) => {
  const [expenses, setExpenses] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener for expenses
  useEffect(() => {
    setLoading(true);
    const expensesQuery = query(
      collection(db, 'expenses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        const expensesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setExpenses(expensesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching expenses:', err);
        setError('Failed to load expenses. Please check your connection.');
        setLoading(false);
      }
    );

    return () => unsubscribeExpenses();
  }, []);

  // Real-time listener for family members
  useEffect(() => {
    const membersQuery = query(
      collection(db, 'familyMembers'),
      orderBy('id', 'asc')
    );

    const unsubscribeMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          firestoreId: doc.id,
          ...doc.data()
        }));
        setFamilyMembers(membersData);
      },
      (err) => {
        console.error('Error fetching family members:', err);
        // If no family members exist, set default ones
        if (err.code === 'permission-denied' || snapshot.empty) {
          setFamilyMembers([
            { id: 1, name: 'Family Member 1' },
            { id: 2, name: 'Family Member 2' }
          ]);
        }
      }
    );

    return () => unsubscribeMembers();
  }, []);

  const addExpense = async (expense) => {
    if (readOnly) {
      console.warn('Cannot add expense in read-only mode');
      return;
    }

    try {
      const newExpense = {
        ...expense,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'expenses'), newExpense);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense. Please try again.');
      throw err;
    }
  };

  const updateExpense = async (id, updatedExpense) => {
    if (readOnly) {
      console.warn('Cannot update expense in read-only mode');
      return;
    }

    try {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, {
        ...updatedExpense,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense. Please try again.');
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    if (readOnly) {
      console.warn('Cannot delete expense in read-only mode');
      return;
    }

    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense. Please try again.');
      throw err;
    }
  };

  const updateFamilyMember = async (id, updates) => {
    if (readOnly) {
      console.warn('Cannot update family member in read-only mode');
      return;
    }

    try {
      const member = familyMembers.find(m => m.id === id);
      if (member && member.firestoreId) {
        const memberRef = doc(db, 'familyMembers', member.firestoreId);
        // Support both old signature (id, name) and new signature (id, {name, color})
        const updateData = typeof updates === 'string' ? { name: updates } : updates;
        await updateDoc(memberRef, updateData);
      }
    } catch (err) {
      console.error('Error updating family member:', err);
      setError('Failed to update family member. Please try again.');
      throw err;
    }
  };

  // Default color palette for new members
  const defaultMemberColors = [
    '#667eea', // Purple
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  const addFamilyMember = async () => {
    if (readOnly) {
      console.warn('Cannot add family member in read-only mode');
      return;
    }

    try {
      const newId = Math.max(...familyMembers.map(m => m.id), 0) + 1;
      // Assign a default color based on member index
      const colorIndex = (newId - 1) % defaultMemberColors.length;
      await addDoc(collection(db, 'familyMembers'), {
        id: newId,
        name: `Family Member ${newId}`,
        color: defaultMemberColors[colorIndex]
      });
    } catch (err) {
      console.error('Error adding family member:', err);
      setError('Failed to add family member. Please try again.');
      throw err;
    }
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

  const copyRecurringExpenses = async (fromYear, fromMonth, toYear, toMonth) => {
    if (readOnly) {
      console.warn('Cannot copy expenses in read-only mode');
      return 0;
    }

    try {
      // Get all recurring expenses from the source month
      const sourceExpenses = getExpensesByMonth(fromYear, fromMonth);
      const recurringExpenses = sourceExpenses.filter(exp => exp.isRecurring);

      if (recurringExpenses.length === 0) {
        return 0;
      }

      // Check if any of these expenses already exist in the target month
      const targetExpenses = getExpensesByMonth(toYear, toMonth);
      const targetExpenseNames = new Set(targetExpenses.map(exp => exp.name.toLowerCase()));

      // Copy each recurring expense to the new month
      const promises = recurringExpenses.map(async (expense) => {
        // Skip if expense with same name already exists in target month
        if (targetExpenseNames.has(expense.name.toLowerCase())) {
          return null;
        }

        const newExpense = {
          name: expense.name,
          category: expense.category,
          plannedAmount: expense.plannedAmount,
          paidAmount: 0, // Reset paid amount for new month
          paidBy: expense.paidBy,
          isRecurring: true,
          year: toYear,
          month: toMonth,
          notes: expense.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return addDoc(collection(db, 'expenses'), newExpense);
      });

      const results = await Promise.all(promises);
      const copiedCount = results.filter(r => r !== null).length;

      return copiedCount;
    } catch (err) {
      console.error('Error copying recurring expenses:', err);
      throw err;
    }
  };

  const value = {
    expenses,
    familyMembers,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    updateFamilyMember,
    addFamilyMember,
    getExpensesByMonth,
    getMonthlyTotal,
    getMonthlyPlanned,
    getCategoryBreakdown,
    copyRecurringExpenses,
    readOnly
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
