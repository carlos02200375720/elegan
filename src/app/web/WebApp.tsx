import React from "react";
import { User, Reel, Product, CartItem, Order, ChatMessage, NavigationTab, isGuestUser } from "../../types";
import WebSidebar from "./WebSidebar";
import Tienda from "./tienda";
import SocialPanel from "./SocialPanel";
import Perfil from "./perfil";
import AdminView from "../admin/resumen";
import { motion, AnimatePresence } from "motion/react";
import { sessionState } from "../../utils/sessionState";
import { navigateTo, parseRoute, getProfilePath, getProfileSavedPath, getProfileCompraPath, getProfileConfigPath, getProfileProductoPath, getProfileVentaPath, getProfilePublicacionesPath, getProfilePublicarPath, getProfileRendimientoPath, getProductPath, getThankYouPath } from "../../router";
import { isSuperAdmin } from "../../superAdmin";
import { trackFunnelStep } from "../../utils/analyticsTracker";

export interface WebAppProps {
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
    extraPaymentDetails?: any
  ) => void;
  handleCreatorProfileLink: (creatorId: string) => void;
  handleProductDetailsLink: (product: Product) => void;
  handleReelLink: (reelId: string) => void;
  handleLikeReel: (reelId: string) => void;
  handleAddComment: (reelId: string, text: string) => void;
  handleToggleSaveReel: (reelId: string) => void;
  handleSendPrivateMessage: (text: string) => void;
  handleClearUnreads: (userId: string) => void;
  refreshProducts?: () => void;
  refreshReels?: () => void;
  refreshAllData: () => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => void;
  setGuestInteractionAlert: (alert: string | null) => void;
  openPrivateChatDirectly: (targetUser: User) => void;
  socket: WebSocket | null;
  activePlatform?: 'android' | 'web';
  onSwitchPlatform?: (target: 'android' | 'web') => void;
}

export default function WebApp({
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
  refreshProducts,
  refreshAllData,
  setCurrentUser,
  setUsers,
  setReels,
  setProducts,
  setIsLoggedIn,
  handleLogout,
  setGuestInteractionAlert,
  openPrivateChatDirectly,
  socket,
  activePlatform,
  onSwitchPlatform,
}: WebAppProps) {
  const [profileInitialSubTab, setProfileInitialSubTab] = React.useState<"publish" | "publications" | "products" | "saved" | "orders" | "performance" | "edit" | undefined>(undefined);

  const handleClearInitialStep = React.useCallback(() => {
    setShopInitialStep('catalog');
    setShopInitialSelectedIndices([]);
  }, [setShopInitialStep, setShopInitialSelectedIndices]);

  const handleClearInitialSubTab = React.useCallback(() => {
    setProfileInitialSubTab((prev) => (prev === undefined ? prev : undefined));
  }, []);

  React.useEffect(() => {
    trackFunnelStep("page_visit", {
      path: typeof window !== "undefined" ? window.location.pathname : `/${activeTab}`,
    });
  }, [activeTab]);

  return (
    <div className="w-full flex-1 flex relative" id="web-app-layout">
      {/* Desktop Responsive Left Navigation Sidebar */}
      <WebSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        totalUnreads={totalUnreads}
        selectedCreatorProfileId={selectedCreatorProfileId}
        setSelectedCreatorProfileId={setSelectedCreatorProfileId}
        onOpenSaved={() => {
          setSelectedCreatorProfileId(null);
          setProfileInitialSubTab("saved");
          setActiveTab("profile");
          navigateTo(getProfileSavedPath(currentUser));
        }}
        onOpenPurchaseHistory={() => {
          setSelectedCreatorProfileId(null);
          setProfileInitialSubTab("orders");
          setActiveTab("profile");
          navigateTo(getProfileCompraPath(currentUser));
        }}
        hideMobileHamburger={
          activeTab === 'shop' &&
          (isProductDetailOpen ||
            Boolean(directSelectedProduct) ||
            shopInitialStep === 'detail' ||
            shopInitialStep === 'checkout' ||
            shopInitialStep === 'payment')
        }
      />

      {/* Main Web Views Canvas */}
      <main
        className="flex-1 w-full md:pl-60 lg:pl-64 min-h-screen pb-0 bg-white"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {activeTab === 'shop' && (
              <Tienda
                products={products}
                cart={cart}
                users={users}
                currentUser={currentUser}
                savedReelIds={savedReelIds}
                onToggleSave={handleToggleSaveReel}
                onGuestInteraction={(action) => {
                  setGuestInteractionAlert(`Para ${action}, por favor inicia sesión o regístrate en la app.`);
                }}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onCheckout={handleCheckoutCart}
                onRefreshProducts={refreshProducts || refreshAllData}
                onCreatorClick={handleCreatorProfileLink}
                selectedProductDirectly={directSelectedProduct}
                clearDirectProduct={() => setDirectSelectedProduct(null)}
                onNavigateToHistory={() => {
                  setSelectedCreatorProfileId(null);
                  setProfileInitialSubTab('orders');
                  setActiveTab('profile');
                  navigateTo(getProfileCompraPath(currentUser));
                }}
                onLoginSuccess={(loggedUser) => {
                  const realUserId = (loggedUser.id && loggedUser.id !== "current_user") ? loggedUser.id : (loggedUser.originalId || loggedUser.id);
                  const normalizedUser: User = {
                    ...loggedUser,
                    id: realUserId,
                    originalId: loggedUser.originalId || realUserId,
                    isGuest: false,
                  };
                  setCurrentUser(normalizedUser);
                  setIsLoggedIn(true);
                  sessionState.setAuthenticated(true);
                  sessionState.setUsername(normalizedUser.email || "");
                  sessionState.setUser(normalizedUser);
                  setSelectedCreatorProfileId(null);
                  setActiveTab('shop');
                  setShopInitialStep('catalog');
                  navigateTo('/tienda/catalogo');
                }}
                onToggleDetailView={setIsProductDetailOpen}
                initialStep={shopInitialStep}
                initialSelectedCartIndices={shopInitialSelectedIndices}
                onClearInitialStep={handleClearInitialStep}
                onProductSelect={(prod) => {
                  setDirectSelectedProduct(prod);
                  navigateTo(getProductPath(prod));
                }}
                onBackToCatalog={() => {
                  setDirectSelectedProduct(null);
                  setIsProductDetailOpen(false);
                  setShopInitialStep('catalog');
                  navigateTo('/tienda/catalogo');
                }}
                onStepChange={(step, stepOrderId) => {
                  setShopInitialStep(step);
                  if (step === 'checkout') {
                    navigateTo('/tienda/verificacion');
                  } else if (step === 'cart') {
                    navigateTo('/tienda/carrito');
                  } else if (step === 'thankyou') {
                    navigateTo(getThankYouPath(stepOrderId));
                  } else if (step === 'catalog') {
                    setDirectSelectedProduct(null);
                    setIsProductDetailOpen(false);
                    navigateTo('/tienda/catalogo');
                  }
                }}
              />
            )}

            {activeTab === 'profile' && (
              <div className="w-full pb-6" id="web-profile-container">
                <Perfil
                  currentUser={currentUser}
                  selectedCreatorId={selectedCreatorProfileId}
                  users={users}
                  products={products}
                  savedReelIds={savedReelIds}
                  onToggleSave={handleToggleSaveReel}
                  initialSubTab={profileInitialSubTab}
                  onClearInitialSubTab={handleClearInitialSubTab}
                  onBackToSelf={() => {
                    setSelectedCreatorProfileId(null);
                    navigateTo(getProfilePath(currentUser));
                  }}
                  onOpenDirectChat={openPrivateChatDirectly}
                  onSelectProduct={handleProductDetailsLink}
                  onSelectReel={handleReelLink}
                  onProfileUpdate={(updatedUser) => {
                    const wasGuest = isGuestUser(currentUser);
                    setCurrentUser(updatedUser);
                    sessionState.setUser(updatedUser);
                    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                    if (!isGuestUser(updatedUser)) {
                      setIsLoggedIn(true);
                      sessionState.setAuthenticated(true);
                      sessionState.setUsername(updatedUser.email || "");
                      const parsed = typeof window !== 'undefined' ? parseRoute(window.location.pathname) : null;
                      if (parsed?.type === 'profile' && parsed.profileTab === 'config') {
                        setActiveTab('profile');
                        navigateTo(getProfileConfigPath(updatedUser));
                        return;
                      }
                      if (wasGuest) {
                        setActiveTab('shop');
                        setShopInitialStep('catalog');
                        navigateTo('/tienda/catalogo');
                        return;
                      }
                      setActiveTab('profile');
                      if (parsed?.type === 'profile' && parsed.profileTab === 'guardado') {
                        navigateTo(getProfileSavedPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'compra') {
                        navigateTo(getProfileCompraPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'producto') {
                        navigateTo(getProfileProductoPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'venta') {
                        navigateTo(getProfileVentaPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'publicaciones') {
                        navigateTo(getProfilePublicacionesPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'publicar') {
                        navigateTo(getProfilePublicarPath(updatedUser));
                      } else if (parsed?.type === 'profile' && parsed.profileTab === 'rendimiento') {
                        navigateTo(getProfileRendimientoPath(updatedUser));
                      } else {
                        navigateTo(getProfilePath(updatedUser));
                      }
                    }
                  }}
                  onRefreshUsers={refreshAllData}
                  onPublishSuccess={refreshAllData}
                  onLogout={handleLogout}
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
                  setActiveTab('shop');
                  navigateTo('/tienda/catalogo');
                }}
              />
            )}

            {activeTab === 'admin' && isSuperAdmin(currentUser) && (
              <div className="w-full pb-10" id="web-admin-container">
                <AdminView
                  currentUser={currentUser}
                  users={users}
                  reels={reels}
                  products={products}
                  onRefreshAll={refreshAllData}
                  onCreatorClick={(creatorId) => {
                    handleCreatorProfileLink(creatorId);
                  }}
                  onProductClick={handleProductDetailsLink}
                  onReelClick={handleReelLink}
                  onNavigateToTab={(tab) => {
                    setSelectedCreatorProfileId(null);
                    setActiveTab(tab);
                    if (tab === 'profile') {
                      navigateTo(getProfilePath(currentUser));
                    } else if (tab === 'inicio' || tab === 'reels') {
                      setActiveTab('shop');
                      navigateTo('/tienda/catalogo');
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
                  activePlatform={activePlatform}
                  onSwitchPlatform={onSwitchPlatform}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
