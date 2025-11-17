import React, { useState, useRef, useEffect } from 'react';
import './MultiSelect.css';

const MultiSelect = ({ options, selected, onChange, placeholder = 'Select...', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.value));
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === options.length) return 'All Selected';
    if (selected.length === 1) {
      const option = options.find(opt => opt.value === selected[0]);
      return option ? option.label : selected[0];
    }
    return `${selected.length} selected`;
  };

  const allSelected = selected.length === options.length;

  return (
    <div className="multi-select-container" ref={dropdownRef}>
      {label && <label className="multi-select-label">{label}</label>}

      <div className="multi-select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="multi-select-value">{getDisplayText()}</span>
        <div className="multi-select-icons">
          {selected.length > 0 && (
            <button
              className="multi-select-clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
          <span className={`multi-select-arrow ${isOpen ? 'open' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-header">
            <button
              className="multi-select-all-btn"
              onClick={handleSelectAll}
            >
              {allSelected ? '☑ Deselect All' : '☐ Select All'}
            </button>
          </div>
          <div className="multi-select-options">
            {options.map(option => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggle(option.value)}
                >
                  <span className="multi-select-checkbox">
                    {isSelected ? '☑' : '☐'}
                  </span>
                  <span className="multi-select-option-label">{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
