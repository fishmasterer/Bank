import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './ToastNotification.css';

const ToastNotification = () => {
  const { activeToast, dismissToast } = useNotifications();

  useEffect(() => {
    if (!activeToast) return;

    // Add entrance animation class
    const timer = setTimeout(() => {
      const toast = document.querySelector('.toast-notification');
      if (toast) {
        toast.classList.add('show');
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const getPriorityClass = () => {
    if (activeToast.priority === 'high') return 'priority-high';
    if (activeToast.priority === 'medium') return 'priority-medium';
    return 'priority-low';
  };

  const handleDismiss = () => {
    const toast = document.querySelector('.toast-notification');
    if (toast) {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        dismissToast();
      }, 300);
    } else {
      dismissToast();
    }
  };

  return (
    <div className={`toast-notification ${getPriorityClass()}`}>
      <div className="toast-icon">{activeToast.icon}</div>
      <div className="toast-content">
        <h4 className="toast-title">{activeToast.title}</h4>
        <p className="toast-message">{activeToast.message}</p>
      </div>
      <button
        className="toast-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

export default ToastNotification;
