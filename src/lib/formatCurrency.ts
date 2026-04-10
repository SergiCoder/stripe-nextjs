/**
 * Format a display amount as a locale-aware currency string.
 *
 * Fractional digits are suppressed for whole amounts (e.g. "$19" not "$19.00")
 * and shown with up to two decimals otherwise.
 */
export function formatCurrency(
  displayAmount: number,
  currency: string,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: displayAmount % 1 === 0 ? 0 : 2,
  }).format(displayAmount);
}
