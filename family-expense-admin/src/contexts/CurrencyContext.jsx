import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  fetchExchangeRates,
  shouldUpdateRates,
  convertCurrency,
  formatCurrency,
  formatWithFlag,
} from '../utils/currency';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [baseCurrency] = useState(DEFAULT_CURRENCY); // SGD is always base
  const [exchangeRates, setExchangeRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load rates from Firestore on mount
  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    try {
      setLoading(true);

      // Try to get cached rates from Firestore
      const ratesDoc = await getDoc(doc(db, 'settings', 'exchangeRates'));

      if (ratesDoc.exists()) {
        const data = ratesDoc.data();
        setExchangeRates(data.rates);
        setLastUpdated(data.timestamp);

        // Check if rates need updating (older than 24 hours)
        if (shouldUpdateRates(data.timestamp)) {
          await updateExchangeRates();
        }
      } else {
        // No cached rates, fetch new ones
        await updateExchangeRates();
      }
    } catch (err) {
      console.error('Error loading exchange rates:', err);
      setError('Failed to load exchange rates');
      // Set fallback rates
      setExchangeRates({ SGD: 1, AUD: 0.89 });
    } finally {
      setLoading(false);
    }
  };

  const updateExchangeRates = useCallback(async () => {
    try {
      const rateData = await fetchExchangeRates();

      // Save to Firestore
      await setDoc(doc(db, 'settings', 'exchangeRates'), {
        rates: rateData.rates,
        timestamp: rateData.timestamp,
        date: rateData.date,
        updatedAt: new Date().toISOString(),
      });

      setExchangeRates(rateData.rates);
      setLastUpdated(rateData.timestamp);
      setError(null);

      return rateData;
    } catch (err) {
      console.error('Error updating exchange rates:', err);
      setError('Failed to update exchange rates');
      throw err;
    }
  }, []);

  // Convert amount to base currency (SGD)
  const toBaseCurrency = useCallback(
    (amount, fromCurrency) => {
      return convertCurrency(amount, fromCurrency, baseCurrency, exchangeRates);
    },
    [exchangeRates, baseCurrency]
  );

  // Alias for toBaseCurrency - converts any currency to SGD
  const convertToSGD = useCallback(
    (amount, fromCurrency) => {
      return convertCurrency(amount, fromCurrency, 'SGD', exchangeRates);
    },
    [exchangeRates]
  );

  // Convert from base currency to target
  const fromBaseCurrency = useCallback(
    (amount, toCurrency) => {
      return convertCurrency(amount, baseCurrency, toCurrency, exchangeRates);
    },
    [exchangeRates, baseCurrency]
  );

  // Format amount with currency
  const formatAmount = useCallback(
    (amount, currency = 'SGD') => {
      return formatCurrency(amount, currency);
    },
    []
  );

  // Format with conversion info
  const formatWithConversion = useCallback(
    (amount, currency) => {
      if (currency === baseCurrency) {
        return formatCurrency(amount, currency);
      }

      const converted = toBaseCurrency(amount, currency);
      return `${formatCurrency(amount, currency)} (≈ ${formatCurrency(converted, baseCurrency)})`;
    },
    [toBaseCurrency, baseCurrency]
  );

  // Get exchange rate between two currencies
  const getRate = useCallback(
    (from, to) => {
      if (!exchangeRates) return 1;
      if (from === to) return 1;

      if (from === 'SGD') {
        return exchangeRates[to] || 1;
      } else if (to === 'SGD') {
        return 1 / (exchangeRates[from] || 1);
      }

      // Cross rate
      return (exchangeRates[to] || 1) / (exchangeRates[from] || 1);
    },
    [exchangeRates]
  );

  const value = {
    // Constants
    currencies: CURRENCIES,
    baseCurrency,

    // State
    exchangeRates,
    lastUpdated,
    loading,
    error,

    // Actions
    updateExchangeRates,
    toBaseCurrency,
    fromBaseCurrency,
    convertToSGD,
    getRate,

    // Formatting
    formatCurrency,
    formatAmount,
    formatWithFlag,
    formatWithConversion,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
