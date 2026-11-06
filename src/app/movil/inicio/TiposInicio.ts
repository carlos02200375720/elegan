import type { Reel, Product, User, Comment, CartItem, NavigationTab } from "../tipos";

export interface AndroidInicioProps {
  reels: Reel[];
  currentUser: User;
  onLikeReel: (reelId: string) => void;
  onCommentReel?: (reelId: string, commentText: string) => void;
  onAddComment?: (reelId: string, commentText: string) => void;
  onSelectProduct?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  products?: Product[];
  onOpenPublishModal?: () => void;
  onToggleSaveReel: (reelId: string) => void;
  savedReelIds: string[];
  onSelectUser?: (user: User) => void;
  onCreatorClick?: (creatorId: string) => void;
  users?: User[];
  isFeedActive?: boolean;
  onOpenSocial?: () => void;
  unreadCount?: number;
  totalUnreads?: number;
  onNavigateToTab?: (tab: NavigationTab) => void;
  onNavigateToPath?: (path: string) => void;
  onAuthRequired?: (actionDescription?: string) => void;
  onGuestInteraction?: (action: string) => void;
  onRefreshReels?: () => void;
  isLoading?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  bottomNavHeight?: number;
  cart?: CartItem[];
  onRemoveFromCart?: (productId: string, idx?: number) => void;
  onUpdateCartQuantity?: (productId: string, qty: number, idx?: number) => void;
  onNavigateToShop?: () => void;
  onNavigateToCheckout?: (selectedIndices?: number[]) => void;
  onNavigateToProfile?: () => void;
  initialReelId?: string | null;
  onActiveReelChange?: (reelId: string) => void;
}

export type PublicationFormat = "1:1" | "3:4" | "4:3";
