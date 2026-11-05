import type { CartItem } from "../../../types";

function cartItemsMatch(left: CartItem, right: CartItem): boolean {
  const getKey = (item: CartItem) => {
    const extendedItem = item as CartItem & {
      selectedOptions?: Record<string, string>;
      selectedVariantVid?: string;
      variantId?: string;
    };
    const options = extendedItem.selectedOptions && typeof extendedItem.selectedOptions === "object"
      ? Object.fromEntries(Object.entries(extendedItem.selectedOptions).sort(([a], [b]) => a.localeCompare(b)))
      : extendedItem.selectedOptions;
    return JSON.stringify([
      item.product.id || (item.product as any)._id || item.product.name || item.product,
      options || null,
      extendedItem.selectedVariantVid || extendedItem.variantId || null,
      item.selectedCarrier || null,
      item.selectedShippingCost || null,
      item.selectedCountry || null,
    ]);
  };
  return getKey(left) === getKey(right);
}

export { cartItemsMatch };
