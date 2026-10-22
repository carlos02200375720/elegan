/** Store currency formatting utilities (US Dollar / USD). */

export const CURRENCY_CODE = "USD";
export const CURRENCY_SYMBOL = "$";
export const CURRENCY_LABEL = "Dólar estadounidense";

/**
 * Formats a numeric value as US dollars.
 */
export function formatPrice(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a numeric value as US dollars with a space after the symbol.
 */
export function formatPriceSpaced(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(num)) return "$ 0.00";
  return `$ ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
