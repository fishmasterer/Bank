import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { fetchExchangeRates } from '../utils/currency';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children, defaultPrimaryCurrency = 'AUD' }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    primaryCurrency: defaultPrimaryCurrency,
    secondaryCurrency: null,
    showSecondaryCurrency: false,
    notificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState({});

  // Load settings from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const settingsRef = doc(db, 'userSettings', user.uid);

    // Real-time listener for settings
    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          setSettings(doc.data());
        } else {
          // Create default settings if they don't exist
          const defaultSettings = {
            primaryCurrency: defaultPrimaryCurrency,
            secondaryCurrency: null,
            showSecondaryCurrency: false,
            notificationsEnabled: true,
          };
          setDoc(settingsRef, defaultSettings).catch(console.error);
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading settings:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, defaultPrimaryCurrency]);

  // Fetch exchange rates when currencies change
  useEffect(() => {
    const loadExchangeRates = async () => {
      if (settings.primaryCurrency) {
        try {
          const rates = await fetchExchangeRates(settings.primaryCurrency);
          setExchangeRates(rates);
        } catch (error) {
          console.error('Error loading exchange rates:', error);
        }
      }
    };

    loadExchangeRates();

    // Refresh exchange rates every hour
    const interval = setInterval(loadExchangeRates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.primaryCurrency]);

  const updateSettings = async (newSettings) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const settingsRef = doc(db, 'userSettings', user.uid);
      const updatedSettings = { ...settings, ...newSettings };
      await setDoc(settingsRef, updatedSettings, { merge: true });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const convertAmount = (amount, toCurrency) => {
    if (!toCurrency || toCurrency === settings.primaryCurrency) {
      return amount;
    }

    const rate = exchangeRates[toCurrency];
    if (!rate) {
      console.warn(`No exchange rate for ${toCurrency}`);
      return null;
    }

    return amount * rate;
  };

  const value = {
    settings,
    loading,
    updateSettings,
    exchangeRates,
    convertAmount,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
