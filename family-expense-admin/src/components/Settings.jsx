import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { CURRENCIES } from '../utils/currency';
import './Settings.css';

const Settings = ({ onClose }) => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateSettings(localSettings);
      onClose();
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="btn-close" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Currency Settings</h3>

            <div className="setting-item">
              <label htmlFor="primaryCurrency">
                <strong>Primary Currency</strong>
                <span className="setting-description">
                  Your main currency for tracking expenses
                </span>
              </label>
              <select
                id="primaryCurrency"
                value={localSettings.primaryCurrency}
                onChange={(e) => handleChange('primaryCurrency', e.target.value)}
                className="settings-select"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.flag} {info.name} ({info.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="setting-item">
              <label htmlFor="showSecondaryCurrency">
                <input
                  type="checkbox"
                  id="showSecondaryCurrency"
                  checked={localSettings.showSecondaryCurrency}
                  onChange={(e) => handleChange('showSecondaryCurrency', e.target.checked)}
                  className="settings-checkbox"
                />
                <strong>Show Secondary Currency</strong>
                <span className="setting-description">
                  Display amounts in a second currency (in brackets)
                </span>
              </label>
            </div>

            {localSettings.showSecondaryCurrency && (
              <div className="setting-item">
                <label htmlFor="secondaryCurrency">
                  <strong>Secondary Currency</strong>
                  <span className="setting-description">
                    Additional currency to display alongside primary
                  </span>
                </label>
                <select
                  id="secondaryCurrency"
                  value={localSettings.secondaryCurrency || ''}
                  onChange={(e) => handleChange('secondaryCurrency', e.target.value || null)}
                  className="settings-select"
                >
                  <option value="">Select currency...</option>
                  {Object.entries(CURRENCIES)
                    .filter(([code]) => code !== localSettings.primaryCurrency)
                    .map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {info.name} ({info.symbol})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </section>

          <section className="settings-section">
            <h3>Notifications</h3>

            <div className="setting-item">
              <label htmlFor="notificationsEnabled">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  checked={localSettings.notificationsEnabled}
                  onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                  className="settings-checkbox"
                />
                <strong>Enable Notifications</strong>
                <span className="setting-description">
                  Receive reminders to update budget at end of month
                </span>
              </label>
            </div>
          </section>

          {error && (
            <div className="settings-error">
              <span>⚠️</span> {error}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-save">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
