import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for persisting scroll positions between tab switches
 * Saves scroll position when leaving a tab and restores it when returning
 */
const useScrollPersistence = (activeTab, tabOrder) => {
  const scrollPositions = useRef({});
  const lastTab = useRef(activeTab);

  // Save current scroll position for the current tab
  const saveScrollPosition = useCallback(() => {
    scrollPositions.current[lastTab.current] = window.scrollY;
  }, []);

  // Restore scroll position for the given tab
  const restoreScrollPosition = useCallback((tab) => {
    const savedPosition = scrollPositions.current[tab];
    if (savedPosition !== undefined) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: 'instant'
        });
      });
    } else {
      // No saved position, scroll to top
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      });
    }
  }, []);

  // Handle tab changes
  useEffect(() => {
    if (activeTab !== lastTab.current) {
      // Save position of the tab we're leaving
      saveScrollPosition();

      // Restore position of the tab we're entering
      restoreScrollPosition(activeTab);

      // Update last tab
      lastTab.current = activeTab;
    }
  }, [activeTab, saveScrollPosition, restoreScrollPosition]);

  // Save scroll position when scrolling (throttled)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          scrollPositions.current[activeTab] = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Save scroll position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
      // Optionally save to sessionStorage for persistence across refreshes
      try {
        sessionStorage.setItem(
          'expense-tracker-scroll-positions',
          JSON.stringify(scrollPositions.current)
        );
      } catch (e) {
        // Ignore storage errors
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveScrollPosition]);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('expense-tracker-scroll-positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object') {
          scrollPositions.current = parsed;
          // Restore current tab's position
          restoreScrollPosition(activeTab);
        }
        // Clear after restoring
        sessionStorage.removeItem('expense-tracker-scroll-positions');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []); // Only run on mount

  return {
    saveScrollPosition,
    restoreScrollPosition,
    getScrollPosition: (tab) => scrollPositions.current[tab] || 0
  };
};

export default useScrollPersistence;
