import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for deep linking with URL parameters
 * Syncs app state with URL for shareable links and back button support
 */
const useDeepLinking = ({
  activeTab,
  setActiveTab,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  tabOrder
}) => {
  const isInitialized = useRef(false);
  const isInternalUpdate = useRef(false);

  // Read URL parameters and update state
  const readUrlParams = useCallback(() => {
    const params = new URLSearchParams(window.location.search);

    const tab = params.get('tab');
    const year = params.get('year');
    const month = params.get('month');

    let hasChanges = false;

    // Update tab if valid
    if (tab && tabOrder.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
      hasChanges = true;
    }

    // Update year if valid
    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100 && yearNum !== selectedYear) {
        setSelectedYear(yearNum);
        hasChanges = true;
      }
    }

    // Update month if valid
    if (month) {
      const monthNum = parseInt(month, 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 && monthNum !== selectedMonth) {
        setSelectedMonth(monthNum);
        hasChanges = true;
      }
    }

    return hasChanges;
  }, [activeTab, selectedYear, selectedMonth, tabOrder, setActiveTab, setSelectedYear, setSelectedMonth]);

  // Update URL without triggering navigation
  const updateUrl = useCallback((newTab, newYear, newMonth, replace = false) => {
    const params = new URLSearchParams();
    params.set('tab', newTab);
    params.set('year', newYear.toString());
    params.set('month', newMonth.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    isInternalUpdate.current = true;

    if (replace) {
      window.history.replaceState({ tab: newTab, year: newYear, month: newMonth }, '', newUrl);
    } else {
      window.history.pushState({ tab: newTab, year: newYear, month: newMonth }, '', newUrl);
    }

    // Reset flag after a tick
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 0);
  }, []);

  // Initialize from URL on mount
  useEffect(() => {
    if (!isInitialized.current) {
      const hasUrlParams = window.location.search.length > 0;

      if (hasUrlParams) {
        readUrlParams();
      } else {
        // Set initial URL state
        updateUrl(activeTab, selectedYear, selectedMonth, true);
      }

      isInitialized.current = true;
    }
  }, [readUrlParams, updateUrl, activeTab, selectedYear, selectedMonth]);

  // Update URL when state changes (after initialization)
  useEffect(() => {
    if (isInitialized.current && !isInternalUpdate.current) {
      updateUrl(activeTab, selectedYear, selectedMonth);
    }
  }, [activeTab, selectedYear, selectedMonth, updateUrl]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        isInternalUpdate.current = true;

        const { tab, year, month } = event.state;

        if (tab && tabOrder.includes(tab)) {
          setActiveTab(tab);
        }
        if (year && !isNaN(year)) {
          setSelectedYear(year);
        }
        if (month && !isNaN(month)) {
          setSelectedMonth(month);
        }

        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 0);
      } else {
        // No state, read from URL
        readUrlParams();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tabOrder, setActiveTab, setSelectedYear, setSelectedMonth, readUrlParams]);

  return { updateUrl };
};

export default useDeepLinking;
