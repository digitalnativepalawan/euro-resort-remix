import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useResortProfile } from '@/hooks/useResortProfile';

type Currency = 'EUR' | 'USD';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRate: number;
  formatPrice: (amountEur: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'EUR',
  setCurrency: () => {},
  exchangeRate: 1.08,
  formatPrice: (a) => `€${a.toLocaleString()}`,
});

export const useCurrency = () => useContext(CurrencyContext);

const LS_KEY = 'selected_currency';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { data: profile } = useResortProfile();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const stored = localStorage.getItem(LS_KEY);
    return (stored === 'USD' ? 'USD' : 'EUR') as Currency;
  });

  const exchangeRate = profile?.usd_exchange_rate ?? 1.08;

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(LS_KEY, c);
  }, []);

  const formatPrice = useCallback(
    (amountEur: number) => {
      if (currency === 'USD') {
        const converted = amountEur * exchangeRate;
        return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      return `€${amountEur.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    },
    [currency, exchangeRate],
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
