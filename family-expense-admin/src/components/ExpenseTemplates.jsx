import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import './ExpenseTemplates.css';

const CATEGORIES = [
  'Groceries', 'Utilities', 'Rent/Mortgage', 'Transportation', 'Healthcare',
  'Education', 'Entertainment', 'Insurance', 'Dining Out', 'Shopping', 'Other'
];

const ExpenseTemplates = ({ onClose, onUseTemplate, onSuccess, onError }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

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

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.notes && template.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, filterCategory]);

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

  const handleEdit = (template) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      category: template.category,
      plannedAmount: template.plannedAmount,
      isRecurring: template.isRecurring,
      notes: template.notes || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'expense-templates', editingTemplate.id), {
        name: editingTemplate.name,
        category: editingTemplate.category,
        plannedAmount: parseFloat(editingTemplate.plannedAmount) || 0,
        isRecurring: editingTemplate.isRecurring,
        notes: editingTemplate.notes,
        updatedAt: new Date().toISOString()
      });
      onSuccess?.('Template updated successfully!');
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error updating template:', error);
      onError?.('Failed to update template');
    }
  };

  const handleUse = (template) => {
    onUseTemplate(template);
    onClose();
  };

  const handleQuickUse = async (template) => {
    // Track usage
    try {
      await updateDoc(doc(db, 'expense-templates', template.id), {
        lastUsed: new Date().toISOString(),
        useCount: (template.useCount || 0) + 1
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }

    handleUse(template);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Groceries': '🛒',
      'Utilities': '💡',
      'Rent/Mortgage': '🏠',
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

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const hasFilters = searchTerm.trim() || filterCategory !== 'all';

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

  if (editingTemplate) {
    return (
      <div className="modal-overlay" onClick={() => setEditingTemplate(null)}>
        <div className="modal-content template-edit-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>✏️ Edit Template</h2>
            <button onClick={() => setEditingTemplate(null)} className="close-button" aria-label="Close">×</button>
          </div>

          <form onSubmit={handleSaveEdit} className="template-edit-form">
            <div className="form-group">
              <label htmlFor="edit-name">Template Name</label>
              <input
                type="text"
                id="edit-name"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <select
                id="edit-category"
                value={editingTemplate.category}
                onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-amount">Planned Amount</label>
              <input
                type="number"
                id="edit-amount"
                min="0"
                step="0.01"
                value={editingTemplate.plannedAmount}
                onChange={(e) => setEditingTemplate({...editingTemplate, plannedAmount: e.target.value})}
                required
              />
            </div>

            <div className="form-group-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.isRecurring}
                  onChange={(e) => setEditingTemplate({...editingTemplate, isRecurring: e.target.checked})}
                />
                <span>Recurring Expense</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes">Notes (Optional)</label>
              <textarea
                id="edit-notes"
                value={editingTemplate.notes}
                onChange={(e) => setEditingTemplate({...editingTemplate, notes: e.target.value})}
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setEditingTemplate(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
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
          Click a template to create an expense instantly
        </p>

        {/* Search and Filter Bar */}
        <div className="templates-filters">
          <div className="search-box-templates">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-templates"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select-templates"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {hasFilters && filteredTemplates.length > 0 && (
          <div className="filter-info">
            Showing {filteredTemplates.length} of {templates.length} templates
            <button onClick={() => { setSearchTerm(''); setFilterCategory('all'); }} className="clear-filters-link">
              Clear filters
            </button>
          </div>
        )}

        <div className="templates-list">
          {filteredTemplates.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">📝</p>
              <p className="empty-text">
                {hasFilters ? 'No templates match your search' : 'No templates yet'}
              </p>
              <p className="empty-hint">
                {hasFilters
                  ? 'Try adjusting your search or filters'
                  : 'When adding an expense, check "Save as template" to create reusable templates'
                }
              </p>
            </div>
          ) : (
            filteredTemplates.map(template => {
              const isExpanded = expandedId === template.id;
              return (
                <div key={template.id} className="template-card">
                  <div
                    className="template-header"
                    onClick={() => toggleExpanded(template.id)}
                  >
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
                        {template.useCount > 0 && (
                          <span className="template-badge usage">Used {template.useCount}x</span>
                        )}
                      </div>
                    </div>
                    <button className="expand-toggle" aria-label="Toggle details">
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="template-details">
                      <div className="template-amount">
                        <span className="amount-label">Planned Amount:</span>
                        <span className="amount-value">${(template.plannedAmount || 0).toFixed(2)}</span>
                      </div>
                      {template.notes && (
                        <div className="template-notes">
                          <span className="notes-icon">💬</span>
                          <span className="notes-text">{template.notes}</span>
                        </div>
                      )}
                      {template.lastUsed && (
                        <div className="template-last-used">
                          <span className="last-used-label">Last used:</span>
                          <span className="last-used-date">
                            {new Date(template.lastUsed).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="template-actions">
                    <button
                      onClick={() => handleQuickUse(template)}
                      className="btn-primary btn-small"
                    >
                      ✨ Use Now
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="btn-secondary btn-small"
                    >
                      ✏️ Edit
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
              );
            })
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
