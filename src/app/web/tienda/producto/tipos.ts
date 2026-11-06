import type { Product, User } from "../../../../types";

export interface ShippingOptionItem {
  carrier: string;
  aging: string;
  shippingCost: number;
}

export interface ProductoIdTiendaViewProps {
  selectedProduct: Product | null;
  users: User[];
  handleBackToCatalog: () => void;
  onCreatorClick: (creatorId: string) => void;
  onAddToCart: (product: Product) => void;
  openCartDrawer: () => void;
  onProductViewsUpdated?: (productId: string, views: number) => void;
}

export interface GrupoVariante {
  name: string;
  options: string[];
}
