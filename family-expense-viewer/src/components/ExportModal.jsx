import { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { exportToCSV } from '../utils/exportData';
import { exportToExcel } from '../utils/exportToExcel';
import { exportToPDF } from '../utils/exportToPDF';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, selectedYear, selectedMonth }) => {
  const { expenses, familyMembers } = useExpenses();
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Date range state
  const [useDateRange, setUseDateRange] = useState(false);
  const [startYear, setStartYear] = useState(selectedYear);
  const [startMonth, setStartMonth] = useState(selectedMonth);
  const [endYear, setEndYear] = useState(selectedYear);
  const [endMonth, setEndMonth] = useState(selectedMonth);

  // Member selection state
  const [selectedMembers, setSelectedMembers] = useState(
    familyMembers.map(m => m.id)
  );

  // Generate year options (last 5 years + current + next)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  if (!isOpen) return null;

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        // Don't allow deselecting all members
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSelectAllMembers = () => {
    setSelectedMembers(familyMembers.map(m => m.id));
  };

  const handleDeselectAllMembers = () => {
    // Keep at least one member selected
    if (familyMembers.length > 0) {
      setSelectedMembers([familyMembers[0].id]);
    }
  };

  const getDateRangeLabel = () => {
    if (!useDateRange) {
      return new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }

    const start = new Date(startYear, startMonth - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    const end = new Date(endYear, endMonth - 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    return `${start} - ${end}`;
  };

  const handleExport = async () => {
    setExporting(true);
    setExportStatus(null);

    try {
      const dateLabel = getDateRangeLabel();

      // Prepare export options
      const exportOptions = {
        useDateRange,
        startYear: useDateRange ? startYear : selectedYear,
        startMonth: useDateRange ? startMonth : selectedMonth,
        endYear: useDateRange ? endYear : selectedYear,
        endMonth: useDateRange ? endMonth : selectedMonth,
        selectedMembers
      };

      switch (selectedFormat) {
        case 'csv':
          exportToCSV(expenses, familyMembers, exportOptions);
          setExportStatus({ type: 'success', message: `CSV exported for ${dateLabel}` });
          break;

        case 'excel':
          // Pass null for budgets since viewer doesn't have budget data
          exportToExcel(expenses, familyMembers, null, null, exportOptions);
          setExportStatus({ type: 'success', message: `Excel exported for ${dateLabel}` });
          break;

        case 'pdf':
          // Pass null for budgets since viewer doesn't have budget data
          exportToPDF(expenses, familyMembers, null, null, exportOptions);
          setExportStatus({ type: 'success', message: `PDF exported for ${dateLabel}` });
          break;

        default:
          throw new Error('Invalid export format');
      }

      // Close modal after successful export
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Export error:', err);
      setExportStatus({ type: 'error', message: `Failed to export: ${err.message}` });
    } finally {
      setExporting(false);
    }
  };

  const formats = [
    {
      id: 'excel',
      icon: '#',
      name: 'Excel (XLSX)',
      description: 'Rich spreadsheet with multiple sheets and formatting',
      features: ['Multiple sheets', 'Category breakdown', 'Member summary', 'Monthly data']
    },
    {
      id: 'pdf',
      icon: '[]',
      name: 'PDF Report',
      description: 'Professional report with tables and visual summaries',
      features: ['Print-ready', 'Summary cards', 'Detailed tables', 'Category analysis']
    },
    {
      id: 'csv',
      icon: ',',
      name: 'CSV (Simple)',
      description: 'Basic spreadsheet format compatible with all applications',
      features: ['Universal format', 'Lightweight', 'Quick export', 'Easy import']
    }
  ];

  return (
    <>
      <div className="export-overlay" onClick={onClose} />
      <div className="export-modal">
        <div className="export-header">
          <h2>Export Expenses</h2>
          <button className="export-close-btn" onClick={onClose}>x</button>
        </div>

        <div className="export-body">
          {/* Status Message */}
          {exportStatus && (
            <div className={`export-status ${exportStatus.type}`}>
              {exportStatus.message}
            </div>
          )}

          {/* Date Range Selection */}
          <div className="export-section">
            <div className="section-header">
              <h3>Date Range</h3>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={useDateRange}
                  onChange={(e) => setUseDateRange(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Custom Range</span>
              </label>
            </div>

            {useDateRange ? (
              <div className="date-range-selectors">
                <div className="date-selector">
                  <label>From:</label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                  >
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value))}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="date-selector">
                  <label>To:</label>
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(Number(e.target.value))}
                  >
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(Number(e.target.value))}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="current-selection">
                Exporting: <strong>{getDateRangeLabel()}</strong>
              </p>
            )}
          </div>

          {/* Member Selection */}
          <div className="export-section">
            <div className="section-header">
              <h3>Family Members</h3>
              <div className="member-actions">
                <button
                  className="btn-link"
                  onClick={handleSelectAllMembers}
                  disabled={selectedMembers.length === familyMembers.length}
                >
                  Select All
                </button>
                <span className="divider">|</span>
                <button
                  className="btn-link"
                  onClick={handleDeselectAllMembers}
                  disabled={selectedMembers.length === 1}
                >
                  Select One
                </button>
              </div>
            </div>

            <div className="member-checkboxes">
              {familyMembers.map(member => (
                <label key={member.id} className="member-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                  />
                  <span
                    className="member-color-dot"
                    style={{ backgroundColor: '#06B6D4' }}
                  ></span>
                  <span className="member-name">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="export-section">
            <h3>Export Format</h3>
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
                      <h4>{format.name}</h4>
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
                        * {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="export-footer">
          <button className="btn-secondary" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : `Export as ${formats.find(f => f.id === selectedFormat)?.name}`}
          </button>
        </div>
      </div>
    </>
  );
};

export default ExportModal;
