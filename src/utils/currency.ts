import { useAuth } from '../context/AuthContext';

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  rateAgainstEur: number; // 1 EUR = X units of this currency
}

export const CURRENCIES: Record<string, CurrencyMeta> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', rateAgainstEur: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'Dollar américain ($)', rateAgainstEur: 1.09 },
  TND: { code: 'TND', symbol: 'DT', name: 'Dinar tunisien (DT)', rateAgainstEur: 3.38 },
  GBP: { code: 'GBP', symbol: '£', name: 'Livre sterling (£)', rateAgainstEur: 0.86 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Dollar canadien (CA$)', rateAgainstEur: 1.48 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Franc suisse (CHF)', rateAgainstEur: 0.96 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen japonais (¥)', rateAgainstEur: 165.0 },
};

/**
 * Convert an amount from one currency to another using the EUR exchange rate pivot.
 * Example: 1800 TND to GBP -> (1800 / 3.38) * 0.86 = ~457.99 GBP.
 */
export function convertCurrency(
  amount: number,
  from: string = 'EUR',
  to: string = 'EUR'
): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  
  const fromCode = (from || 'EUR').toUpperCase();
  const toCode = (to || 'EUR').toUpperCase();

  if (fromCode === toCode) {
    return Math.round(amount * 100) / 100;
  }

  const fromRate = CURRENCIES[fromCode]?.rateAgainstEur || 1.0;
  const toRate = CURRENCIES[toCode]?.rateAgainstEur || 1.0;

  // Convert to EUR first, then to target currency
  const inEur = amount / fromRate;
  const inTarget = inEur * toRate;

  // For JPY round to integer, for others 2 decimals
  if (toCode === 'JPY') {
    return Math.round(inTarget);
  }
  return Math.round(inTarget * 100) / 100;
}

/**
 * Format a number into currency representation.
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = 'EUR'
): string {
  const code = (currencyCode || 'EUR').toUpperCase();
  const meta = CURRENCIES[code] || { symbol: code };
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: code === 'JPY' ? 0 : 2,
    minimumFractionDigits: code === 'JPY' ? 0 : 0
  }).format(amount);

  return `${formattedNumber} ${meta.symbol}`;
}

/**
 * React Hook that binds directly to currentUser.preferences.currency.
 * Provides instant conversion and formatted displays across the entire app.
 */
export function useAppCurrency() {
  const { currentUser } = useAuth();
  const preferredCurrency = (currentUser?.preferences?.currency || 'EUR').toUpperCase();
  const meta = CURRENCIES[preferredCurrency] || CURRENCIES.EUR;

  const convert = (amount: number, fromCurrency: string = 'EUR'): number => {
    return convertCurrency(amount, fromCurrency, preferredCurrency);
  };

  const format = (amount: number, fromCurrency: string = 'EUR'): string => {
    const converted = convert(amount, fromCurrency);
    return formatCurrencyAmount(converted, preferredCurrency);
  };

  const formatWithOriginal = (
    amount: number,
    fromCurrency: string = 'EUR'
  ): { formatted: string; originalFormatted: string; isConverted: boolean; convertedAmount: number } => {
    const fromCode = (fromCurrency || 'EUR').toUpperCase();
    const convertedAmount = convert(amount, fromCode);
    const formatted = formatCurrencyAmount(convertedAmount, preferredCurrency);
    const originalFormatted = formatCurrencyAmount(amount, fromCode);
    const isConverted = fromCode !== preferredCurrency;

    return {
      formatted,
      originalFormatted,
      isConverted,
      convertedAmount
    };
  };

  return {
    currency: preferredCurrency,
    symbol: meta.symbol,
    currencyName: meta.name,
    convert,
    format,
    formatWithOriginal,
    allCurrencies: Object.values(CURRENCIES)
  };
}
