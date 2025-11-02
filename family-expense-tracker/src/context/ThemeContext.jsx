import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

// Available themes
export const THEMES = {
  ORANGE: 'orange',
  NATURE: 'nature',
  BLUE: 'blue'
};

export const THEME_NAMES = {
  [THEMES.ORANGE]: 'Warm Orange',
  [THEMES.NATURE]: 'Soft Nature',
  [THEMES.BLUE]: 'Calm Blue'
};

// Theme colors for PWA meta tags
const THEME_COLORS = {
  [THEMES.ORANGE]: {
    light: '#C2410C',  // Warm orange
    dark: '#1C1917'     // Dark background
  },
  [THEMES.NATURE]: {
    light: '#6B9B7B',  // Soft sage green
    dark: '#1C1917'     // Dark background
  },
  [THEMES.BLUE]: {
    light: '#4A7BA7',  // Calm blue
    dark: '#1C1917'     // Dark background
  }
};

export function ThemeProvider({ children }) {
  const [colorTheme, setColorTheme] = useState(() => {
    const saved = localStorage.getItem('colorTheme');
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }
    return THEMES.ORANGE;
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document and update PWA theme-color meta tag
  useEffect(() => {
    const mode = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem('theme', mode);
    localStorage.setItem('colorTheme', colorTheme);

    // Update theme-color meta tag for PWA
    const themeColor = THEME_COLORS[colorTheme]?.[mode] || THEME_COLORS[THEMES.ORANGE][mode];
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    } else {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.content = themeColor;
      document.head.appendChild(metaThemeColor);
    }

    // Update Apple status bar style based on dark mode
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusBar) {
      appleStatusBar.setAttribute('content', darkMode ? 'black-translucent' : 'default');
    }
  }, [darkMode, colorTheme]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const changeColorTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setColorTheme(newTheme);
    }
  };

  const value = {
    colorTheme,
    darkMode,
    toggleDarkMode,
    changeColorTheme,
    loading: false,
    THEMES,
    THEME_NAMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
