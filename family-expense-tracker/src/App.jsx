import React, { useState } from 'react';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import SummaryView from './components/SummaryView';
import DetailedView from './components/DetailedView';
import ExpenseForm from './components/ExpenseForm';
import { exportToCSV } from './utils/exportData';
import './App.css';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { expenses, familyMembers } = useExpenses();

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Family Expense Tracker</h1>
        <p className="subtitle">Track and manage family expenses transparently</p>
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
          <button onClick={handleAddExpense} className="btn-primary">
            + Add Expense
          </button>
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

      {showForm && (
        <ExpenseForm
          editingExpense={editingExpense}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <ExpenseProvider>
      <AppContent />
    </ExpenseProvider>
  );
}

export default App;
