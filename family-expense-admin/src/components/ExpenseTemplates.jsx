import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import './ExpenseTemplates.css';

const ExpenseTemplates = ({ onClose, onUseTemplate, onSuccess, onError }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'expense-templates'),
      (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setTemplates(templatesData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading templates:', error);
        onError?.('Failed to load templates');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [onError]);

  const handleDelete = async (templateId) => {
    if (!confirm('Delete this template?')) return;

    setDeletingId(templateId);
    try {
      await deleteDoc(doc(db, 'expense-templates', templateId));
      onSuccess?.('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      onError?.('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUse = (template) => {
    onUseTemplate(template);
    onClose();
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Groceries': '🛒',
      'Utilities': '💡',
      'Rent': '🏠',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Insurance': '🛡️',
      'Education': '📚',
      'Dining Out': '🍽️',
      'Shopping': '🛍️',
      'Subscriptions': '📱',
      'Pets': '🐾',
      'Travel': '✈️',
      'Gifts': '🎁',
      'Other': '📦'
    };
    return icons[category] || '📌';
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content expense-templates-modal" onClick={e => e.stopPropagation()}>
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
      <div className="modal-content expense-templates-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📝 Expense Templates</h2>
          <button onClick={onClose} className="close-button" aria-label="Close">×</button>
        </div>

        <p className="modal-description">
          Click a template to use it, or delete templates you no longer need
        </p>

        <div className="templates-list">
          {templates.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📝</p>
              <p className="empty-text">No templates yet</p>
              <p className="empty-hint">
                When adding an expense, check "Save as template" to create reusable templates
              </p>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <div className="template-icon">
                    {getCategoryIcon(template.category)}
                  </div>
                  <div className="template-info">
                    <h3 className="template-name">{template.name}</h3>
                    <div className="template-meta">
                      <span className="template-category">{template.category}</span>
                      {template.isRecurring && (
                        <span className="template-badge recurring">🔄 Recurring</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="template-details">
                  <div className="template-amount">
                    <span className="amount-label">Planned:</span>
                    <span className="amount-value">${(template.plannedAmount || 0).toFixed(2)}</span>
                  </div>
                  {template.notes && (
                    <div className="template-notes">
                      <span className="notes-icon">💬</span>
                      <span className="notes-text">{template.notes}</span>
                    </div>
                  )}
                </div>

                <div className="template-actions">
                  <button
                    onClick={() => handleUse(template)}
                    className="btn-primary btn-small"
                  >
                    ✨ Use Template
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn-danger btn-small"
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? (
                      <>
                        <span className="spinner-small"></span>
                        Deleting...
                      </>
                    ) : (
                      '🗑️ Delete'
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTemplates;
