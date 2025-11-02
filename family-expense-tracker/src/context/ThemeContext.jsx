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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('colorTheme', colorTheme);
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
