import { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { exportToCSV } from '../utils/exportData';
import { exportToExcel } from '../utils/exportToExcel';
import { exportToPDF } from '../utils/exportToPDF';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, selectedYear, selectedMonth, onSuccess, onError }) => {
  const { expenses, familyMembers, budgets, categoryBudgets } = useExpenses();
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);

    try {
      const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      switch (selectedFormat) {
        case 'csv':
          exportToCSV(expenses, familyMembers, selectedYear, selectedMonth);
          onSuccess(`CSV exported successfully for ${monthName}`);
          break;

        case 'excel':
          exportToExcel(expenses, familyMembers, budgets, categoryBudgets, selectedYear, selectedMonth);
          onSuccess(`Excel report exported successfully for ${monthName}`);
          break;

        case 'pdf':
          exportToPDF(expenses, familyMembers, budgets, categoryBudgets, selectedYear, selectedMonth);
          onSuccess(`PDF report exported successfully for ${monthName}`);
          break;

        default:
          throw new Error('Invalid export format');
      }

      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export error:', err);
      onError(`Failed to export: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const formats = [
    {
      id: 'excel',
      icon: '📊',
      name: 'Excel (XLSX)',
      description: 'Rich spreadsheet with multiple sheets, formulas, and formatting',
      features: ['Multiple sheets', 'Budget analysis', 'Category breakdown', 'Member summary']
    },
    {
      id: 'pdf',
      icon: '📄',
      name: 'PDF Report',
      description: 'Professional report with tables and visual summaries',
      features: ['Print-ready', 'Summary cards', 'Detailed tables', 'Category analysis']
    },
    {
      id: 'csv',
      icon: '📋',
      name: 'CSV (Simple)',
      description: 'Basic spreadsheet format compatible with all applications',
      features: ['Universal format', 'Lightweight', 'Quick export', 'Easy import']
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Expenses</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="export-subtitle">
            Choose your export format for{' '}
            <strong>
              {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </strong>
          </p>

          <div className="format-options">
            {formats.map((format) => (
              <div
                key={format.id}
                className={`format-card ${selectedFormat === format.id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(format.id)}
              >
                <div className="format-header">
                  <div className="format-icon">{format.icon}</div>
                  <div className="format-info">
                    <h3>{format.name}</h3>
                    <p>{format.description}</p>
                  </div>
                  <div className="format-radio">
                    <input
                      type="radio"
                      name="format"
                      checked={selectedFormat === format.id}
                      onChange={() => setSelectedFormat(format.id)}
                    />
                  </div>
                </div>
                <div className="format-features">
                  {format.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '⏳ Exporting...' : `📥 Export as ${formats.find(f => f.id === selectedFormat)?.name}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
