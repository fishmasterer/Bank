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
  OBSIDIAN: 'obsidian',
  LAVA: 'lava'
};

export const THEME_NAMES = {
  [THEMES.ORANGE]: 'Warm Orange',
  [THEMES.NATURE]: 'Soft Nature',
  [THEMES.BLUE]: 'Calm Blue',
  [THEMES.OBSIDIAN]: 'Obsidian',
  [THEMES.LAVA]: 'Lava'
};

// Display modes
export const DISPLAY_MODES = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact'
};

export const DISPLAY_MODE_NAMES = {
  [DISPLAY_MODES.COMFORTABLE]: 'Comfortable',
  [DISPLAY_MODES.COMPACT]: 'Compact'
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
    light: '#06B6D4',  // Electric cyan
    dark: '#0A0A0F'     // Deep obsidian
  },
  [THEMES.LAVA]: {
    light: '#F97316',  // Bright orange
    dark: '#1A0A0A'     // Deep volcanic
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
  const [displayMode, setDisplayMode] = useState(() => {
    const saved = localStorage.getItem('displayMode');
    return saved || DISPLAY_MODES.COMFORTABLE;
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
            if (data.displayMode && Object.values(DISPLAY_MODES).includes(data.displayMode)) {
              setDisplayMode(data.displayMode);
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
        const savedDisplayMode = localStorage.getItem('displayMode');
        if (savedDisplayMode && Object.values(DISPLAY_MODES).includes(savedDisplayMode)) {
          setDisplayMode(savedDisplayMode);
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
    document.documentElement.setAttribute('data-display-mode', displayMode);
    localStorage.setItem('theme', mode);
    localStorage.setItem('colorTheme', colorTheme);
    localStorage.setItem('displayMode', displayMode);

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
  }, [darkMode, colorTheme, displayMode]);

  // Save theme preference to Firebase
  const saveThemePreference = async (newColorTheme, newDarkMode, newDisplayMode) => {
    if (currentUser) {
      try {
        await setDoc(
          doc(db, 'userPreferences', currentUser.uid),
          {
            colorTheme: newColorTheme,
            darkMode: newDarkMode,
            displayMode: newDisplayMode,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  // Helper function to trigger smooth theme transition
  const triggerThemeTransition = () => {
    // Add transitioning class for smooth color transitions
    document.documentElement.classList.add('theme-transitioning');

    // Create and add overlay element for flash effect
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    document.body.appendChild(overlay);

    // Remove transitioning class and overlay after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 400);

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 600);
  };

  const toggleDarkMode = () => {
    triggerThemeTransition();
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    saveThemePreference(colorTheme, newDarkMode, displayMode);
  };

  const changeColorTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      triggerThemeTransition();
      setColorTheme(newTheme);
      saveThemePreference(newTheme, darkMode, displayMode);
    }
  };

  const changeDisplayMode = (newMode) => {
    if (Object.values(DISPLAY_MODES).includes(newMode)) {
      triggerThemeTransition();
      setDisplayMode(newMode);
      saveThemePreference(colorTheme, darkMode, newMode);
    }
  };

  const value = {
    colorTheme,
    darkMode,
    displayMode,
    toggleDarkMode,
    changeColorTheme,
    changeDisplayMode,
    loading,
    THEMES,
    THEME_NAMES,
    DISPLAY_MODES,
    DISPLAY_MODE_NAMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
