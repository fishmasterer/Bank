import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

const STORAGE_KEY = 'expense-notifications';
const SETTINGS_KEY = 'notification-settings';

const DEFAULT_SETTINGS = {
  budgetAlerts: true,
  expenseActions: true,
  monthlySummary: true,
  toastsEnabled: true
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeToast, setActiveToast] = useState(null);

  // Load notifications and settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }

      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const addNotification = (notification) => {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast if enabled and toasts are enabled
    if (settings.toastsEnabled && notification.showToast !== false) {
      setActiveToast(newNotification);

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => {
        setActiveToast(prev => prev?.id === newNotification.id ? null : prev);
      }, 5000);
    }

    return newNotification.id;
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Helper: Add budget alert notification
  const addBudgetAlert = (category, spent, limit, status) => {
    if (!settings.budgetAlerts) return;

    let icon = '⚠️';
    let title = 'Budget Warning';
    let message = '';
    let priority = 'medium';
    let type = 'budget_warning';

    if (status === 'exceeded') {
      icon = '❌';
      title = 'Budget Exceeded';
      message = `${category}: Spent $${spent.toFixed(0)} of $${limit.toFixed(0)} budget`;
      priority = 'high';
      type = 'budget_exceeded';
    } else if (status === 'critical') {
      icon = '🚨';
      title = 'Budget Critical';
      message = `${category}: $${(limit - spent).toFixed(0)} remaining (${((spent / limit) * 100).toFixed(0)}% used)`;
      priority = 'high';
      type = 'budget_critical';
    } else if (status === 'warning') {
      icon = '⚠️';
      title = 'Budget Warning';
      message = `${category}: $${(limit - spent).toFixed(0)} remaining (${((spent / limit) * 100).toFixed(0)}% used)`;
      priority = 'medium';
      type = 'budget_warning';
    }

    return addNotification({
      type,
      icon,
      title,
      message,
      priority,
      category,
      metadata: { spent, limit, status }
    });
  };

  // Helper: Add expense action notification
  const addExpenseAction = (action, expenseName, category) => {
    if (!settings.expenseActions) return;

    let icon = '✓';
    let title = '';
    let message = '';

    switch (action) {
      case 'added':
        icon = '✓';
        title = 'Expense Added';
        message = `${expenseName} added to ${category}`;
        break;
      case 'updated':
        icon = '✓';
        title = 'Expense Updated';
        message = `${expenseName} updated in ${category}`;
        break;
      case 'deleted':
        icon = '🗑️';
        title = 'Expense Deleted';
        message = `${expenseName} removed from ${category}`;
        break;
      default:
        return;
    }

    return addNotification({
      type: `expense_${action}`,
      icon,
      title,
      message,
      priority: 'low',
      category
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = {
    notifications,
    unreadCount,
    activeToast,
    settings,
    addNotification,
    addBudgetAlert,
    addExpenseAction,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    dismissToast,
    updateSettings
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
