/**
 * Utilidades de moneda para la tienda (Peso Dominicano - RD$ / DOP)
 */

export const CURRENCY_CODE = "DOP";
export const CURRENCY_SYMBOL = "RD$";
export const CURRENCY_LABEL = "Peso Dominicano";

/**
 * Formatea un valor numérico a formato oficial de Peso Dominicano (RD$).
 * Ejemplo: formatPrice(1500) => "RD$1,500.00"
 */
export function formatPrice(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(num)) return "RD$0.00";
  return `RD$${num.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formatea un valor numérico con espacio entre el símbolo y el monto.
 * Ejemplo: formatPriceSpaced(1500) => "RD$ 1,500.00"
 */
export function formatPriceSpaced(amount: number | string | null | undefined): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(num)) return "RD$ 0.00";
  return `RD$ ${num.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
