import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Reel, Product, CartItem, Order, ChatMessage, NavigationTab, isGuestUser } from "./tipos";
import { WebApp, AuthModal } from "./index";
import { getApiUrl, getWebSocketUrl, apiFetch } from "./config";
import { isSuperAdmin } from "./superAdmin";
import { resolveSupportUser, isSupportAdmin } from "./Soportes/utilidades";
import { sesionWeb } from "./sesion";
import { getLocalGuestToken, getOrCreateGuestToken, syncGuestSession } from "./guestToken";
import { trackFunnelStep, trackDailyVisitor } from "./analitica";
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_REELS } from "./datosIniciales";
import { useCurrentRoute, navigateTo, parseRoute, getProfilePath, getProductPath } from "./enrutador";

const deduplicateById = <T extends { id?: string; _id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || item._id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function AppWeb() {
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== "undefined") {
      const route = parseRoute(window.location.pathname);
      if (route.type === "store" || route.type === "profile" || route.type === "login") return "profile";
      if (route.type === "messages") return "messages";
    }
    return "shop";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "")) {
      navigateTo("/tienda/catalogo", { replace: true });
    }
  }, []);

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const token = getLocalGuestToken() || getOrCreateGuestToken();
        const cached = localStorage.getItem(`mall_cart_${token}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      const savedUser = sesionWeb.getUser();
      if (savedUser && savedUser.id) return savedUser;
    }
    return {
      id: "guest_" + (getLocalGuestToken() || "anonymous"),
      name: "Invitado",
      email: "guest@elegan.com",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      bio: "Visitante",
      followers: 0,
      following: 0,
      isGuest: true,
    };
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !currentUser.isGuest);
  const [directSelectedProduct, setDirectSelectedProduct] = useState<Product | null>(null);
  const [selectedCreatorProfileId, setSelectedCreatorProfileId] = useState<string | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [shopInitialStep, setShopInitialStep] = useState<"catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou">("catalog");
  const [shopInitialSelectedIndices, setShopInitialSelectedIndices] = useState<number[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [savedReelIds, setSavedReelIds] = useState<string[]>([]);
  const [guestInteractionAlert, setGuestInteractionAlert] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    trackDailyVisitor("web");
  }, [currentUser.id]);

  const loadInitialData = async () => {
    try {
      const [uRes, pRes, rRes] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/products"),
        apiFetch("/api/reels"),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        if (Array.isArray(uData) && uData.length > 0) setUsers(deduplicateById(uData));
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData) && pData.length > 0) setProducts(deduplicateById(pData));
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData) && rData.length > 0) setReels(deduplicateById(rData));
      }
    } catch (e) {
      console.warn("Notice loading web data:", e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const saveCartToMongo = async (newCart: CartItem[], user: User) => {
    try {
      const token = getLocalGuestToken() || getOrCreateGuestToken();
      localStorage.setItem(`mall_cart_${token}`, JSON.stringify(newCart));
      await apiFetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: newCart, userId: user.id }),
      });
    } catch {}
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id);
      let updated: CartItem[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 };
      } else {
        updated = [...prev, { product, quantity: 1 }];
      }
      saveCartToMongo(updated, currentUser);
      return updated;
    });
  };

  const handleRemoveFromCart = (productId: string, cartItemIndex?: number) => {
    setCart((prev) => {
      const updated = prev.filter((item, idx) => (cartItemIndex !== undefined ? idx !== cartItemIndex : item.product.id !== productId));
      saveCartToMongo(updated, currentUser);
      return updated;
    });
  };

  const handleUpdateCartQuantity = (productId: string, qty: number, cartItemIndex?: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((item, idx) => (cartItemIndex !== undefined ? idx !== cartItemIndex : item.product.id !== productId));
      const updated = prev.map((item, idx) => {
        if (cartItemIndex !== undefined ? idx === cartItemIndex : item.product.id === productId) {
          return { ...item, quantity: qty };
        }
        return item;
      });
      saveCartToMongo(updated, currentUser);
      return updated;
    });
  };

  const handleCheckoutCart = async (
    shippingAddress: string,
    shippingCost: number,
    onComplete: (newOrder: Order) => void,
    itemsToCheckout?: CartItem[],
    buyerInfo?: { buyerName?: string; buyerEmail?: string; buyerPhone?: string },
    paypalOrderId?: string,
    extraPaymentDetails?: any
  ) => {
    const checkoutItems = itemsToCheckout && itemsToCheckout.length > 0 ? itemsToCheckout : cart;
    if (checkoutItems.length === 0) return false;
    const subtotal = checkoutItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const total = subtotal + shippingCost;
    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          buyerName: buyerInfo?.buyerName || currentUser.name,
          buyerEmail: buyerInfo?.buyerEmail || currentUser.email,
          buyerPhone: buyerInfo?.buyerPhone || currentUser.phone || "",
          shippingAddress,
          items: checkoutItems.map((ci) => ({
            productId: ci.product.id,
            productName: ci.product.name,
            productImage: ci.product.imageUrl,
            price: ci.product.price,
            quantity: ci.quantity,
            selectedColor: ci.selectedColor,
            selectedSize: ci.selectedSize,
            sellerId: ci.product.sellerId,
          })),
          subtotal,
          shippingCost,
          total,
          paymentMethod: extraPaymentDetails?.paymentMethod || (paypalOrderId ? "tarjeta" : "contra_entrega"),
          paypalOrderId,
          ...extraPaymentDetails,
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setCart([]);
        onComplete(data.order);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSendPrivateMessage = (text: string) => {
    if (!text.trim()) return;
    const recipient = activeChatUser || resolveSupportUser(users);
    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      senderId: currentUser.id,
      receiverId: recipient.id,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setPrivateMessages((prev) => [...prev, newMsg]);
    apiFetch("/api/chats/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg),
    }).catch(() => {});
  };

  const totalUnreads: number = Object.values(unreadCounts).reduce<number>((acc, val) => acc + (val as number), 0);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950" id="web-root-app">
      <div className="flex flex-1 w-full min-h-screen" id="app-web-container">
        <WebApp
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          users={users}
          reels={reels}
          products={products}
          cart={cart}
          currentUser={currentUser}
          directSelectedProduct={directSelectedProduct}
          setDirectSelectedProduct={setDirectSelectedProduct}
          selectedCreatorProfileId={selectedCreatorProfileId}
          setSelectedCreatorProfileId={setSelectedCreatorProfileId}
          isProductDetailOpen={isProductDetailOpen}
          setIsProductDetailOpen={setIsProductDetailOpen}
          shopInitialStep={shopInitialStep}
          setShopInitialStep={setShopInitialStep}
          shopInitialSelectedIndices={shopInitialSelectedIndices}
          setShopInitialSelectedIndices={setShopInitialSelectedIndices}
          activeChatUser={activeChatUser}
          setActiveChatUser={setActiveChatUser}
          privateMessages={privateMessages}
          unreadCounts={unreadCounts}
          savedReelIds={savedReelIds}
          isLiveViewerOpen={false}
          totalUnreads={totalUnreads}
          handleAddToCart={handleAddToCart}
          handleRemoveFromCart={handleRemoveFromCart}
          handleUpdateCartQuantity={handleUpdateCartQuantity}
          handleCheckoutCart={handleCheckoutCart}
          handleCreatorProfileLink={(cId) => {
            setSelectedCreatorProfileId(cId);
            setActiveTab("profile");
            navigateTo(getProfilePath(cId));
          }}
          handleProductDetailsLink={(prod) => {
            setDirectSelectedProduct(prod);
            setActiveTab("shop");
            setShopInitialStep("detail");
            navigateTo(getProductPath(prod));
          }}
          handleReelLink={() => {}}
          handleLikeReel={() => {}}
          handleAddComment={() => {}}
          handleToggleSaveReel={(rId) => {
            setSavedReelIds((prev) => (prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]));
          }}
          handleSendPrivateMessage={handleSendPrivateMessage}
          handleClearUnreads={(uId) => {
            setUnreadCounts((prev) => ({ ...prev, [uId]: 0 }));
          }}
          refreshReels={loadInitialData}
          refreshAllData={loadInitialData}
          setCurrentUser={setCurrentUser}
          setUsers={setUsers}
          setReels={setReels}
          setProducts={setProducts}
          setIsLoggedIn={setIsLoggedIn}
          handleLogout={() => {
            sesionWeb.clear();
            setIsLoggedIn(false);
            window.location.reload();
          }}
          setGuestInteractionAlert={setGuestInteractionAlert}
          openPrivateChatDirectly={(u) => {
            setActiveChatUser(u);
            setActiveTab("messages");
            navigateTo("/messages");
          }}
          socket={socketRef.current}
          activePlatform="web"
          onSwitchPlatform={(p) => {
            if (p === "android") navigateTo("/movil.html");
          }}
        />
      </div>

      <AuthModal
        isOpen={Boolean(guestInteractionAlert)}
        actionDescription={guestInteractionAlert || "interactuar con la tienda"}
        onClose={() => setGuestInteractionAlert(null)}
        onLoginSuccess={(loggedUser) => {
          setCurrentUser(loggedUser);
          setIsLoggedIn(true);
          sesionWeb.setUser(loggedUser);
          setGuestInteractionAlert(null);
        }}
      />
    </div>
  );
}
