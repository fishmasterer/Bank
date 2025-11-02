import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useBudget = (year, month) => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const budgetId = `${year}-${month}`;
    const budgetRef = doc(db, 'budgets', budgetId);

    // Real-time listener for budget changes
    const unsubscribe = onSnapshot(
      budgetRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBudget(docSnap.data());
        } else {
          setBudget(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching budget:', err);
        setBudget(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [year, month]);

  const getBudgetStatus = (spent) => {
    if (!budget || !budget.monthlyLimit) {
      return { status: 'none', percentage: 0 };
    }

    const limit = budget.monthlyLimit;
    const percentage = (spent / limit) * 100;

    let status = 'good';
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 90) {
      status = 'critical';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return {
      status,
      percentage: Math.min(percentage, 100),
      limit,
      spent,
      remaining: Math.max(limit - spent, 0)
    };
  };

  return {
    budget,
    loading,
    getBudgetStatus
  };
};
