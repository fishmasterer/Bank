import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const useMemberBudget = (year, month) => {
  const [memberBudgets, setMemberBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for all member budgets for this month
    const budgetsRef = collection(db, 'memberBudgets');

    // We'll query all member budgets and filter client-side
    const unsubscribe = onSnapshot(
      budgetsRef,
      (snapshot) => {
        const budgets = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Filter to current year/month
          if (data.year === year && data.month === month) {
            budgets[data.memberId] = {
              id: doc.id,
              ...data
            };
          }
        });
        setMemberBudgets(budgets);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching member budgets:', err);
        setMemberBudgets({});
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [year, month]);

  const saveMemberBudget = async (memberId, amount) => {
    const budgetId = `${year}-${month}-member-${memberId}`;
    const budgetRef = doc(db, 'memberBudgets', budgetId);

    const budgetData = {
      memberId,
      limit: amount,
      year,
      month,
      updatedAt: new Date().toISOString()
    };

    await setDoc(budgetRef, budgetData);
  };

  const getMemberBudgetStatus = (memberId, spent) => {
    const memberBudget = memberBudgets[memberId];

    if (!memberBudget || !memberBudget.limit) {
      return { status: 'none', percentage: 0, limit: 0, spent, remaining: 0 };
    }

    const limit = memberBudget.limit;
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

  const copyMemberBudgetsFromPrevMonth = async (prevYear, prevMonth) => {
    // Get previous month's member budgets
    const prevBudgetsQuery = query(
      collection(db, 'memberBudgets'),
      where('year', '==', prevYear),
      where('month', '==', prevMonth)
    );

    const snapshot = await getDocs(prevBudgetsQuery);
    let copiedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Check if budget already exists for this month
      if (!memberBudgets[data.memberId]) {
        await saveMemberBudget(data.memberId, data.limit);
        copiedCount++;
      }
    }

    return copiedCount;
  };

  return {
    memberBudgets,
    loading,
    saveMemberBudget,
    getMemberBudgetStatus,
    copyMemberBudgetsFromPrevMonth
  };
};
