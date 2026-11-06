import { useCallback, useState } from "react";
import type { CartItem, Order, Product, User } from "../tipos";
import { apiFetch } from "../config";
import { getLocalGuestToken, getOrCreateGuestToken } from "../guestToken";

export function useCarritoMovil(currentUser: User) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const token = getLocalGuestToken() || getOrCreateGuestToken();
      const cached = localStorage.getItem(`mall_cart_${token}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const saveCartToMongo = useCallback(async (newCart: CartItem[]) => {
    try {
      const token = getLocalGuestToken() || getOrCreateGuestToken();
      localStorage.setItem(`mall_cart_${token}`, JSON.stringify(newCart));
      await apiFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: newCart, userId: currentUser.id }),
      });
    } catch {}
  }, [currentUser.id]);

  const handleAddToCart = useCallback((product: Product) => {
    setCart((previous) => {
      const index = previous.findIndex((item) => item.product.id === product.id);
      const updated = index >= 0
        ? previous.map((item, itemIndex) => itemIndex === index
            ? { ...item, quantity: item.quantity + 1 }
            : item)
        : [...previous, { product, quantity: 1 }];
      void saveCartToMongo(updated);
      return updated;
    });
  }, [saveCartToMongo]);

  const handleRemoveFromCart = useCallback((productId: string, cartItemIndex?: number) => {
    setCart((previous) => {
      const updated = previous.filter((item, index) =>
        cartItemIndex !== undefined ? index !== cartItemIndex : item.product.id !== productId
      );
      void saveCartToMongo(updated);
      return updated;
    });
  }, [saveCartToMongo]);

  const handleUpdateCartQuantity = useCallback((productId: string, quantity: number, cartItemIndex?: number) => {
    setCart((previous) => {
      const updated = quantity <= 0
        ? previous.filter((item, index) =>
            cartItemIndex !== undefined ? index !== cartItemIndex : item.product.id !== productId
          )
        : previous.map((item, index) => {
            const matches = cartItemIndex !== undefined
              ? index === cartItemIndex
              : item.product.id === productId;
            return matches ? { ...item, quantity } : item;
          });
      void saveCartToMongo(updated);
      return updated;
    });
  }, [saveCartToMongo]);

  const handleCheckoutCart = useCallback(async (
    shippingAddress: string,
    shippingCost: number,
    onComplete: (newOrder: Order) => void,
    itemsToCheckout?: CartItem[],
    buyerInfo?: { buyerName?: string; buyerEmail?: string; buyerPhone?: string },
    paypalOrderId?: string,
    extraPaymentDetails?: Record<string, unknown>
  ): Promise<boolean> => {
    const checkoutItems = itemsToCheckout?.length ? itemsToCheckout : cart;
    if (!checkoutItems.length) return false;
    const subtotal = checkoutItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    try {
      const response = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          buyerName: buyerInfo?.buyerName || currentUser.name,
          buyerEmail: buyerInfo?.buyerEmail || currentUser.email,
          buyerPhone: buyerInfo?.buyerPhone || currentUser.phone || "",
          shippingAddress,
          items: checkoutItems.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            productImage: item.product.imageUrl,
            price: item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            sellerId: item.product.sellerId,
          })),
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          paymentMethod: extraPaymentDetails?.paymentMethod || (paypalOrderId ? "tarjeta" : "contra_entrega"),
          paypalOrderId,
          ...extraPaymentDetails,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.order) return false;
      setCart([]);
      await saveCartToMongo([]);
      onComplete(data.order);
      return true;
    } catch {
      return false;
    }
  }, [cart, currentUser, saveCartToMongo]);

  return { cart, setCart, handleAddToCart, handleRemoveFromCart, handleUpdateCartQuantity, handleCheckoutCart };
}
