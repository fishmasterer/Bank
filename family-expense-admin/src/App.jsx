import React, { useState } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import SummaryView from './components/SummaryView';
import DetailedView from './components/DetailedView';
import ExpenseForm from './components/ExpenseForm';
import InstallPrompt from './components/InstallPrompt';
import Login from './components/Login';
import Settings from './components/Settings';
import { exportToCSV } from './utils/exportData';
import './App.css';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { expenses, familyMembers, loading, error, readOnly } = useExpenses();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
    exportToCSV(expenses, familyMembers, selectedYear, selectedMonth);
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
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>💰 Family Expense Tracker</h1>
            <p className="subtitle">
              {readOnly
                ? 'View family expenses transparently'
                : 'Track and manage family expenses transparently'}
            </p>
          </div>
          {user && (
            <div className="user-profile">
              <button
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={user.email}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} />
                ) : (
                  <span>{user.displayName?.[0] || user.email?.[0] || '?'}</span>
                )}
              </button>
              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <p className="user-name">{user.displayName || 'User'}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    className="btn-settings-menu"
                  >
                    ⚙️ Settings
                  </button>
                  <button onClick={handleSignOut} className="btn-signout">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
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
            <button onClick={handleAddExpense} className="btn-primary">
              + Add Expense
            </button>
          )}
          <button onClick={handleExport} className="btn-secondary">
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`tab ${activeTab === 'detailed' ? 'active' : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          Detailed Breakdown
        </button>
      </div>

      <main className="main-content">
        {activeTab === 'summary' ? (
          <SummaryView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
          />
        ) : (
          <DetailedView
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onEditExpense={handleEditExpense}
          />
        )}
      </main>

      {showForm && !readOnly && (
        <ExpenseForm
          editingExpense={editingExpense}
          onClose={handleCloseForm}
        />
      )}

      <InstallPrompt />

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

function App({ readOnly = false }) {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show main app if authenticated
  return (
    <ExpenseProvider readOnly={readOnly}>
      <AppContent />
    </ExpenseProvider>
  );
}

export default App;
