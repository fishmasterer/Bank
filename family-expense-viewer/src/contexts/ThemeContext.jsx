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
  BLUE: 'blue'
};

export const THEME_NAMES = {
  [THEMES.ORANGE]: 'Warm Orange',
  [THEMES.NATURE]: 'Soft Nature',
  [THEMES.BLUE]: 'Calm Blue'
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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('colorTheme', colorTheme);
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
