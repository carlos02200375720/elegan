import { CartItem } from "../../tipos";

export function mergeCartItems(sources: CartItem[][]): CartItem[] {
  const merged = new Map<string, CartItem>();
  for (const source of sources) {
    for (const item of source) {
      if (!item?.product) continue;
      const extendedItem = item as CartItem & {
        selectedOptions?: Record<string, string>;
        selectedVariantVid?: string;
        variantId?: string;
      };
      const options = extendedItem.selectedOptions && typeof extendedItem.selectedOptions === "object"
        ? Object.fromEntries(Object.entries(extendedItem.selectedOptions).sort(([left], [right]) => left.localeCompare(right)))
        : extendedItem.selectedOptions;
      const key = JSON.stringify([
        item.product.id || (item.product as any)._id || item.product.name || item.product,
        options || null,
        extendedItem.selectedVariantVid || extendedItem.variantId || null,
        item.selectedCarrier || null,
        item.selectedShippingCost || null,
        item.selectedCountry || null,
      ]);
      const previous = merged.get(key);
      if (!previous || Number(item.quantity || 0) > Number(previous.quantity || 0)) {
        merged.set(key, item);
      }
    }
  }
  return Array.from(merged.values());
}
