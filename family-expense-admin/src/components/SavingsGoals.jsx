import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import './SavingsGoals.css';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎁', '🏦', '🛡️', '🌴'];

const SavingsGoals = ({ onClose, onSuccess, onError }) => {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    icon: '🎯',
    deadline: ''
  });

  // Load goals from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const goalsRef = collection(db, 'savings-goals');
    const q = query(goalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading goals:', error);
      setLoading(false);
      onError?.('Failed to load goals');
    });

    return () => unsubscribe();
  }, [currentUser, onError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.targetAmount) {
      onError?.('Name and target amount are required');
      return;
    }

    setSaving(true);

    try {
      const goalData = {
        name: formData.name.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        icon: formData.icon,
        deadline: formData.deadline || null,
        updatedAt: new Date().toISOString()
      };

      if (editingGoal) {
        await updateDoc(doc(db, 'savings-goals', editingGoal.id), goalData);
        onSuccess?.('Goal updated');
      } else {
        await addDoc(collection(db, 'savings-goals'), {
          ...goalData,
          createdAt: new Date().toISOString()
        });
        onSuccess?.('Goal created');
      }

      resetForm();
    } catch (err) {
      console.error('Error saving goal:', err);
      onError?.('Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete "${goal.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'savings-goals', goal.id));
      onSuccess?.('Goal deleted');
    } catch (err) {
      console.error('Error deleting goal:', err);
      onError?.('Failed to delete goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || 0,
      icon: goal.icon || '🎯',
      deadline: goal.deadline || ''
    });
    setIsAdding(true);
  };

  const handleAddContribution = async (goal, amount) => {
    const newAmount = (goal.currentAmount || 0) + amount;
    try {
      await updateDoc(doc(db, 'savings-goals', goal.id), {
        currentAmount: newAmount,
        updatedAt: new Date().toISOString()
      });

      if (newAmount >= goal.targetAmount) {
        onSuccess?.(`🎉 Congratulations! You've reached your "${goal.name}" goal!`);
      } else {
        onSuccess?.(`Added $${amount} to ${goal.name}`);
      }
    } catch (err) {
      console.error('Error adding contribution:', err);
      onError?.('Failed to add contribution');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      icon: '🎯',
      deadline: ''
    });
    setEditingGoal(null);
    setIsAdding(false);
  };

  const getProgress = (goal) => {
    if (!goal.targetAmount) return 0;
    return Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="savings-goals-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Savings Goals</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="savings-goals-content">
          {/* Add/Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="goal-form">
              <h3>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h3>

              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount *</label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="0"
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Current Saved</label>
                  <input
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {GOAL_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Target Date (optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="btn-add-goal"
            >
              + Add New Savings Goal
            </button>
          )}

          {/* Goals List */}
          <div className="goals-list">
            {loading ? (
              <div className="loading-state">Loading goals...</div>
            ) : goals.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🎯</span>
                <p>No savings goals yet</p>
                <p className="empty-hint">Create your first goal to start tracking!</p>
              </div>
            ) : (
              goals.map(goal => {
                const progress = getProgress(goal);
                const isComplete = progress >= 100;

                return (
                  <div key={goal.id} className={`goal-card ${isComplete ? 'complete' : ''}`}>
                    <div className="goal-header">
                      <span className="goal-icon">{goal.icon || '🎯'}</span>
                      <div className="goal-info">
                        <h4>{goal.name}</h4>
                        {goal.deadline && (
                          <span className="goal-deadline">
                            Target: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="goal-actions">
                        <button onClick={() => handleEdit(goal)} className="btn-icon" title="Edit">
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(goal)} className="btn-icon delete" title="Delete">
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="progress-text">
                        <span className="current">{formatCurrency(goal.currentAmount)}</span>
                        <span className="separator">/</span>
                        <span className="target">{formatCurrency(goal.targetAmount)}</span>
                        <span className="percent">({progress.toFixed(0)}%)</span>
                      </div>
                    </div>

                    {!isComplete && (
                      <div className="quick-add">
                        <span className="quick-add-label">Quick add:</span>
                        {[10, 25, 50, 100].map(amount => (
                          <button
                            key={amount}
                            onClick={() => handleAddContribution(goal, amount)}
                            className="quick-add-btn"
                          >
                            +${amount}
                          </button>
                        ))}
                      </div>
                    )}

                    {isComplete && (
                      <div className="goal-complete-badge">
                        🎉 Goal Reached!
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoals;
