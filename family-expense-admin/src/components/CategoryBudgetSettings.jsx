import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useExpenses } from '../context/ExpenseContext';
import './CategoryBudgetSettings.css';

const CategoryBudgetSettings = ({ selectedYear, selectedMonth, onClose, onSuccess, onError }) => {
  const { getCategoryBreakdown } = useExpenses();
  const [categoryLimits, setCategoryLimits] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const breakdown = getCategoryBreakdown(selectedYear, selectedMonth);
  const categories = Object.keys(breakdown).sort();

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const budgetKey = `${selectedYear}-${selectedMonth}`;
        const budgetDoc = await getDoc(doc(db, 'category-budgets', budgetKey));

        if (budgetDoc.exists()) {
          setCategoryLimits(budgetDoc.data().limits || {});
        } else {
          setCategoryLimits({});
        }
      } catch (err) {
        console.error('Error loading category budgets:', err);
        onError?.('Failed to load category budgets');
      } finally {
        setIsLoading(false);
      }
    };

    loadBudgets();
  }, [selectedYear, selectedMonth, onError]);

  const handleLimitChange = (category, value) => {
    setCategoryLimits(prev => ({
      ...prev,
      [category]: value === '' ? undefined : parseFloat(value)
    }));
  };

  const handleCopyFromPrevious = async () => {
    setIsCopying(true);
    try {
      // Calculate previous month
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;

      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const prevBudgetKey = `${prevYear}-${prevMonth}`;
      const prevBudgetDoc = await getDoc(doc(db, 'category-budgets', prevBudgetKey));

      if (prevBudgetDoc.exists()) {
        const prevLimits = prevBudgetDoc.data().limits || {};
        setCategoryLimits(prevLimits);
        onSuccess?.(`Copied budgets from ${new Date(prevYear, prevMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
      } else {
        onError?.('No budget found for previous month');
      }
    } catch (err) {
      console.error('Error copying budgets:', err);
      onError?.('Failed to copy budgets from previous month');
    } finally {
      setIsCopying(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const budgetKey = `${selectedYear}-${selectedMonth}`;

      // Filter out undefined/empty values
      const cleanedLimits = Object.fromEntries(
        Object.entries(categoryLimits).filter(([_, value]) => value !== undefined && value > 0)
      );

      await setDoc(doc(db, 'category-budgets', budgetKey), {
        year: selectedYear,
        month: selectedMonth,
        limits: cleanedLimits,
        updatedAt: new Date().toISOString()
      });

      onSuccess?.('Category budgets saved successfully!');
      onClose();
    } catch (err) {
      console.error('Error saving category budgets:', err);
      onError?.('Failed to save category budgets');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategorySpending = (category) => {
    return breakdown[category]?.paid || 0;
  };

  const getBudgetStatus = (category) => {
    const limit = categoryLimits[category];
    if (!limit) return null;

    const spent = getCategorySpending(category);
    const percentage = (spent / limit) * 100;

    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content category-budget-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Loading...</h2>
            <button onClick={onClose} className="close-button" aria-label="Close">×</button>
          </div>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content category-budget-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Category Budgets</h2>
          <button onClick={onClose} className="close-button" aria-label="Close">×</button>
        </div>

        <div className="modal-description-row">
          <p className="modal-description">
            Set budget limits for each category in {monthName}
          </p>
          <button
            onClick={handleCopyFromPrevious}
            className="btn-copy-budgets"
            disabled={isCopying || isSaving}
            type="button"
          >
            {isCopying ? (
              <>
                <span className="spinner-small"></span>
                Copying...
              </>
            ) : (
              <>📋 Copy from Previous</>
            )}
          </button>
        </div>

        <div className="category-budget-list">
          {categories.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📦</p>
              <p className="empty-text">No categories yet</p>
              <p className="empty-hint">Add expenses to create categories</p>
            </div>
          ) : (
            categories.map(category => {
              const spent = getCategorySpending(category);
              const limit = categoryLimits[category] || '';
              const status = getBudgetStatus(category);
              const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

              return (
                <div key={category} className={`category-budget-item ${status || ''}`}>
                  <div className="category-budget-header">
                    <div className="category-info">
                      <span className="category-name">{category}</span>
                      <span className="category-spent">
                        Spent: ${spent.toFixed(2)}
                      </span>
                    </div>
                    <div className="budget-input-group">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={limit}
                        onChange={(e) => handleLimitChange(category, e.target.value)}
                        placeholder="No limit"
                        className="budget-input"
                      />
                    </div>
                  </div>

                  {limit > 0 && (
                    <div className="category-budget-progress">
                      <div className="progress-bar">
                        <div
                          className={`progress-bar-fill ${status}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="progress-info">
                        <span className="progress-percentage">
                          {percentage.toFixed(0)}%
                        </span>
                        {status === 'exceeded' && (
                          <span className="progress-status">
                            ⚠️ Over by ${(spent - limit).toFixed(2)}
                          </span>
                        )}
                        {status === 'critical' && (
                          <span className="progress-status">
                            ⚠️ ${(limit - spent).toFixed(2)} remaining
                          </span>
                        )}
                        {status === 'warning' && (
                          <span className="progress-status">
                            ⚡ ${(limit - spent).toFixed(2)} remaining
                          </span>
                        )}
                        {status === 'good' && (
                          <span className="progress-status">
                            ✓ ${(limit - spent).toFixed(2)} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isSaving || categories.length === 0}>
            {isSaving ? (
              <>
                <span className="spinner-small"></span>
                Saving...
              </>
            ) : (
              'Save Budgets'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBudgetSettings;
