// Currency configuration and utilities

export const CURRENCIES = {
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
};

// Exchange rate cache
let exchangeRateCache = {
  rates: {},
  lastUpdate: null,
  baseCurrency: 'USD'
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch exchange rates from API
 * Using exchangerate-api.com (free tier allows 1500 requests/month)
 */
export const fetchExchangeRates = async (baseCurrency = 'USD') => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      exchangeRateCache.rates[baseCurrency] &&
      exchangeRateCache.lastUpdate &&
      (now - exchangeRateCache.lastUpdate) < CACHE_DURATION
    ) {
      return exchangeRateCache.rates[baseCurrency];
    }

    // Fetch from API
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();

    // Update cache
    exchangeRateCache.rates[baseCurrency] = data.rates;
    exchangeRateCache.lastUpdate = now;
    exchangeRateCache.baseCurrency = baseCurrency;

    // Store in localStorage for offline use
    try {
      localStorage.setItem('exchangeRates', JSON.stringify(exchangeRateCache));
    } catch (e) {
      console.warn('Failed to cache exchange rates:', e);
    }

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Try to use cached data from localStorage
    try {
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const cachedData = JSON.parse(cached);
        return cachedData.rates[baseCurrency] || {};
      }
    } catch (e) {
      console.warn('Failed to load cached rates:', e);
    }

    // Return empty object if all fails
    return {};
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await fetchExchangeRates(fromCurrency);

    if (!rates[toCurrency]) {
      console.warn(`No exchange rate found for ${toCurrency}`);
      return null;
    }

    return amount * rates[toCurrency];
  } catch (error) {
    console.error('Currency conversion error:', error);
    return null;
  }
};

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (amount, currency, showCode = false) => {
  const currencyInfo = CURRENCIES[currency] || { symbol: '$', name: currency };

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';

  if (showCode) {
    return `${sign}${currencyInfo.symbol}${formatted} ${currency}`;
  }

  return `${sign}${currencyInfo.symbol}${formatted}`;
};

/**
 * Format amount with both primary and secondary currencies
 */
export const formatDualCurrency = async (
  amount,
  primaryCurrency,
  secondaryCurrency = null
) => {
  const primaryFormatted = formatCurrency(amount, primaryCurrency);

  if (!secondaryCurrency || secondaryCurrency === primaryCurrency) {
    return primaryFormatted;
  }

  const convertedAmount = await convertCurrency(
    amount,
    primaryCurrency,
    secondaryCurrency
  );

  if (convertedAmount === null) {
    return primaryFormatted;
  }

  const secondaryFormatted = formatCurrency(convertedAmount, secondaryCurrency);

  return `${primaryFormatted} (${secondaryFormatted})`;
};

/**
 * Load cached exchange rates on initialization
 */
export const initializeCurrencyCache = () => {
  try {
    const cached = localStorage.getItem('exchangeRates');
    if (cached) {
      exchangeRateCache = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to initialize currency cache:', e);
  }
};

// Initialize cache on module load
initializeCurrencyCache();
