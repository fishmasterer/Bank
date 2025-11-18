import { useTheme } from '../contexts/ThemeContext';
import './ThemePicker.css';

export default function ThemePicker() {
  const { THEME_NAMES, THEMES } = useTheme();

  return (
    <div className="theme-picker">
      <h3 className="theme-picker-title">Theme</h3>
      <div className="theme-display">
        <div className="theme-swatch">
          <div
            className="swatch-color primary"
            style={{ backgroundColor: '#06B6D4' }}
          />
          <div
            className="swatch-color secondary"
            style={{ backgroundColor: '#22D3EE' }}
          />
          <div
            className="swatch-color tertiary"
            style={{ backgroundColor: '#67E8F9' }}
          />
        </div>
        <span className="theme-name">{THEME_NAMES[THEMES.OBSIDIAN]}</span>
        <span className="check-icon" aria-hidden="true">✓</span>
      </div>
    </div>
  );
}
