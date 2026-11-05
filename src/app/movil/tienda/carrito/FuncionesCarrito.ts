import { Product, CartItem } from "../../../../types";

export function calculateItemShippingFee(item: CartItem): { fee: number; carrier?: string } {
  const fee =
    item.selectedShippingCost !== undefined
      ? Number(item.selectedShippingCost)
      : Number(item.product.shippingCost ?? 0);
  const carrier = item.selectedCarrier || item.product.selectedCarrier;
  return { fee: Number.isNaN(fee) ? 0 : fee, carrier };
}

export function calculateItemTotal(item: CartItem): number {
  return item.product.price * (item.quantity || 1);
}

export function getAvailableCartStock(product: Product): number | undefined {
  if (product.stock === undefined) return undefined;
  const num = typeof product.stock === "number" ? product.stock : parseInt(String(product.stock), 10);
  return Number.isNaN(num) ? undefined : Math.max(0, num);
}
