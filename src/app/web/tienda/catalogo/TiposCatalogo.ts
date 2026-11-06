import { Product, CartItem, Order, User } from "../../tipos";

export interface CategoriaTienda {
  id: string;
  name: string;
  queryTerm: string;
  imageUrl: string;
}

export interface ShopProps {
  products: Product[];
  cart: CartItem[];
  users: User[];
  currentUser: User;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string, cartItemIndex?: number) => void;
  onUpdateCartQuantity: (productId: string, qty: number, cartItemIndex?: number) => void;
  onCheckout: (
    address: string,
    shippingCost: number,
    onComplete: (newOrder: Order) => void,
    itemsToCheckout?: CartItem[],
    buyerInfo?: { buyerName?: string; buyerEmail?: string; buyerPhone?: string },
    paypalOrderId?: string,
    extraPaymentDetails?: {
      paymentMethod?: "transferencia" | "tarjeta" | "contra_entrega";
      paymentReceiptUrl?: string | null;
      receiptFileName?: string;
      bankName?: string;
    }
  ) => Promise<boolean> | boolean | void;
  onCreatorClick: (creatorId: string) => void;
  selectedProductDirectly: Product | null;
  clearDirectProduct: () => void;
  onNavigateToHistory: () => void;
  onToggleDetailView?: (isOpen: boolean) => void;
  onLoginSuccess?: (user: User) => void;
  initialStep?: "catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou";
  initialSelectedCartIndices?: number[];
  onClearInitialStep?: () => void;
  onProductSelect?: (product: Product) => void;
  onBackToCatalog?: () => void;
  onStepChange?: (step: "catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou", orderId?: string) => void;
  onRefreshProducts?: () => void;
  savedReelIds?: string[];
  onToggleSave?: (id: string) => void;
  onGuestInteraction?: (action: string) => void;
}

export type TiendaProps = ShopProps;
export type ShopViewProps = ShopProps;
export type CatalogoTiendaViewProps = ShopProps;

export type PasoTienda = "catalog" | "detail" | "checkout" | "payment" | "thankyou";
