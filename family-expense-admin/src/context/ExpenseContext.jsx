import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import {
  cacheExpenses,
  getCachedExpenses,
  cacheFamilyMembers,
  getCachedFamilyMembers,
  addExpenseToCache,
  updateExpenseInCache,
  deleteExpenseFromCache,
  isIndexedDBAvailable
} from '../utils/indexedDBCache';
import { COLOR_PALETTE } from '../utils/themeColors';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Request deduplication tracking
  const pendingRequests = useRef(new Map());

  // Track optimistic updates for rollback
  const optimisticUpdates = useRef(new Map());

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      if (isIndexedDBAvailable()) {
        try {
          const [cachedExpenses, cachedMembers] = await Promise.all([
            getCachedExpenses(),
            getCachedFamilyMembers()
          ]);

          if (cachedExpenses.length > 0) {
            setExpenses(cachedExpenses);
          }
          if (cachedMembers.length > 0) {
            setFamilyMembers(cachedMembers);
          }
        } catch (err) {
          console.error('Failed to load cached data:', err);
        }
      }
    };

    loadCachedData();
  }, []);

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

        // Cache data for offline use
        if (isIndexedDBAvailable()) {
          cacheExpenses(expensesData);
        }
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

        // Cache data for offline use
        if (isIndexedDBAvailable()) {
          cacheFamilyMembers(membersData);
        }
      },
      (err) => {
        console.error('Error fetching family members:', err);
        // If no family members exist, set default ones
        if (err.code === 'permission-denied') {
          setFamilyMembers([
            { id: 1, name: 'Family Member 1' },
            { id: 2, name: 'Family Member 2' }
          ]);
        }
      }
    );

    return () => unsubscribeMembers();
  }, []);

  // Request deduplication helper
  const deduplicateRequest = useCallback((key, requestFn) => {
    // Check if there's already a pending request with this key
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key);
    }

    // Create new request promise
    const promise = requestFn().finally(() => {
      pendingRequests.current.delete(key);
    });

    pendingRequests.current.set(key, promise);
    return promise;
  }, []);

  const addExpense = async (expense) => {
    if (readOnly) {
      console.warn('Cannot add expense in read-only mode');
      return;
    }

    const requestKey = `add-${expense.name}-${expense.year}-${expense.month}`;

    return deduplicateRequest(requestKey, async () => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newExpense = {
        ...expense,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Optimistic update - add to state immediately
      setExpenses(prev => [newExpense, ...prev]);
      optimisticUpdates.current.set(tempId, { type: 'add', data: newExpense });

      // Update cache optimistically
      if (isIndexedDBAvailable()) {
        addExpenseToCache(newExpense);
      }

      try {
        // Perform actual Firebase operation
        const docRef = await addDoc(collection(db, 'expenses'), {
          ...expense,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Update the temporary ID with the real one
        setExpenses(prev =>
          prev.map(exp =>
            exp.id === tempId ? { ...exp, id: docRef.id } : exp
          )
        );

        optimisticUpdates.current.delete(tempId);
        return docRef.id;
      } catch (err) {
        console.error('Error adding expense:', err);

        // Rollback optimistic update
        setExpenses(prev => prev.filter(exp => exp.id !== tempId));
        optimisticUpdates.current.delete(tempId);

        if (isIndexedDBAvailable()) {
          deleteExpenseFromCache(tempId);
        }

        setError('Failed to add expense. Please try again.');
        throw err;
      }
    });
  };

  const updateExpense = async (id, updatedExpense) => {
    if (readOnly) {
      console.warn('Cannot update expense in read-only mode');
      return;
    }

    const requestKey = `update-${id}`;

    return deduplicateRequest(requestKey, async () => {
      // Store original for rollback
      const originalExpense = expenses.find(exp => exp.id === id);
      if (!originalExpense) return;

      const newExpenseData = {
        ...originalExpense,
        ...updatedExpense,
        updatedAt: new Date().toISOString()
      };

      // Optimistic update
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id ? newExpenseData : exp
        )
      );
      optimisticUpdates.current.set(id, { type: 'update', data: originalExpense });

      // Update cache optimistically
      if (isIndexedDBAvailable()) {
        updateExpenseInCache(newExpenseData);
      }

      try {
        const expenseRef = doc(db, 'expenses', id);
        await updateDoc(expenseRef, {
          ...updatedExpense,
          updatedAt: new Date().toISOString()
        });

        optimisticUpdates.current.delete(id);
      } catch (err) {
        console.error('Error updating expense:', err);

        // Rollback optimistic update
        setExpenses(prev =>
          prev.map(exp =>
            exp.id === id ? originalExpense : exp
          )
        );
        optimisticUpdates.current.delete(id);

        if (isIndexedDBAvailable()) {
          updateExpenseInCache(originalExpense);
        }

        setError('Failed to update expense. Please try again.');
        throw err;
      }
    });
  };

  const deleteExpense = async (id) => {
    if (readOnly) {
      console.warn('Cannot delete expense in read-only mode');
      return;
    }

    const requestKey = `delete-${id}`;

    return deduplicateRequest(requestKey, async () => {
      // Store original for rollback
      const originalExpense = expenses.find(exp => exp.id === id);
      if (!originalExpense) return;

      // Optimistic update
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      optimisticUpdates.current.set(id, { type: 'delete', data: originalExpense });

      // Update cache optimistically
      if (isIndexedDBAvailable()) {
        deleteExpenseFromCache(id);
      }

      try {
        await deleteDoc(doc(db, 'expenses', id));
        optimisticUpdates.current.delete(id);
      } catch (err) {
        console.error('Error deleting expense:', err);

        // Rollback optimistic update
        setExpenses(prev => [...prev, originalExpense].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ));
        optimisticUpdates.current.delete(id);

        if (isIndexedDBAvailable()) {
          addExpenseToCache(originalExpense);
        }

        setError('Failed to delete expense. Please try again.');
        throw err;
      }
    });
  };

  const updateFamilyMember = async (id, updates) => {
    if (readOnly) {
      console.warn('Cannot update family member in read-only mode');
      return;
    }

    const requestKey = `update-member-${id}`;

    return deduplicateRequest(requestKey, async () => {
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
    });
  };

  const addFamilyMember = async () => {
    if (readOnly) {
      console.warn('Cannot add family member in read-only mode');
      return;
    }

    const requestKey = 'add-member';

    return deduplicateRequest(requestKey, async () => {
      try {
        const newId = Math.max(...familyMembers.map(m => m.id), 0) + 1;
        // Assign a default color based on member index
        const colorIndex = (newId - 1) % COLOR_PALETTE.length;
        await addDoc(collection(db, 'familyMembers'), {
          id: newId,
          name: `Family Member ${newId}`,
          color: COLOR_PALETTE[colorIndex]
        });
      } catch (err) {
        console.error('Error adding family member:', err);
        setError('Failed to add family member. Please try again.');
        throw err;
      }
    });
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

    const requestKey = `copy-${fromYear}-${fromMonth}-${toYear}-${toMonth}`;

    return deduplicateRequest(requestKey, async () => {
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
    });
  };

  const value = {
    expenses,
    familyMembers,
    loading,
    error,
    isOnline,
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
