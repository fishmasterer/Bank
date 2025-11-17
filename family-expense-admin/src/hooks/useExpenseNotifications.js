import { useEffect, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useCategoryBudget } from './useCategoryBudget';

export const useExpenseNotifications = (selectedYear, selectedMonth) => {
  const { addBudgetAlert, addExpenseAction } = useNotifications();
  const { getCategoryBudgetStatus } = useCategoryBudget(selectedYear, selectedMonth);

  // Check budget status for a category and trigger notification if needed
  const checkBudgetAndNotify = useCallback((category, spent) => {
    const budgetStatus = getCategoryBudgetStatus(category, spent);

    if (budgetStatus.status === 'none') return;

    // Only notify for warning, critical, or exceeded
    if (['warning', 'critical', 'exceeded'].includes(budgetStatus.status)) {
      addBudgetAlert(category, budgetStatus.spent, budgetStatus.limit, budgetStatus.status);
    }
  }, [getCategoryBudgetStatus, addBudgetAlert]);

  // Notify when expense is added
  const notifyExpenseAdded = useCallback((expenseName, category, spent) => {
    addExpenseAction('added', expenseName, category);
    // Also check budget after adding
    checkBudgetAndNotify(category, spent);
  }, [addExpenseAction, checkBudgetAndNotify]);

  // Notify when expense is updated
  const notifyExpenseUpdated = useCallback((expenseName, category, spent) => {
    addExpenseAction('updated', expenseName, category);
    // Also check budget after updating
    checkBudgetAndNotify(category, spent);
  }, [addExpenseAction, checkBudgetAndNotify]);

  // Notify when expense is deleted
  const notifyExpenseDeleted = useCallback((expenseName, category) => {
    addExpenseAction('deleted', expenseName, category);
  }, [addExpenseAction]);

  return {
    notifyExpenseAdded,
    notifyExpenseUpdated,
    notifyExpenseDeleted,
    checkBudgetAndNotify
  };
};
