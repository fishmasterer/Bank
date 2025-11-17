import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useCategoryBudget = (selectedYear, selectedMonth) => {
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const budgetKey = `${selectedYear}-${selectedMonth}`;
    const budgetDocRef = doc(db, 'category-budgets', budgetKey);

    setLoading(true);

    const unsubscribe = onSnapshot(
      budgetDocRef,
      (doc) => {
        if (doc.exists()) {
          setCategoryBudgets(doc.data().limits || {});
        } else {
          setCategoryBudgets({});
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading category budgets:', error);
        setCategoryBudgets({});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedYear, selectedMonth]);

  const getCategoryBudgetStatus = (category, spent) => {
    const limit = categoryBudgets[category];

    if (!limit || limit <= 0) {
      return { status: 'none', percentage: 0, limit: null, spent, remaining: null };
    }

    const percentage = (spent / limit) * 100;
    let status = 'good';

    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 90) status = 'critical';
    else if (percentage >= 80) status = 'warning';

    return {
      status,
      percentage: Math.min(percentage, 100),
      limit,
      spent,
      remaining: Math.max(limit - spent, 0)
    };
  };

  return {
    categoryBudgets,
    loading,
    getCategoryBudgetStatus
  };
};
