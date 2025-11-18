import { useTheme } from '../contexts/ThemeContext';
import './ThemePicker.css';

export default function ThemePicker() {
  const {
    colorTheme,
    changeColorTheme,
    THEMES,
    THEME_NAMES,
    displayMode,
    changeDisplayMode,
    DISPLAY_MODES,
    DISPLAY_MODE_NAMES
  } = useTheme();

  const themeColors = {
    [THEMES.ORANGE]: {
      primary: '#C2410C',
      secondary: '#EA580C',
      tertiary: '#FB923C'
    },
    [THEMES.NATURE]: {
      primary: '#6B9B7B',
      secondary: '#88B799',
      tertiary: '#A3C9B1'
    },
    [THEMES.BLUE]: {
      primary: '#4A7BA7',
      secondary: '#5E93C2',
      tertiary: '#8AB8E3'
    },
    [THEMES.OBSIDIAN]: {
      primary: '#06B6D4',
      secondary: '#0891B2',
      tertiary: '#22D3EE'
    },
    [THEMES.LAVA]: {
      primary: '#F97316',
      secondary: '#EA580C',
      tertiary: '#FB923C'
    }
  };

  return (
    <div className="theme-picker">
      <h3 className="theme-picker-title">Color Theme</h3>
      <div className="theme-options">
        {Object.values(THEMES).map((theme) => (
          <button
            key={theme}
            className={`theme-option ${colorTheme === theme ? 'active' : ''}`}
            onClick={() => changeColorTheme(theme)}
            aria-label={`Select ${THEME_NAMES[theme]} theme`}
          >
            <div className="theme-swatch">
              <div
                className="swatch-color primary"
                style={{ backgroundColor: themeColors[theme].primary }}
              />
              <div
                className="swatch-color secondary"
                style={{ backgroundColor: themeColors[theme].secondary }}
              />
              <div
                className="swatch-color tertiary"
                style={{ backgroundColor: themeColors[theme].tertiary }}
              />
            </div>
            <span className="theme-name">{THEME_NAMES[theme]}</span>
            {colorTheme === theme && (
              <span className="check-icon" aria-hidden="true">✓</span>
            )}
          </button>
        ))}
      </div>

      <h3 className="theme-picker-title">Display Density</h3>
      <div className="display-mode-options">
        {Object.values(DISPLAY_MODES).map((mode) => (
          <button
            key={mode}
            className={`display-mode-option ${displayMode === mode ? 'active' : ''}`}
            onClick={() => changeDisplayMode(mode)}
            aria-label={`Select ${DISPLAY_MODE_NAMES[mode]} display mode`}
          >
            <span className="display-mode-icon">
              {mode === DISPLAY_MODES.COMFORTABLE ? '⬜' : '▪️'}
            </span>
            <span className="display-mode-name">{DISPLAY_MODE_NAMES[mode]}</span>
            {displayMode === mode && (
              <span className="check-icon" aria-hidden="true">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
