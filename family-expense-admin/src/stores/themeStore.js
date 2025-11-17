import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme } from '../utils/themes';

export const useThemeStore = create(
  persist(
    (set) => ({
      currentTheme: 'orange',
      setTheme: (themeId) => {
        applyTheme(themeId);
        set({ currentTheme: themeId });
      },
    }),
    {
      name: 'expense-tracker-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.currentTheme);
        }
      },
    }
  )
);
