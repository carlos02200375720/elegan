import { Product, CartItem } from "../../../../types";

export interface AndroidCarritoProps {
  cart: CartItem[];
  selectedCartIndices: number[];
  isAllCartSelected: boolean;
  toggleSelectAllCart: () => void;
  toggleSelectCartItem: (idx: number) => void;
  selectedCartItems: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  handleItemRemove: (idx: number, item: CartItem) => void;
  handleItemQtyChange: (idx: number, item: CartItem, newQty: number) => void;
  onSelectProduct: (product: Product) => void;
  onProceedToCheckout: () => void;
  onCloseCart: () => void;
  onExploreProducts: () => void;
  presentation?: "page" | "drawer";
}
