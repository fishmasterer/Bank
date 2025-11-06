import React from 'react';
import { useThemeStore } from '../stores/themeStore';
import { getThemesList } from '../utils/themes';
import './ThemePicker.css';

const ThemePicker = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const themes = getThemesList();

  return (
    <div className="theme-picker">
      <label className="theme-picker-label">Theme</label>
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
            title={theme.name}
            aria-label={`Select ${theme.name} theme`}
          >
            <span className="theme-icon">{theme.icon}</span>
            <span className="theme-name">{theme.name}</span>
            {currentTheme === theme.id && (
              <span className="theme-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemePicker;
