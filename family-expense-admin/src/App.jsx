import React, { useState, useRef } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuthorization } from './hooks/useAuthorization';
import { useToast } from './hooks/useToast';
import SummaryView from './components/SummaryView';
import DetailedView from './components/DetailedView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ExpenseForm from './components/ExpenseForm';
import BudgetSettings from './components/BudgetSettings';
import CategoryBudgetSettings from './components/CategoryBudgetSettings';
import BudgetVarianceReport from './components/BudgetVarianceReport';
import FamilyMembersModal from './components/FamilyMembersModal';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import Unauthorized from './components/Unauthorized';
import ThemePicker from './components/ThemePicker';
import Toast from './components/Toast';
import NotificationBell from './components/NotificationBell';
import ToastNotification from './components/ToastNotification';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import ExportModal from './components/ExportModal';
import './App.css';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showForm, setShowForm] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showCategoryBudgets, setShowCategoryBudgets] = useState(false);
  const [showVarianceReport, setShowVarianceReport] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [pageAnimation, setPageAnimation] = useState('');
  const prevTabRef = useRef('summary');

  const tabOrder = ['summary', 'detailed', 'analytics'];

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;

    const prevIndex = tabOrder.indexOf(prevTabRef.current);
    const newIndex = tabOrder.indexOf(newTab);

    // Set animation direction based on tab order
    setPageAnimation(newIndex > prevIndex ? 'page-slide-left' : 'page-slide-right');
    prevTabRef.current = newTab;
    setActiveTab(newTab);

    // Reset animation class after animation completes
    setTimeout(() => setPageAnimation(''), 400);
  };

  const { currentUser, loading: authLoading } = useAuth();
  const { isAuthorized, loading: authorizationLoading } = useAuthorization(currentUser);
  const { expenses, familyMembers, loading, error, readOnly, copyRecurringExpenses } = useExpenses();
  const { toasts, hideToast, success, error: showError, info } = useToast();

  // Show loading state while checking authentication
  if (authLoading || authorizationLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  // Show unauthorized if user is not in authorized users list
  if (isAuthorized === false) {
    return <Unauthorized />;
  }

  const handleAddExpense = () => {
    if (readOnly) return;
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    if (readOnly) return;
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleCopyRecurring = async () => {
    if (readOnly) return;

    try {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const count = await copyRecurringExpenses(prevYear, prevMonth, selectedYear, selectedMonth);

      if (count > 0) {
        success(`Copied ${count} recurring expense${count > 1 ? 's' : ''} from last month`);
      } else {
        info('No recurring expenses found in the previous month');
      }
    } catch (err) {
      showError('Failed to copy recurring expenses');
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <p className="error-hint">Please check your Firebase configuration in the .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-content">
          <h1>💰 Family Expense Tracker</h1>
          <p className="subtitle">
            {readOnly
              ? 'View family expenses transparently'
              : 'Track and manage family expenses transparently'}
          </p>
        </div>
        <div className="header-actions">
          <NotificationBell />
          <ThemePicker />
          <UserProfile />
        </div>
      </header>

      <div className="controls">
        <div className="month-selector">
          <button
            onClick={() => {
              if (selectedMonth === 1) {
                setSelectedMonth(12);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
            className="btn-nav"
          >
            ◀
          </button>
          <span className="current-month">{monthName}</span>
          <button
            onClick={() => {
              if (selectedMonth === 12) {
                setSelectedMonth(1);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
            className="btn-nav"
          >
            ▶
          </button>
        </div>

        <div className="action-buttons">
          {!readOnly && (
            <>
              <button onClick={handleAddExpense} className="btn-primary btn-press hover-lift">
                + Add Expense
              </button>
              <button onClick={handleCopyRecurring} className="btn-secondary btn-press hover-lift">
                🔄 Copy Recurring
              </button>
              <button onClick={() => setShowBudgetSettings(true)} className="btn-secondary btn-press hover-lift">
                💰 Set Budget
              </button>
              <button onClick={() => setShowCategoryBudgets(true)} className="btn-secondary btn-press hover-lift">
                📊 Category Budgets
              </button>
              <button onClick={() => setShowFamilyModal(true)} className="btn-secondary btn-press hover-lift">
                👥 Manage Family
              </button>
            </>
          )}
          <button onClick={() => setShowVarianceReport(true)} className="btn-secondary btn-press hover-lift">
            📈 Budget Report
          </button>
          <button onClick={handleExport} className="btn-secondary btn-press hover-lift">
            📥 Export
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => handleTabChange('summary')}
        >
          Summary
        </button>
        <button
          className={`tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => handleTabChange('detailed')}
        >
          Detailed Breakdown
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          Analytics
        </button>
      </div>

      <main className={`main-content ${pageAnimation}`} key={activeTab}>
        {activeTab === 'summary' ? (
          <SummaryView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        ) : activeTab === 'detailed' ? (
          <DetailedView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onEditExpense={handleEditExpense}
            onAddExpense={handleAddExpense}
          />
        ) : (
          <AnalyticsDashboard
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        )}
      </main>

      {showForm && !readOnly && (
        <ExpenseForm
          editingExpense={editingExpense}
          onClose={handleCloseForm}
          onSuccess={(message) => success(message)}
          onError={(message) => showError(message)}
        />
      )}

      {showBudgetSettings && !readOnly && (
        <BudgetSettings
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onClose={() => setShowBudgetSettings(false)}
          onSuccess={(message) => success(message)}
          onError={(message) => showError(message)}
        />
      )}

      {showCategoryBudgets && !readOnly && (
        <CategoryBudgetSettings
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onClose={() => setShowCategoryBudgets(false)}
          onSuccess={(message) => success(message)}
          onError={(message) => showError(message)}
        />
      )}

      {showFamilyModal && !readOnly && (
        <FamilyMembersModal
          onClose={() => setShowFamilyModal(false)}
          onSuccess={(message) => success(message)}
          onError={(message) => showError(message)}
        />
      )}

      {showVarianceReport && (
        <BudgetVarianceReport
          isOpen={showVarianceReport}
          onClose={() => setShowVarianceReport(false)}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSuccess={(message) => success(message)}
        onError={(message) => showError(message)}
      />

      <ToastNotification />

      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      {/* Floating Action Button (Mobile only) */}
      {!readOnly && (
        <button
          onClick={handleAddExpense}
          className="fab"
          aria-label="Add expense"
          title="Add expense"
        >
          +
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => handleTabChange('summary')}
        >
          <span className="icon">📊</span>
          <span>Summary</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => handleTabChange('detailed')}
        >
          <span className="icon">📋</span>
          <span>Details</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => handleTabChange('analytics')}
        >
          <span className="icon">📈</span>
          <span>Analytics</span>
        </button>
      </nav>

      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </div>
  );
};

function App({ readOnly = false }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ExpenseProvider readOnly={readOnly}>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ExpenseProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
