/**
 * Currency utilities for SGD/AUD support
 */

export const CURRENCIES = {
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
  },
};

export const DEFAULT_CURRENCY = 'SGD';
export const BASE_CURRENCY = 'SGD';

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (amount, currencyCode = 'SGD', options = {}) => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.SGD;
  const { showCode = false, compact = false } = options;

  const formatted = amount.toLocaleString('en-SG', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
  });

  if (showCode) {
    return `${currency.symbol}${formatted} ${currencyCode}`;
  }
  return `${currency.symbol}${formatted}`;
};

/**
 * Format amount with flag
 */
export const formatWithFlag = (amount, currencyCode = 'SGD') => {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.SGD;
  const formatted = amount.toLocaleString('en-SG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency.flag} ${currency.symbol}${formatted}`;
};

/**
 * Convert amount between currencies
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (fromCurrency === toCurrency) return amount;
  if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return amount;

  // Convert to base currency (SGD) first, then to target
  const inSGD = fromCurrency === 'SGD'
    ? amount
    : amount / rates[fromCurrency];

  return toCurrency === 'SGD'
    ? inSGD
    : inSGD * rates[toCurrency];
};

/**
 * Get exchange rate display string
 */
export const getExchangeRateDisplay = (rates) => {
  if (!rates || !rates.AUD) return null;
  return `1 SGD = ${rates.AUD.toFixed(4)} AUD`;
};

/**
 * Fetch exchange rates from API
 * Using exchangerate-api.com (free tier: 1500 requests/month)
 */
export const fetchExchangeRates = async () => {
  try {
    // Using a free exchange rate API
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/SGD'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();

    return {
      base: 'SGD',
      rates: {
        SGD: 1,
        AUD: data.rates.AUD,
      },
      timestamp: Date.now(),
      date: data.date,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates (approximate)
    return {
      base: 'SGD',
      rates: {
        SGD: 1,
        AUD: 0.89, // Approximate fallback
      },
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      error: true,
    };
  }
};

/**
 * Check if rates need updating (older than 24 hours)
 */
export const shouldUpdateRates = (timestamp) => {
  if (!timestamp) return true;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > oneDayMs;
};
