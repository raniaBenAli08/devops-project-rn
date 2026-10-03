export const formatTnd = (amount: number, locale: 'en' | 'fr' = 'fr'): string =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-TN' : 'en-TN', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 2,
  }).format(amount);
