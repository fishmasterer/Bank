import React, { useState } from 'react';
import './DateRangePicker.css';

const DateRangePicker = ({ startYear, startMonth, endYear, endMonth, onRangeChange, onClose }) => {
  const [fromYear, setFromYear] = useState(startYear);
  const [fromMonth, setFromMonth] = useState(startMonth);
  const [toYear, setToYear] = useState(endYear);
  const [toMonth, setToMonth] = useState(toMonth);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i); // 5 years back, 5 years forward
  const months = [
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

  const handleApply = () => {
    // Validate: "from" should be before or equal to "to"
    const fromDate = new Date(fromYear, fromMonth - 1);
    const toDate = new Date(toYear, toMonth - 1);

    if (fromDate > toDate) {
      alert('Start date must be before or equal to end date');
      return;
    }

    onRangeChange({ fromYear, fromMonth, toYear, toMonth });
    onClose();
  };

  const handleQuickSelect = (months) => {
    const today = new Date();
    const endY = today.getFullYear();
    const endM = today.getMonth() + 1;

    const startDate = new Date(endY, endM - months - 1);
    const startY = startDate.getFullYear();
    const startM = startDate.getMonth() + 1;

    setFromYear(startY);
    setFromMonth(startM);
    setToYear(endY);
    setToMonth(endM);
  };

  return (
    <div className="date-range-picker-overlay" onClick={onClose}>
      <div className="date-range-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="date-range-header">
          <h3>📅 Select Date Range</h3>
          <button onClick={onClose} className="date-range-close" aria-label="Close">
            ×
          </button>
        </div>

        <div className="date-range-content">
          {/* Quick Select Buttons */}
          <div className="quick-select-section">
            <p className="quick-select-label">Quick Select:</p>
            <div className="quick-select-buttons">
              <button onClick={() => handleQuickSelect(1)} className="quick-select-btn">
                Last Month
              </button>
              <button onClick={() => handleQuickSelect(3)} className="quick-select-btn">
                Last 3 Months
              </button>
              <button onClick={() => handleQuickSelect(6)} className="quick-select-btn">
                Last 6 Months
              </button>
              <button onClick={() => handleQuickSelect(12)} className="quick-select-btn">
                Last Year
              </button>
            </div>
          </div>

          {/* From Date */}
          <div className="date-range-section">
            <label className="date-range-label">From:</label>
            <div className="date-range-selects">
              <select
                value={fromMonth}
                onChange={(e) => setFromMonth(parseInt(e.target.value))}
                className="date-range-select"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={fromYear}
                onChange={(e) => setFromYear(parseInt(e.target.value))}
                className="date-range-select"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* To Date */}
          <div className="date-range-section">
            <label className="date-range-label">To:</label>
            <div className="date-range-selects">
              <select
                value={toMonth}
                onChange={(e) => setToMonth(parseInt(e.target.value))}
                className="date-range-select"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={toYear}
                onChange={(e) => setToYear(parseInt(e.target.value))}
                className="date-range-select"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="date-range-preview">
            <span className="preview-label">Selected Range:</span>
            <span className="preview-value">
              {months.find(m => m.value === fromMonth).label} {fromYear} - {months.find(m => m.value === toMonth).label} {toYear}
            </span>
          </div>
        </div>

        <div className="date-range-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleApply} className="btn-apply">
            Apply Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
