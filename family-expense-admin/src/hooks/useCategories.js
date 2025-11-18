import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

// Fallback categories if Firestore is empty or fails
const DEFAULT_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent/Mortgage',
  'Transportation',
  'Healthcare',
  'Education',
  'Entertainment',
  'Insurance',
  'Dining Out',
  'Shopping',
  'Other'
];

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [categoriesWithMeta, setCategoriesWithMeta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // Use default categories if none exist
          setCategories(DEFAULT_CATEGORIES);
          setCategoriesWithMeta(DEFAULT_CATEGORIES.map(name => ({
            name,
            icon: '📌',
            color: '#78716c'
          })));
        } else {
          const cats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCategoriesWithMeta(cats);
          setCategories(cats.map(c => c.name));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading categories:', err);
        setError(err);
        // Fallback to defaults on error
        setCategories(DEFAULT_CATEGORIES);
        setCategoriesWithMeta(DEFAULT_CATEGORIES.map(name => ({
          name,
          icon: '📌',
          color: '#78716c'
        })));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getCategoryMeta = (categoryName) => {
    return categoriesWithMeta.find(c => c.name === categoryName) || {
      name: categoryName,
      icon: '📌',
      color: '#78716c'
    };
  };

  return {
    categories,
    categoriesWithMeta,
    loading,
    error,
    getCategoryMeta
  };
};

export default useCategories;
