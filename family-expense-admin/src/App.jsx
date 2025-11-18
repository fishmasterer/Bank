import React, { useState, useRef, useCallback } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuthorization } from './hooks/useAuthorization';
import { useToast } from './hooks/useToast';
import useSwipeGesture from './hooks/useSwipeGesture';
import useScrollDirection from './hooks/useScrollDirection';
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
import PullToRefresh from './components/PullToRefresh';
import FloatingActionMenu from './components/FloatingActionMenu';
import BudgetSection from './components/BudgetSection';
import RecurringSection from './components/RecurringSection';
import FamilySection from './components/FamilySection';
import './App.css';

// Tab order for navigation (6 sections for better mobile organization)
const TAB_ORDER = ['summary', 'expenses', 'budget', 'recurring', 'family', 'reports'];

// Tab display names and icons
const TAB_CONFIG = {
  summary: { label: 'Home', icon: '🏠', shortLabel: 'Home' },
  expenses: { label: 'Expenses', icon: '📋', shortLabel: 'Expenses' },
  budget: { label: 'Budget', icon: '💰', shortLabel: 'Budget' },
  recurring: { label: 'Recurring', icon: '🔄', shortLabel: 'Recurring' },
  family: { label: 'Family', icon: '👥', shortLabel: 'Family' },
  reports: { label: 'Reports', icon: '📊', shortLabel: 'Reports' }
};

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
  const [edgeBounce, setEdgeBounce] = useState(null); // 'left' or 'right' for edge bounce
  const prevTabRef = useRef('summary');

  // Track scroll direction for auto-hide bottom nav
  const { scrollDirection, isAtTop } = useScrollDirection(15);

  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;

    const prevIndex = TAB_ORDER.indexOf(prevTabRef.current);
    const newIndex = TAB_ORDER.indexOf(newTab);

    // Set animation direction based on tab order
    setPageAnimation(newIndex > prevIndex ? 'page-slide-left' : 'page-slide-right');
    prevTabRef.current = newTab;
    setActiveTab(newTab);

    // Reset animation class after animation completes
    setTimeout(() => setPageAnimation(''), 400);
  }, [activeTab]);

  // Swipe gesture handlers for tab navigation with edge bounce
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[currentIndex + 1]);
    } else {
      // Trigger edge bounce effect at right boundary
      setEdgeBounce('right');
      setTimeout(() => setEdgeBounce(null), 400);
    }
  }, [activeTab, handleTabChange]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabChange(TAB_ORDER[currentIndex - 1]);
    } else {
      // Trigger edge bounce effect at left boundary
      setEdgeBounce('left');
      setTimeout(() => setEdgeBounce(null), 400);
    }
  }, [activeTab, handleTabChange]);

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
    velocityThreshold: 0.3
  });

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

  const handlePullRefresh = async () => {
    // Simulate refresh - data is already real-time from Firebase
    await new Promise(resolve => setTimeout(resolve, 800));
    success('Data refreshed');
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
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="tab-icon">{TAB_CONFIG[tab].icon}</span>
            <span className="tab-label">{TAB_CONFIG[tab].label}</span>
          </button>
        ))}
      </div>

      {/* Swipe indicator dots for mobile */}
      <div className="swipe-indicator">
        {TAB_ORDER.map((tab) => (
          <span
            key={tab}
            className={`swipe-indicator-dot ${activeTab === tab ? 'active' : ''}`}
          />
        ))}
      </div>

      <PullToRefresh onRefresh={handlePullRefresh}>
        <main
          className={`main-content ${pageAnimation} ${edgeBounce ? `edge-bounce-${edgeBounce}` : ''}`}
          key={activeTab}
          {...swipeHandlers}
        >
          {activeTab === 'summary' && (
            <SummaryView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          )}
          {activeTab === 'expenses' && (
            <DetailedView
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onEditExpense={handleEditExpense}
              onAddExpense={handleAddExpense}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetSection
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onSetBudget={() => setShowBudgetSettings(true)}
              onCategoryBudgets={() => setShowCategoryBudgets(true)}
            />
          )}
          {activeTab === 'recurring' && (
            <RecurringSection
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onEditExpense={handleEditExpense}
              onCopyRecurring={handleCopyRecurring}
            />
          )}
          {activeTab === 'family' && (
            <FamilySection
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onManageFamily={() => setShowFamilyModal(true)}
            />
          )}
          {activeTab === 'reports' && (
            <AnalyticsDashboard
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
            />
          )}
        </main>
      </PullToRefresh>

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

      {/* Floating Action Menu (Mobile only) */}
      <FloatingActionMenu
        onAddExpense={handleAddExpense}
        onCopyRecurring={handleCopyRecurring}
        onSetBudget={() => setShowBudgetSettings(true)}
        onCategoryBudgets={() => setShowCategoryBudgets(true)}
        onManageFamily={() => setShowFamilyModal(true)}
        onBudgetReport={() => setShowVarianceReport(true)}
        onExport={handleExport}
        readOnly={readOnly}
        bottomNavHidden={scrollDirection === 'down' && !isAtTop}
      />

      {/* Mobile Bottom Navigation */}
      <nav className={`bottom-nav ${scrollDirection === 'down' && !isAtTop ? 'hidden' : ''}`}>
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            className={`bottom-nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="icon">{TAB_CONFIG[tab].icon}</span>
            <span>{TAB_CONFIG[tab].shortLabel}</span>
          </button>
        ))}
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
