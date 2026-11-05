import { Product, CartItem, User, Order, Reel } from "../../../../types";
import { AndroidCheckoutForm } from "../verificacion";

export interface AndroidCategory {
  id: string;
  name: string;
  queryTerm?: string;
  imageUrl: string;
}

export interface AndroidShopProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: Record<string, string>,
    selectedVariantVid?: string
  ) => void;
  cart: CartItem[];
  currentUser: User;
  onUpdateCartQuantity?: (param1: any, param2: any, param3?: any) => void;
  onRemoveFromCart?: (param1: any, param2?: any) => void;
  onClearCart?: () => void;
  users: User[];
  onSelectProduct?: (product: Product) => void;
  onSelectUser?: (user: User) => void;
  onCreatorClick?: (creatorId: string) => void;
  onOrderPlaced?: () => void;
  onOpenSocial?: () => void;
  unreadCount?: number;
  initialSelectedProduct?: Product | null;
  selectedProductDirectly?: Product | null;
  clearDirectProduct?: () => void;
  onClearInitialProduct?: () => void;
  onBackToCatalog?: () => void;
  reels?: Reel[];
  orders?: Order[];
  onUpdateOrders?: (orders: Order[]) => void;
  onCheckout?: (
    address: string,
    shippingCost: number,
    onComplete: (newOrder: Order) => void,
    itemsToCheckout?: CartItem[],
    buyerInfo?: { buyerName?: string; buyerEmail?: string; buyerPhone?: string },
    paypalOrderId?: string,
    extraPaymentDetails?: {
      paymentMethod?: string;
      paymentReceiptUrl?: string | null;
      receiptFileName?: string;
      bankName?: string;
    }
  ) => Promise<boolean>;
  requiresLoginForCheckout?: boolean;
  onLoginRequiredForCheckout?: (itemsToCheckout: CartItem[]) => void;
  onNavigateToHistory?: () => void;
  onToggleDetailView?: (open: boolean) => void;
  onToggleCart?: (open: boolean) => void;
  initialStep?: "catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou";
  initialSelectedCartIndices?: number[];
  onClearInitialStep?: () => void;
  isLoading?: boolean;
  onRefreshProducts?: () => void;
  cartDrawerRequest?: number;
  savedReelIds?: string[];
  onToggleSave?: (productId: string) => void;
  initialCategory?: string;
}

export type AndroidShopViewProps = AndroidShopProps;
export type { AndroidCheckoutForm };

export interface DisplayProductItem extends Product {
  _renderKey: string;
}
