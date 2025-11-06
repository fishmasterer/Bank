// Theme definitions with carefully chosen colors for accessibility and aesthetics

export const themes = {
  orange: {
    id: 'orange',
    name: 'Sunset Orange',
    icon: '🧡',
    colors: {
      // Primary colors
      '--primary-color': '#c2410c',
      '--primary-hover': '#9a3412',
      '--primary-light': '#ea580c',

      // Background colors
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#fef2f2',
      '--bg-tertiary': '#fecaca',
      '--bg-hover': '#fee2e2',

      // Text colors
      '--text-primary': '#1f2937',
      '--text-secondary': '#4b5563',
      '--text-tertiary': '#6b7280',

      // Border colors
      '--border-color': '#e5e7eb',

      // Status colors
      '--success-color': '#10b981',
      '--danger-color': '#ef4444',
      '--warning-color': '#f59e0b',
    }
  },

  nature: {
    id: 'nature',
    name: 'Pastel Nature',
    icon: '🌿',
    colors: {
      // Primary colors - soft sage green
      '--primary-color': '#84a98c',
      '--primary-hover': '#6b8e73',
      '--primary-light': '#a8c5ae',

      // Background colors - warm beige and cream
      '--bg-primary': '#fefefe',
      '--bg-secondary': '#f8f6f1',
      '--bg-tertiary': '#ede9e0',
      '--bg-hover': '#e8e3d7',

      // Text colors - warm dark browns
      '--text-primary': '#3d3d3d',
      '--text-secondary': '#5c5c5c',
      '--text-tertiary': '#8a8a8a',

      // Border colors - soft tan
      '--border-color': '#d4cfc4',

      // Status colors - nature inspired
      '--success-color': '#7fb069',
      '--danger-color': '#d4737a',
      '--warning-color': '#e5b181',
    }
  },

  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    icon: '💙',
    colors: {
      // Primary colors - soft professional blue
      '--primary-color': '#3b82f6',
      '--primary-hover': '#2563eb',
      '--primary-light': '#60a5fa',

      // Background colors - cool grays with blue tint
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f1f5f9',
      '--bg-tertiary': '#e2e8f0',
      '--bg-hover': '#cbd5e1',

      // Text colors - cool slate
      '--text-primary': '#1e293b',
      '--text-secondary': '#475569',
      '--text-tertiary': '#64748b',

      // Border colors
      '--border-color': '#cbd5e1',

      // Status colors - blue-based palette
      '--success-color': '#10b981',
      '--danger-color': '#ef4444',
      '--warning-color': '#f59e0b',
    }
  }
};

export const getTheme = (themeId) => {
  return themes[themeId] || themes.orange;
};

export const applyTheme = (themeId) => {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  return theme;
};

export const getThemesList = () => {
  return Object.values(themes);
};
