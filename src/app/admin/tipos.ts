import React from "react";

export interface User {
  id: string;
  originalId?: string;
  name: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
  followers: number;
  following: number;
  isGuest?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  shippingAddress?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  role?: string;
  isAdmin?: boolean;
  canSell?: boolean;
  createdAt?: string;
  lastSeenAt?: string;
}

export function isGuestUser(user?: Partial<User> | null): boolean {
  if (!user) return true;
  if (user.isGuest === false) return false;
  return Boolean(
    user.isGuest === true ||
    user.id === "guest" ||
    user.id === "current_user" ||
    user.id?.startsWith("guest_")
  );
}

export interface Comment {
  id: string;
  userId?: string;
  name?: string;
  username?: string;
  avatar: string;
  text: string;
  createdAt: string;
}

export interface Reel {
  id: string;
  title?: string;
  videoUrl: string;
  hlsUrl?: string;
  thumbnailUrl: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  likes: number;
  comments: Comment[];
  shares: number;
  views: number;
  productId?: string;
}

export interface ProductVariantItem {
  id?: string;
  name: string;
  color?: string;
  size?: string;
  price?: number;
  imageUrl?: string;
  sku?: string;
}

export interface ProductShippingOption {
  id?: string;
  label: string;
  origin?: string;
  price: number;
  deliveryTime: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  rating: number;
  shippingCost?: number;
  shippingCapital?: number;
  shippingProvince?: number;
  freeShipping?: boolean;
  images?: string[];
  variants?: {
    name: string;
    options: string[];
  }[];
  variantList?: ProductVariantItem[];
  category?: string;
  views?: number;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerId?: string;
  sellerName?: string;
  carrier?: string;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  label: string;
  timestamp: string;
  note?: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface Order {
  id: string;
  paypalOrderId?: string;
  buyerId?: string;
  buyerName?: string;
  buyerAvatar?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  items: OrderItem[];
  total: number;
  shippingCost?: number;
  shippingAddress: string;
  paymentStatus: "paid" | "pending";
  paymentMethod?: string;
  paymentReceiptUrl?: string;
  receiptFileName?: string;
  bankName?: string;
  receiptVerified?: boolean;
  status?: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  sellerNotes?: string;
  statusHistory?: OrderStatusHistoryItem[];
  createdAt: string;
}

export type NavigationTab = "inicio" | "reels" | "shop" | "messages" | "profile" | "admin";

export type AdminTab = "resumen" | "usuarios" | "reels" | "productos" | "publicar" | "ordenes" | "metrica" | "fotos_defecto" | "sistema";

export type DatosResumen = Record<string, any>;

export interface AdminViewProps {
  currentUser: User;
  users: User[];
  reels: Reel[];
  products: Product[];
  onRefreshAll: () => void;
  onCreatorClick: (creatorId: string) => void;
  onProductClick: (product: Product) => void;
  onReelClick: (reelId: string) => void;
  onNavigateToTab: (tab: NavigationTab) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  activePlatform?: "android" | "web";
  onSwitchPlatform?: (platform: "android" | "web") => void;
}
