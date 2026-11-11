import React, { createContext, useContext, useState, useEffect } from 'react';
import { ENDPOINTS } from '../config/api';
import pkFlag from '../assets/flags/pk.svg';
import usFlag from '../assets/flags/us.svg';
import aeFlag from '../assets/flags/ae.svg';
import saFlag from '../assets/flags/sa.svg';

export const CURRENCIES = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    name: 'Pakistani Rupee',
    flag: pkFlag,
    flagEmoji: '🇵🇰',
    country: 'Pakistan',
    isBase: true,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: usFlag,
    flagEmoji: '🇺🇸',
    country: 'United States',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    flag: aeFlag,
    flagEmoji: '🇦🇪',
    country: 'United Arab Emirates',
  },
  SAR: {
    code: 'SAR',
    symbol: 'SAR',
    name: 'Saudi Riyal',
    flag: saFlag,
    flagEmoji: '🇸🇦',
    country: 'Saudi Arabia',
  },
};

// Default conversion rates: 1 Foreign Unit = X PKR (Base is PKR)
export const DEFAULT_RATES = {
  PKR: 1,
  USD: 278.5,
  AED: 75.8,
  SAR: 74.2,
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    try {
      return localStorage.getItem('cf_currency') || 'PKR';
    } catch (e) {
      return 'PKR';
    }
  });

  const [rates, setRatesState] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_exchange_rates');
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
    } catch (e) {
      return DEFAULT_RATES;
    }
  });

  // Sync latest exchange rates from backend API if available
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(ENDPOINTS.RATES);
        const json = await res.json();
        if (json.success && json.rates) {
          setRatesState((prev) => ({ ...prev, ...json.rates }));
          localStorage.setItem('cf_exchange_rates', JSON.stringify({ ...DEFAULT_RATES, ...json.rates }));
        }
      } catch (e) {
        // Fallback to local rates
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
      try {
        localStorage.setItem('cf_currency', code);
      } catch (e) {}
    }
  };

  const updateRates = (newRates) => {
    const updated = { ...rates, ...newRates, PKR: 1 };
    setRatesState(updated);
    try {
      localStorage.setItem('cf_exchange_rates', JSON.stringify(updated));
    } catch (e) {}
  };

  /**
   * Convert an amount given in PKR to the currently active currency.
   */
  const convertPrice = (amountInPkr, targetCurrency = currency) => {
    const num = Number(amountInPkr) || 0;
    if (targetCurrency === 'PKR') return num;
    const rate = rates[targetCurrency] || DEFAULT_RATES[targetCurrency] || 1;
    return num / rate;
  };

  /**
   * Format an amount given in PKR to a display string with currency symbol and appropriate decimals.
   */
  const formatPrice = (amountInPkr, targetCurrency = currency) => {
    const val = convertPrice(amountInPkr, targetCurrency);
    const curr = CURRENCIES[targetCurrency] || CURRENCIES.PKR;

    if (curr.code === 'PKR') {
      return `Rs. ${Math.round(val).toLocaleString()}`;
    }

    if (curr.code === 'USD') {
      return `$${val.toFixed(2)}`;
    }

    return `${curr.symbol} ${val.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currentCurrency: CURRENCIES[currency] || CURRENCIES.PKR,
        currencies: CURRENCIES,
        rates,
        setCurrency,
        updateRates,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

