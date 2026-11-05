import { CartItem } from "../../../../types";

export function calculateOrderSubtotal(items: CartItem[]): number {
  return (items || []).reduce(
    (sum, item) => sum + item.product.price * (item.quantity || 1),
    0
  );
}

export function calculateFallbackShipping(items: CartItem[]): number {
  return (items || []).reduce((sum, item) => {
    const fee =
      item.selectedShippingCost !== undefined
        ? Number(item.selectedShippingCost)
        : item.product.shippingCost !== undefined
        ? Number(item.product.shippingCost)
        : 0;
    return sum + (Number.isNaN(fee) ? 0 : fee) * (item.quantity || 1);
  }, 0);
}

export function getEffectiveShipping(items: CartItem[], lastShippingCost?: number): number {
  if (lastShippingCost !== undefined) {
    return Number(lastShippingCost) || 0;
  }
  return calculateFallbackShipping(items);
}

export function calculateThankYouTotal(
  items: CartItem[],
  lastShippingCost?: number,
  orderTotal?: number
): number {
  if (orderTotal !== undefined && orderTotal > 0) {
    return orderTotal;
  }
  const subtotal = calculateOrderSubtotal(items);
  const shipping = getEffectiveShipping(items, lastShippingCost);
  return subtotal + shipping;
}
