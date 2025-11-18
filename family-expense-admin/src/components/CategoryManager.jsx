import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import './CategoryManager.css';

// Default categories to seed for new users
const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: '🛒', color: '#22c55e' },
  { name: 'Utilities', icon: '💡', color: '#3b82f6' },
  { name: 'Rent/Mortgage', icon: '🏠', color: '#8b5cf6' },
  { name: 'Transportation', icon: '🚗', color: '#f59e0b' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444' },
  { name: 'Education', icon: '📚', color: '#06b6d4' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Insurance', icon: '🛡️', color: '#6366f1' },
  { name: 'Dining Out', icon: '🍽️', color: '#f97316' },
  { name: 'Shopping', icon: '🛍️', color: '#14b8a6' },
  { name: 'Other', icon: '📌', color: '#78716c' }
];

const ICON_OPTIONS = ['🛒', '💡', '🏠', '🚗', '🏥', '📚', '🎬', '🛡️', '🍽️', '🛍️', '📌', '💰', '🎮', '👕', '✈️', '🎁', '💼', '🔧', '🌐', '📱'];
const COLOR_OPTIONS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1', '#f97316', '#14b8a6', '#78716c', '#a855f7'];

const CategoryManager = ({ onClose, onSuccess, onError }) => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', icon: '📌', color: '#78716c' });
  const [saving, setSaving] = useState(false);

  // Load categories from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('name'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no categories exist, seed with defaults
      if (cats.length === 0 && loading) {
        try {
          for (const cat of DEFAULT_CATEGORIES) {
            await addDoc(categoriesRef, {
              ...cat,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('Error seeding categories:', err);
        }
      } else {
        setCategories(cats);
      }

      setLoading(false);
    }, (error) => {
      console.error('Error loading categories:', error);
      setLoading(false);
      onError?.('Failed to load categories');
    });

    return () => unsubscribe();
  }, [currentUser, loading, onError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onError?.('Category name is required');
      return;
    }

    // Check for duplicates
    const isDuplicate = categories.some(
      cat => cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
             cat.id !== editingCategory?.id
    );

    if (isDuplicate) {
      onError?.('A category with this name already exists');
      return;
    }

    setSaving(true);

    try {
      if (editingCategory) {
        // Update existing
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          updatedAt: new Date().toISOString()
        });
        onSuccess?.('Category updated');
      } else {
        // Add new
        await addDoc(collection(db, 'categories'), {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          createdAt: new Date().toISOString()
        });
        onSuccess?.('Category added');
      }

      resetForm();
    } catch (err) {
      console.error('Error saving category:', err);
      onError?.('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This won't affect existing expenses.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', category.id));
      onSuccess?.('Category deleted');
    } catch (err) {
      console.error('Error deleting category:', err);
      onError?.('Failed to delete category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '📌',
      color: category.color || '#78716c'
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '📌', color: '#78716c' });
    setEditingCategory(null);
    setIsAdding(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="category-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="category-manager-content">
          {/* Add/Edit Form */}
          {isAdding ? (
            <form onSubmit={handleSubmit} className="category-form">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>

              <div className="form-group">
                <label htmlFor="cat-name">Name *</label>
                <input
                  type="text"
                  id="cat-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pet Supplies"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {ICON_OPTIONS.map(icon => (
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
                  <label>Color</label>
                  <div className="color-picker">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="btn-add-category"
            >
              + Add New Category
            </button>
          )}

          {/* Categories List */}
          <div className="categories-list">
            <h3>Categories ({categories.length})</h3>

            {loading ? (
              <div className="loading-state">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="empty-state">No categories yet</div>
            ) : (
              <div className="category-items">
                {categories.map(category => (
                  <div key={category.id} className="category-item">
                    <div className="category-preview">
                      <span
                        className="category-icon"
                        style={{ backgroundColor: category.color || '#78716c' }}
                      >
                        {category.icon || '📌'}
                      </span>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <div className="category-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="btn-icon edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="btn-icon delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
