import { Product, CartItem, User } from "../../tipos";

export interface ShippingOptionItem {
  carrier: string;
  aging: string;
  shippingCost: number;
}

export interface VariantGroup {
  name: string;
  options: string[];
}

export interface VariantSwatch {
  name: string;
  color?: string;
  imageUrl: string;
}

export type PolicyType = "pago" | "envio" | "garantia" | null;

export interface AndroidProductoIdProps {
  selectedProduct: Product;
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: Record<string, string>,
    selectedVariantVid?: string
  ) => void;
  cart: CartItem[];
  users: User[];
  onCreatorClick?: (creatorId: string) => void;
  onToggleSave?: (productId: string) => void;
  savedReelIds?: string[];
  onBackToCatalog: () => void;
  openCartPage: () => void;
  isCartShockwave: boolean;
  shockwaveKey: number;
  triggerCartShockwave: () => void;
}
