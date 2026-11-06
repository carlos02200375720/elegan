import type React from "react";
import type { Product, CartItem } from "../../../types";

export interface CarritoTiendaViewProps {
  showCartDrawer: boolean;
  closeCartDrawer: () => void;
  cart: CartItem[];
  cartItemCount: number;
  selectedCartIndices: number[];
  isAllCartSelected: boolean;
  toggleSelectAllCart: () => void;
  toggleItemSelection: (index: number, e?: React.MouseEvent) => void;
  onRemoveFromCart: (productId: string, cartItemIndex?: number) => void;
  onUpdateCartQuantity: (productId: string, qty: number, cartItemIndex?: number) => void;
  onSelectProductFromCart: (product: Product) => void;
  selectedCartItems: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  startCheckout: () => void;
}
