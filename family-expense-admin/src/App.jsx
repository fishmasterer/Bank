import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useAuthorization } from './hooks/useAuthorization';
import { useToast } from './hooks/useToast';
import useSwipeGesture from './hooks/useSwipeGesture';
import useScrollDirection from './hooks/useScrollDirection';
import useDeepLinking from './hooks/useDeepLinking';
import useScrollPersistence from './hooks/useScrollPersistence';
import useRipple from './hooks/useRipple';
import useSharedElementTransition from './hooks/useSharedElementTransition';
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
import MemberBudgetSettings from './components/MemberBudgetSettings';
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
  const [showMemberBudgets, setShowMemberBudgets] = useState(false);
  const [showVarianceReport, setShowVarianceReport] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [pageAnimation, setPageAnimation] = useState('');
  const [edgeBounce, setEdgeBounce] = useState(null); // 'left' or 'right' for edge bounce
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });
  const prevTabRef = useRef('summary');
  const navRef = useRef(null);
  const prevMonthRef = useRef({ month: selectedMonth, year: selectedYear });
  const initialLoadRef = useRef(true);
  const createRipple = useRipple();
  const {
    startTransition,
    endTransition,
    getTransitionStyles,
    isTransitioning
  } = useSharedElementTransition();

  // Track scroll direction for auto-hide bottom nav
  const { scrollDirection, isAtTop } = useScrollDirection(15);

  // Deep linking for shareable URLs and back button support
  useDeepLinking({
    activeTab,
    setActiveTab,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    tabOrder: TAB_ORDER
  });

  // Persist scroll positions between tab switches
  useScrollPersistence(activeTab, TAB_ORDER);

  // Update tab indicator position
  useEffect(() => {
    if (navRef.current) {
      const activeIndex = TAB_ORDER.indexOf(activeTab);
      const navItems = navRef.current.querySelectorAll('.bottom-nav-item');
      if (navItems[activeIndex]) {
        const item = navItems[activeIndex];
        const navRect = navRef.current.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        setTabIndicator({
          left: itemRect.left - navRect.left,
          width: itemRect.width
        });
      }
    }
  }, [activeTab]);

  const handleTabChange = useCallback((newTab) => {
    if (newTab === activeTab) return;

    const prevIndex = TAB_ORDER.indexOf(prevTabRef.current);
    const newIndex = TAB_ORDER.indexOf(newTab);

    // Set animation direction based on tab order
    setPageAnimation(newIndex > prevIndex ? 'page-slide-left' : 'page-slide-right');
    prevTabRef.current = newTab;
    setActiveTab(newTab);

    // Reset animation class after animation completes
    setTimeout(() => setPageAnimation(''), 450);
  }, [activeTab]);

  // Swipe gesture handlers for tab navigation with edge bounce
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[currentIndex + 1]);
    } else {
      // Trigger edge bounce effect at right boundary
      setEdgeBounce('right');
      setTimeout(() => setEdgeBounce(null), 500);
    }
  }, [activeTab, handleTabChange]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      handleTabChange(TAB_ORDER[currentIndex - 1]);
    } else {
      // Trigger edge bounce effect at left boundary
      setEdgeBounce('left');
      setTimeout(() => setEdgeBounce(null), 500);
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
  const { expenses, familyMembers, loading, error, readOnly, copyRecurringExpenses, getMonthlyTotal, budget } = useExpenses();
  const { toasts, hideToast, success, error: showError, info } = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      // Check if any modal is open
      const anyModalOpen = showForm || showBudgetSettings || showCategoryBudgets ||
        showMemberBudgets || showVarianceReport || showFamilyModal || showExportModal;

      switch (e.key) {
        case 'Escape':
          // Close any open modal
          if (showForm) setShowForm(false);
          else if (showBudgetSettings) setShowBudgetSettings(false);
          else if (showCategoryBudgets) setShowCategoryBudgets(false);
          else if (showMemberBudgets) setShowMemberBudgets(false);
          else if (showVarianceReport) setShowVarianceReport(false);
          else if (showFamilyModal) setShowFamilyModal(false);
          else if (showExportModal) setShowExportModal(false);
          break;
        case 'n':
        case 'N':
          if (!anyModalOpen && !readOnly) {
            e.preventDefault();
            setEditingExpense(null);
            setShowForm(true);
          }
          break;
        case 'b':
        case 'B':
          if (!anyModalOpen && !readOnly) {
            e.preventDefault();
            setShowBudgetSettings(true);
          }
          break;
        case 'ArrowLeft':
          if (!anyModalOpen) {
            e.preventDefault();
            if (selectedMonth === 1) {
              setSelectedMonth(12);
              setSelectedYear(selectedYear - 1);
            } else {
              setSelectedMonth(selectedMonth - 1);
            }
          }
          break;
        case 'ArrowRight':
          if (!anyModalOpen) {
            e.preventDefault();
            if (selectedMonth === 12) {
              setSelectedMonth(1);
              setSelectedYear(selectedYear + 1);
            } else {
              setSelectedMonth(selectedMonth + 1);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showBudgetSettings, showCategoryBudgets, showMemberBudgets,
      showVarianceReport, showFamilyModal, showExportModal, readOnly,
      selectedMonth, selectedYear]);

  // Month summary toast when navigating months
  useEffect(() => {
    // Skip on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Check if month actually changed
    const prev = prevMonthRef.current;
    if (prev.month === selectedMonth && prev.year === selectedYear) {
      return;
    }

    // Update ref
    prevMonthRef.current = { month: selectedMonth, year: selectedYear };

    // Wait for data to load
    if (loading) return;

    // Calculate summary
    const spent = getMonthlyTotal(selectedYear, selectedMonth);
    const budgetLimit = budget?.limit || budget?.monthlyLimit || 0;

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    let summaryMessage = `${monthName}: $${spent.toFixed(0)} spent`;

    if (budgetLimit > 0) {
      const remaining = budgetLimit - spent;
      const percentUsed = (spent / budgetLimit) * 100;

      if (remaining >= 0) {
        summaryMessage += ` • $${remaining.toFixed(0)} remaining (${percentUsed.toFixed(0)}%)`;
      } else {
        summaryMessage += ` • $${Math.abs(remaining).toFixed(0)} over budget`;
      }
    }

    info(summaryMessage);
  }, [selectedMonth, selectedYear, loading, getMonthlyTotal, budget, info]);

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

  const handleEditExpense = (expense, sourceElement = null) => {
    if (readOnly) return;
    if (sourceElement) {
      startTransition(sourceElement);
    }
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExpense(null);
    endTransition();
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
              <button onClick={() => setShowMemberBudgets(true)} className="btn-secondary btn-press hover-lift">
                👤 Member Budgets
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
              onSuccess={(message) => success(message)}
              onError={(message) => showError(message)}
              onOpenMemberBudgets={() => setShowMemberBudgets(true)}
            />
          )}
          {activeTab === 'recurring' && (
            <RecurringSection
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onEditExpense={handleEditExpense}
              onSuccess={(message) => success(message)}
              onError={(message) => showError(message)}
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
          transitionClass={isTransitioning ? 'shared-transition' : ''}
          transitionStyle={isTransitioning ? getTransitionStyles(true) : {}}
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

      {showMemberBudgets && !readOnly && (
        <MemberBudgetSettings
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onClose={() => setShowMemberBudgets(false)}
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
        onMemberBudgets={() => setShowMemberBudgets(true)}
        onManageFamily={() => setShowFamilyModal(true)}
        onBudgetReport={() => setShowVarianceReport(true)}
        onExport={handleExport}
        readOnly={readOnly}
        bottomNavHidden={scrollDirection === 'down' && !isAtTop}
      />

      {/* Mobile Bottom Navigation */}
      <nav
        ref={navRef}
        className={`bottom-nav ${scrollDirection === 'down' && !isAtTop ? 'hidden' : ''}`}
      >
        <div
          className="bottom-nav-indicator"
          style={{
            left: tabIndicator.left,
            width: tabIndicator.width
          }}
        />
        {TAB_ORDER.map((tab) => (
          <button
            key={tab}
            className={`bottom-nav-item ripple-container ${activeTab === tab ? 'active' : ''}`}
            onClick={(e) => {
              createRipple(e, true);
              handleTabChange(tab);
            }}
          >
            <span className={`icon ${activeTab === tab ? 'icon-active' : ''}`}>
              {TAB_CONFIG[tab].icon}
            </span>
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
        <CurrencyProvider>
          <ExpenseProvider readOnly={readOnly}>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </ExpenseProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
