import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useRecurringTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const templatesRef = collection(db, 'recurringTemplates');
    const templatesQuery = query(templatesRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      templatesQuery,
      (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(templatesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching recurring templates:', err);
        setTemplates([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addTemplate = async (template) => {
    const templateData = {
      name: template.name,
      category: template.category,
      plannedAmount: template.plannedAmount || 0,
      paidBy: template.paidBy,
      dueDay: template.dueDay || 1, // Day of month when expense is due
      notes: template.notes || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'recurringTemplates'), templateData);
    return docRef.id;
  };

  const updateTemplate = async (templateId, updates) => {
    const templateRef = doc(db, 'recurringTemplates', templateId);
    await setDoc(templateRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const deleteTemplate = async (templateId) => {
    await deleteDoc(doc(db, 'recurringTemplates', templateId));
  };

  const toggleTemplateActive = async (templateId, isActive) => {
    await updateTemplate(templateId, { isActive });
  };

  const generateExpensesFromTemplates = async (year, month, addExpense, existingExpenses) => {
    const activeTemplates = templates.filter(t => t.isActive);
    let generatedCount = 0;

    for (const template of activeTemplates) {
      // Check if expense from this template already exists for this month
      const alreadyExists = existingExpenses.some(exp =>
        exp.templateId === template.id &&
        exp.year === year &&
        exp.month === month
      );

      if (!alreadyExists) {
        const expenseData = {
          name: template.name,
          category: template.category,
          plannedAmount: template.plannedAmount,
          paidAmount: 0,
          paidBy: template.paidBy,
          isRecurring: true,
          templateId: template.id,
          dueDay: template.dueDay,
          notes: template.notes,
          year,
          month
        };

        await addExpense(expenseData);
        generatedCount++;
      }
    }

    return generatedCount;
  };

  const getTemplatesByCategory = () => {
    const grouped = {};
    templates.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  };

  const getTotalPlannedFromTemplates = () => {
    return templates
      .filter(t => t.isActive)
      .reduce((sum, t) => sum + (t.plannedAmount || 0), 0);
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    generateExpensesFromTemplates,
    getTemplatesByCategory,
    getTotalPlannedFromTemplates
  };
};
