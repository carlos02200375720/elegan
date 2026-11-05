import React from "react";
import { User, Reel, Product, CartItem, Order, ChatMessage, NavigationTab, isGuestUser } from "../../types";
import Inicio from "./inicio/Inicio";
import BarraNavegacion from "./componente/barranavegacion";
import Tienda from "./tienda";
import SocialPanel from "./SocialPanel";
import Perfil from "./cuenta";
import PerfilLogin from "./cuenta/login";
import AdminView from "../admin/resumen";
import { isSuperAdmin } from "../../superAdmin";
import { motion, AnimatePresence } from "motion/react";
import { sessionState } from "../../utils/sessionState";
import { navigateTo, getProfilePath, getProfileCompraPath, getProductPath, getInicioPath, useCurrentRoute } from "../../router";

export interface AndroidAppProps {
  activeTab: NavigationTab;
  setActiveTab: React.Dispatch<React.SetStateAction<NavigationTab>>;
  users: User[];
  reels: Reel[];
  products: Product[];
  cart: CartItem[];
  currentUser: User;
  directSelectedProduct: Product | null;
  setDirectSelectedProduct: (product: Product | null) => void;
  selectedCreatorProfileId: string | null;
  setSelectedCreatorProfileId: (creatorId: string | null) => void;
  isProductDetailOpen: boolean;
  setIsProductDetailOpen: (open: boolean) => void;
  shopInitialStep: 'catalog' | 'detail' | 'cart' | 'checkout' | 'payment' | 'thankyou';
  setShopInitialStep: (step: 'catalog' | 'detail' | 'cart' | 'checkout' | 'payment' | 'thankyou') => void;
  shopInitialSelectedIndices: number[];
  setShopInitialSelectedIndices: (indices: number[]) => void;
  activeChatUser: User | null;
  setActiveChatUser: (user: User | null) => void;
  privateMessages: ChatMessage[];
  unreadCounts: Record<string, number>;
  savedReelIds: string[];
  isLiveViewerOpen: boolean;
  totalUnreads: number;
  targetReelId?: string | null;
  handleAddToCart: (product: Product, quantity?: number, selectedOptions?: Record<string, string>, selectedVariantVid?: string) => void;
  handleRemoveFromCart: (productId: string, idx?: number) => void;
  handleUpdateCartQuantity: (productId: string, qty: number, idx?: number) => void;
  handleCheckoutCart: (
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
  handleCreatorProfileLink: (creatorId: string) => void;
  handleProductDetailsLink: (product: Product) => void;
  handleReelLink: (reelId: string) => void;
  handleLikeReel: (reelId: string) => void;
  handleAddComment: (reelId: string, text: string) => void;
  handleToggleSaveReel: (reelId: string) => void;
  handleSendPrivateMessage: (text: string) => void;
  handleClearUnreads: (userId: string) => void;
  refreshReels: () => void;
  refreshProducts?: () => void;
  refreshAllData: () => void;
  isInitialLoading?: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setReels?: React.Dispatch<React.SetStateAction<Reel[]>>;
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  isLoggedIn?: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  setGuestInteractionAlert: (alert: string | null) => void;
  openPrivateChatDirectly: (targetUser: User) => void;
  socket: WebSocket | null;
}

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

export default function AndroidApp({
  activeTab,
  setActiveTab,
  users,
  reels,
  products,
  cart,
  currentUser,
  directSelectedProduct,
  setDirectSelectedProduct,
  selectedCreatorProfileId,
  setSelectedCreatorProfileId,
  isProductDetailOpen,
  setIsProductDetailOpen,
  shopInitialStep,
  setShopInitialStep,
  shopInitialSelectedIndices,
  setShopInitialSelectedIndices,
  activeChatUser,
  setActiveChatUser,
  privateMessages,
  unreadCounts,
  savedReelIds,
  isLiveViewerOpen,
  totalUnreads,
  targetReelId,
  handleAddToCart,
  handleRemoveFromCart,
  handleUpdateCartQuantity,
  handleCheckoutCart,
  handleCreatorProfileLink,
  handleProductDetailsLink,
  handleReelLink,
  handleLikeReel,
  handleAddComment,
  handleToggleSaveReel,
  handleSendPrivateMessage,
  handleClearUnreads,
  refreshReels,
  refreshProducts,
  refreshAllData,
  isInitialLoading,
  setCurrentUser,
  setUsers,
  setReels = () => {},
  setProducts = () => {},
  isLoggedIn,
  setIsLoggedIn,
  handleLogout,
  setGuestInteractionAlert,
  openPrivateChatDirectly,
  socket,
}: AndroidAppProps) {
  const currentRoute = useCurrentRoute();
  const isUserLoggedIn = true;
  const hasActiveAccount = (isLoggedIn ?? sessionState.isAuthenticated()) && !isGuestUser(currentUser);
  const requiresLogin = !hasActiveAccount;
  const isLoginPage = currentRoute.type === "login";
  const isHomeActive = activeTab === 'inicio' || activeTab === 'reels';
  const isDarkNavActive = false;
  const [navBarHeight, setNavBarHeight] = React.useState(56);
  const [cartDrawerRequest, setCartDrawerRequest] = React.useState(0);
  const [isCartPageOpen, setIsCartPageOpen] = React.useState(false);
  const [shopInitialCategory, setShopInitialCategory] = React.useState("Todos");
  const [profileInitialTab, setProfileInitialTab] = React.useState<"reels" | "products" | "saved" | "orders" | undefined>(undefined);
  const [pendingCheckoutItems, setPendingCheckoutItems] = React.useState<CartItem[] | null>(null);

  const handleClearInitialStep = React.useCallback(() => {
    setShopInitialStep('catalog');
    setShopInitialSelectedIndices([]);
  }, [setShopInitialStep, setShopInitialSelectedIndices]);

  const handleClearInitialTab = React.useCallback(() => {
    setProfileInitialTab(undefined);
  }, []);

  const requestCheckoutLogin = (itemsToCheckout: CartItem[]) => {
    setPendingCheckoutItems(itemsToCheckout);
    setShopInitialStep('checkout');
    setActiveTab('profile');
    navigateTo('/perfil/login?returnTo=checkout');
  };

  const handleToggleSaveProduct = (productId: string) => {
    if (requiresLogin) {
      setActiveTab('profile');
      navigateTo('/perfil/login?returnTo=shop');
      return;
    }
    handleToggleSaveReel(productId);
  };

  React.useEffect(() => {
    const updateNavHeight = () => {
      const nav = document.getElementById("android-bottom-nav-bar");
      if (nav) {
        const navRect = nav.getBoundingClientRect();
        const h = Math.ceil(nav.offsetHeight + Math.max(0, window.innerHeight - navRect.bottom)) || 56;
        setNavBarHeight((prev) => (prev === h ? prev : h));
      }
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    const nav = document.getElementById("android-bottom-nav-bar");
    let ro: ResizeObserver | null = null;
    if (nav) {
      ro = new ResizeObserver(updateNavHeight);
      ro.observe(nav);
    }
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      ro?.disconnect();
    };
  }, [activeTab]);

  const handleActiveReelChange = React.useCallback((reelId: string) => {
    const activeReel = reels.find((r) => r.id === reelId);
    const targetPath = getInicioPath(activeReel || reelId);
    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      navigateTo(targetPath, { replace: true });
    }
  }, [reels]);

  const handleDeleteReel = async (reelId: string) => {
    try {
      const res = await fetch(`/api/android/reels/${reelId}`, { method: 'DELETE' });
      if (!res.ok) {
        await fetch(`/api/reels/${reelId}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.error("Error deleting reel:", err);
    } finally {
      refreshReels();
      refreshAllData();
    }
  };

  return (
    <div
      className="w-full flex-1 flex flex-col relative no-scrollbar"
      id="android-app-layout"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        fontFamily: 'Roboto, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Main Content Router */}
      <main
        className={`flex-1 w-full no-scrollbar ${isDarkNavActive ? "bg-slate-950" : "bg-white"}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginBottom: (activeTab === 'messages' && activeChatUser) || isLiveViewerOpen || isHomeActive
            ? 0
            : undefined
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isHomeActive ? 'inicio' : activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`w-full ${isHomeActive ? 'h-full' : ''}`}
          >
            {isHomeActive && (
              <Inicio
                reels={reels}
                currentUser={currentUser}
                users={users}
                products={products}
                bottomNavHeight={navBarHeight}
                cart={cart}
                totalUnreads={totalUnreads}
                isLoading={isInitialLoading}
                onRefreshReels={refreshReels}
                onNavigateToTab={(tab) => {
                  setSelectedCreatorProfileId(null);
                  setActiveTab(tab);
                  if (tab === 'profile') {
                    navigateTo(getProfilePath(currentUser));
                  } else if (tab === 'inicio' || tab === 'reels') {
                    refreshReels();
                    navigateTo('/inicio');
                  } else if (tab === 'shop') {
                    navigateTo('/tienda/catalogo');
                  } else if (tab === 'messages') {
                    navigateTo('/messages');
                  } else if (tab === 'admin') {
                    navigateTo('/admin/resumen');
                  }
                }}
                onNavigateToPath={(path) => {
                  const route = parseRoute(path.split(/[?#]/, 1)[0]);
                  setSelectedCreatorProfileId(null);
                  if (route.type === 'product' || route.type === 'shop' || route.type === 'cart' ||
                      route.type === 'checkout' || route.type === 'thankyou') {
                    setActiveTab('shop');
                  } else if (route.type === 'inicio' || route.type === 'reels') {
                    setActiveTab('inicio');
                  } else if (route.type === 'profile' || route.type === 'login') {
                    setActiveTab('profile');
                  } else if (route.type === 'messages') {
                    setActiveTab('messages');
                  } else if (route.type === 'admin') {
                    setActiveTab('admin');
                  }
                  navigateTo(path);
                }}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onNavigateToShop={() => {
                  setActiveTab('shop');
                  navigateTo('/tienda/catalogo');
                }}
                onNavigateToCheckout={(selectedIndices) => {
                  if (requiresLogin) {
                    requestCheckoutLogin((selectedIndices || []).map((index) => cart[index]).filter(Boolean));
                    return;
                  }
                  setShopInitialStep('checkout');
                  setShopInitialSelectedIndices(selectedIndices || []);
                  setActiveTab('shop');
                  navigateTo('/tienda/verificacion');
                }}
                onProductClick={handleProductDetailsLink}
                onCreatorClick={handleCreatorProfileLink}
                onLikeReel={handleLikeReel}
                onAddComment={handleAddComment}
                savedReelIds={savedReelIds}
                onToggleSaveReel={handleToggleSaveReel}
                onAuthRequired={() => {
                  setSelectedCreatorProfileId(null);
                  setActiveTab('profile');
                  navigateTo('/perfil/login');
                }}
                onNavigateToProfile={() => {
                  setSelectedCreatorProfileId(null);
                  setActiveTab('profile');
                  navigateTo(getProfilePath(currentUser));
                }}
                onGuestInteraction={() => {}}
                initialReelId={targetReelId}
                onActiveReelChange={handleActiveReelChange}
              />
            )}

            {activeTab === 'shop' && (
              <Tienda
                products={products}
                initialCategory={shopInitialCategory}
                cart={cart}
                users={users}
                currentUser={currentUser}
                isLoading={isInitialLoading}
                onRefreshProducts={refreshProducts || refreshAllData}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onCheckout={handleCheckoutCart}
                requiresLoginForCheckout={requiresLogin}
                onLoginRequiredForCheckout={requestCheckoutLogin}
                onCreatorClick={handleCreatorProfileLink}
                selectedProductDirectly={directSelectedProduct}
                clearDirectProduct={() => setDirectSelectedProduct(null)}
                onNavigateToHistory={() => {
                  setSelectedCreatorProfileId(null);
                  setProfileInitialTab('orders');
                  setActiveTab('profile');
                  navigateTo(getProfileCompraPath(currentUser));
                }}
                onToggleDetailView={setIsProductDetailOpen}
                onToggleCart={setIsCartPageOpen}
                initialStep={shopInitialStep}
                initialSelectedCartIndices={shopInitialSelectedIndices}
                onClearInitialStep={handleClearInitialStep}
                onSelectProduct={(p) => {
                  setDirectSelectedProduct(p);
                  setIsProductDetailOpen(true);
                  setShopInitialStep('detail');
                  navigateTo(getProductPath(p));
                }}
                onBackToCatalog={() => {
                  setDirectSelectedProduct(null);
                  setIsProductDetailOpen(false);
                  setShopInitialStep('catalog');
                  navigateTo('/tienda/catalogo');
                }}
                cartDrawerRequest={cartDrawerRequest}
                savedReelIds={savedReelIds}
                onToggleSave={handleToggleSaveProduct}
              />
            )}

            {activeTab === 'profile' &&
              requiresLogin &&
              (!selectedCreatorProfileId ||
                (typeof window !== "undefined" && window.location.pathname.replace(/\/+$/, "") === "/perfil/login")) && (
              <PerfilLogin
                currentUser={currentUser}
                cart={cart}
                savedReelIds={savedReelIds}
                onBack={() => {
                  setSelectedCreatorProfileId(null);
                  setActiveTab('inicio');
                  navigateTo('/inicio');
                }}
                onSuccess={(user, restoredCart = []) => {
                  sessionState.setUser(user);
                  sessionState.setAuthenticated(true);
                  sessionState.setEmail(user.email || "");
                  setCurrentUser(user);
                  setIsLoggedIn(true);
                  setUsers((previous) => {
                    const existingIndex = previous.findIndex(
                      (item) =>
                        item.id === user.id ||
                        (item.username && user.username &&
                          item.username.toLowerCase() === user.username.toLowerCase())
                    );
                    if (existingIndex >= 0) {
                      const next = [...previous];
                      next[existingIndex] = user;
                      return next;
                    }
                    return [...previous, user];
                  });
                  setSelectedCreatorProfileId(null);
                  const shouldResumeCheckout =
                    pendingCheckoutItems !== null ||
                    new URLSearchParams(window.location.search).get('returnTo') === 'checkout';
                  if (shouldResumeCheckout) {
                    const selectedIndices = restoredCart.reduce<number[]>((indices, item, index) => {
                      if (pendingCheckoutItems?.some((pendingItem) => cartItemsMatch(pendingItem, item))) {
                        indices.push(index);
                      }
                      return indices;
                    }, []);
                    setShopInitialStep('checkout');
                    setShopInitialSelectedIndices(selectedIndices);
                    setActiveTab('shop');
                    setPendingCheckoutItems(null);
                    navigateTo('/tienda/verificacion');
                  } else if (new URLSearchParams(window.location.search).get('returnTo') === 'shop') {
                    setActiveTab('shop');
                    navigateTo(directSelectedProduct ? getProductPath(directSelectedProduct) : '/tienda/catalogo');
                  } else {
                    navigateTo(getProfilePath(user));
                  }
                }}
              />
            )}

            {activeTab === 'profile' && (hasActiveAccount || selectedCreatorProfileId) && (
              <div
                className="w-full bg-white min-h-screen"
                id="android-profile-container"
                style={{
                  paddingBottom: `${navBarHeight + 3}px`
                }}
              >
                <Perfil
                    currentUser={currentUser}
                    selectedCreatorId={selectedCreatorProfileId}
                    users={users}
                    reels={reels}
                    products={products}
                    savedReelIds={savedReelIds}
                    onToggleSaveReel={handleToggleSaveReel}
                    initialTab={profileInitialTab}
                    onClearInitialTab={handleClearInitialTab}
                    onBackToSelf={() => {
                      setSelectedCreatorProfileId(null);
                      navigateTo(getProfilePath(currentUser));
                    }}
                    onOpenDirectChat={openPrivateChatDirectly}
                    onSelectProduct={handleProductDetailsLink}
                    onSelectReel={handleReelLink}
                    onProfileUpdate={(updatedUser) => {
                      setCurrentUser(updatedUser);
                      sessionState.setUser(updatedUser);
                      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                      if (updatedUser.username && updatedUser.username !== "invitado" && !updatedUser.isGuest) {
                        setIsLoggedIn(true);
                        sessionState.setAuthenticated(true);
                        sessionState.setEmail(updatedUser.email || "");
                        setSelectedCreatorProfileId(null);
                        setActiveTab('profile');
                        navigateTo(getProfilePath(updatedUser));
                      }
                    }}
                    onRefreshUsers={refreshAllData}
                    onPublishSuccess={refreshAllData}
                    onDeleteReel={handleDeleteReel}
                    onLogout={handleLogout}
                    cart={cart}
                    onOpenCart={() => {
                      setActiveTab('shop');
                      setShopInitialStep('cart');
                      navigateTo('/tienda/carrito');
                    }}
                    socket={socket}
                  />
              </div>
            )}

            {activeTab === 'messages' && (
              <SocialPanel
                users={users}
                currentUser={currentUser}
                messages={privateMessages}
                activeChatUser={activeChatUser}
                onSelectChatUser={setActiveChatUser}
                onSendPrivateMessage={handleSendPrivateMessage}
                unreadCounts={unreadCounts}
                clearUnreads={handleClearUnreads}
                onClose={() => {
                  setActiveTab('inicio');
                  navigateTo('/inicio');
                }}
              />
            )}

            {activeTab === 'admin' && isSuperAdmin(currentUser) && (
              <div
                className="w-full pb-16"
                id="android-admin-container"
                style={{ paddingBottom: `${navBarHeight + 12}px` }}
              >
                <AdminView
                  currentUser={currentUser}
                  users={users}
                  reels={reels}
                  products={products}
                  onRefreshAll={refreshAllData}
                  onCreatorClick={handleCreatorProfileLink}
                  onProductClick={handleProductDetailsLink}
                  onReelClick={handleReelLink}
                  onNavigateToTab={(tab) => {
                    setSelectedCreatorProfileId(null);
                    setActiveTab(tab);
                    if (tab === 'profile') {
                      navigateTo(getProfilePath(currentUser));
                    } else if (tab === 'inicio' || tab === 'reels') {
                      navigateTo('/inicio');
                    } else if (tab === 'shop') {
                      navigateTo('/tienda/catalogo');
                    } else if (tab === 'messages') {
                      navigateTo('/messages');
                    } else if (tab === 'admin') {
                      navigateTo('/admin/resumen');
                    }
                  }}
                  setUsers={setUsers}
                  setReels={setReels}
                  setProducts={setProducts}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BarraNavegacion
        isVisible={!isLoginPage && !(activeTab === "messages" && activeChatUser) && !isLiveViewerOpen && !isProductDetailOpen && !(activeTab === "shop" && isCartPageOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        totalUnreads={totalUnreads}
        requiresLogin={requiresLogin}
        onRefreshReels={refreshReels}
        onClearSelectedCreator={() => setSelectedCreatorProfileId(null)}
      />
    </div>
  );
}
