import React, { useState, useEffect } from 'react';
import './FilterPresets.css';

const PRESETS_STORAGE_KEY = 'expense-filter-presets';

const FilterPresets = ({ currentFilters, onLoadPreset, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const savePresets = (updatedPresets) => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [...presets, newPreset];
    savePresets(updatedPresets);
    setPresetName('');
    setShowSaveForm(false);
  };

  const handleLoadPreset = (preset) => {
    onLoadPreset(preset.filters);
    onClose();
  };

  const handleDeletePreset = (presetId) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      savePresets(updatedPresets);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFilterSummary = (filters) => {
    const parts = [];

    if (filters.searchTerm) {
      parts.push(`Search: "${filters.searchTerm}"`);
    }

    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      parts.push(`${filters.selectedCategories.length} ${filters.selectedCategories.length === 1 ? 'category' : 'categories'}`);
    }

    if (filters.selectedMembers && filters.selectedMembers.length > 0) {
      parts.push(`${filters.selectedMembers.length} ${filters.selectedMembers.length === 1 ? 'member' : 'members'}`);
    }

    if (filters.dateRange) {
      parts.push('Date range');
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters';
  };

  return (
    <div className="filter-presets-overlay" onClick={onClose}>
      <div className="filter-presets-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-presets-header">
          <h3>💾 Filter Presets</h3>
          <button onClick={onClose} className="presets-close" aria-label="Close">
            ×
          </button>
        </div>

        <div className="filter-presets-content">
          {/* Save Current Filters */}
          <div className="save-preset-section">
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="btn-show-save-form"
              >
                💾 Save Current Filters
              </button>
            ) : (
              <div className="save-preset-form">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  className="preset-name-input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePreset();
                    }
                  }}
                />
                <div className="save-preset-actions">
                  <button onClick={() => setShowSaveForm(false)} className="btn-cancel-save">
                    Cancel
                  </button>
                  <button onClick={handleSavePreset} className="btn-save-preset">
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Presets List */}
          <div className="presets-list">
            <h4 className="presets-list-title">Saved Presets</h4>

            {presets.length === 0 ? (
              <div className="presets-empty">
                <p className="presets-empty-icon">📁</p>
                <p className="presets-empty-text">No saved presets yet</p>
                <p className="presets-empty-hint">Save your current filters to quickly reuse them later</p>
              </div>
            ) : (
              <div className="presets-items">
                {presets.map(preset => (
                  <div key={preset.id} className="preset-item">
                    <div className="preset-main" onClick={() => handleLoadPreset(preset)}>
                      <div className="preset-info">
                        <h5 className="preset-name">{preset.name}</h5>
                        <p className="preset-summary">{getFilterSummary(preset.filters)}</p>
                        <p className="preset-date">Saved {formatDate(preset.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="preset-delete"
                      aria-label="Delete preset"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPresets;
