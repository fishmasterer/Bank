import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

// Available themes
export const THEMES = {
  ORANGE: 'orange',
  NATURE: 'nature',
  BLUE: 'blue',
  OBSIDIAN: 'obsidian'
};

export const THEME_NAMES = {
  [THEMES.ORANGE]: 'Warm Orange',
  [THEMES.NATURE]: 'Soft Nature',
  [THEMES.BLUE]: 'Calm Blue',
  [THEMES.OBSIDIAN]: 'Obsidian'
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
  },
  [THEMES.OBSIDIAN]: {
    light: '#0A0A0F',  // Deep obsidian (always dark)
    dark: '#0A0A0F'     // Deep obsidian
  }
};

export function ThemeProvider({ children }) {
  const { currentUser } = useAuth();
  const [colorTheme, setColorTheme] = useState(THEMES.ORANGE);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [loading, setLoading] = useState(true);

  // Load theme preference from Firebase when user logs in
  useEffect(() => {
    const loadThemePreference = async () => {
      if (currentUser) {
        try {
          const userPrefsDoc = await getDoc(doc(db, 'userPreferences', currentUser.uid));
          if (userPrefsDoc.exists()) {
            const data = userPrefsDoc.data();
            if (data.colorTheme) {
              setColorTheme(data.colorTheme);
            }
            if (data.darkMode !== undefined) {
              setDarkMode(data.darkMode);
            }
          }
        } catch (error) {
          console.error('Error loading theme preference:', error);
        }
      } else {
        // Not logged in, load from localStorage
        const savedTheme = localStorage.getItem('colorTheme');
        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
          setColorTheme(savedTheme);
        }
      }
      setLoading(false);
    };

    loadThemePreference();
  }, [currentUser]);

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

  // Save theme preference to Firebase
  const saveThemePreference = async (newColorTheme, newDarkMode) => {
    if (currentUser) {
      try {
        await setDoc(
          doc(db, 'userPreferences', currentUser.uid),
          {
            colorTheme: newColorTheme,
            darkMode: newDarkMode,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    saveThemePreference(colorTheme, newDarkMode);
  };

  const changeColorTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setColorTheme(newTheme);
      saveThemePreference(newTheme, darkMode);
    }
  };

  const value = {
    colorTheme,
    darkMode,
    toggleDarkMode,
    changeColorTheme,
    loading,
    THEMES,
    THEME_NAMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
