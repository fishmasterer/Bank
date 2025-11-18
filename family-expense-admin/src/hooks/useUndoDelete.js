import { useState, useCallback, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';

export const useUndoDelete = () => {
  const [deletedItem, setDeletedItem] = useState(null);
  const { addExpense } = useExpenses();
  const timeoutRef = useRef(null);

  const trackDelete = useCallback((expense) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store the deleted item
    setDeletedItem(expense);

    // Auto-clear after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setDeletedItem(null);
    }, 5000);

    return expense;
  }, []);

  const undoDelete = useCallback(async () => {
    if (!deletedItem) return false;

    try {
      // Re-add the expense
      const { id, ...expenseData } = deletedItem;
      await addExpense(expenseData);

      // Clear the deleted item
      setDeletedItem(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return true;
    } catch (error) {
      console.error('Failed to undo delete:', error);
      return false;
    }
  }, [deletedItem, addExpense]);

  const clearUndo = useCallback(() => {
    setDeletedItem(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    deletedItem,
    trackDelete,
    undoDelete,
    clearUndo,
    canUndo: !!deletedItem
  };
};

export default useUndoDelete;
