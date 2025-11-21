import { useCallback } from 'react';

type CurrencyOptions = {
  locale?: string;
  currency?: string;
};

const defaultOptions: CurrencyOptions = {
  locale: 'en-IN',
  currency: 'INR',
};

export function useCurrency(options: CurrencyOptions = defaultOptions) {
  const { locale = 'en-IN', currency = 'INR' } = options;

  const format = useCallback(
    (value: number | string) => {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numericValue)) {
        return '';
      }
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(numericValue);
    },
    [locale, currency]
  );

  return { format };
}
