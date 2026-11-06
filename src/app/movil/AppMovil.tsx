import React, { useState, useEffect, useRef } from "react";
import type { User, Product, ChatMessage, NavigationTab } from "./tipos";
import { useDatosMovil } from "./datos/useDatosMovil";
import { useCarritoMovil } from "./tienda/useCarritoMovil";
import { useCicloNativo } from "./nativo/useCicloNativo";
import { AndroidApp } from "./index";
import { AuthModal } from "./componente/AuthModal";
import { apiFetch } from "./config";
import { sesionMovil } from "./sesion";
import { trackDailyVisitor } from "./analitica";
import { parseRoute, navigateTo, getProfilePath, getProductPath } from "./enrutador";

export default function AppMovil() {
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== "undefined") {
      const route = parseRoute(window.location.pathname);
      if (route.type === "store" || route.type === "profile" || route.type === "login") return "profile";
      if (route.type === "messages") return "messages";
      if (route.type === "product" || route.type === "shop" || route.type === "cart" || route.type === "checkout") return "shop";
    }
    return "inicio";
  });

  useCicloNativo();
  const { users, setUsers, reels, setReels, products, setProducts, loadData } = useDatosMovil();

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      const savedUser = sesionMovil.getUser();
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
  const { cart, setCart, handleAddToCart, handleRemoveFromCart, handleUpdateCartQuantity, handleCheckoutCart } = useCarritoMovil(currentUser);
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
    trackDailyVisitor("android");
  }, [currentUser.id]);

  const { ocultarPantallaCarga } = useCicloNativo();
  useEffect(() => {
    loadData().finally(ocultarPantallaCarga);
  }, [loadData, ocultarPantallaCarga]);

  const totalUnreads: number = Object.values(unreadCounts).reduce<number>((acc, val) => acc + (val as number), 0);

  return (
    <div className="flex flex-1 w-full min-h-screen justify-center bg-slate-950 font-sans select-none" id="movil-root-app">
      <div className="w-full sm:max-w-[430px] min-h-screen flex flex-col relative sm:border-x sm:border-slate-800 sm:shadow-2xl bg-white">
        <AndroidApp
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
          handleProductDetailsLink={(p) => {
            setDirectSelectedProduct(p);
            setActiveTab("shop");
            setShopInitialStep("detail");
            navigateTo(getProductPath(p));
          }}
          handleReelLink={() => {}}
          handleLikeReel={() => {}}
          handleAddComment={() => {}}
          handleToggleSaveReel={(rId) => {
            setSavedReelIds((prev) => (prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]));
          }}
          handleSendPrivateMessage={(text) => {
            if (!text.trim()) return;
            const newMsg: ChatMessage = {
              id: "msg_" + Date.now(),
              senderId: currentUser.id,
              receiverId: activeChatUser?.id || "support",
              text: text.trim(),
              timestamp: new Date().toISOString(),
              isRead: false,
            };
            setPrivateMessages((prev) => [...prev, newMsg]);
            apiFetch("/api/chats/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newMsg),
            }).catch(() => {});
          }}
          handleClearUnreads={(uId) => {
            setUnreadCounts((prev) => ({ ...prev, [uId]: 0 }));
          }}
          refreshReels={loadData}
          refreshProducts={loadData}
          refreshAllData={loadData}
          isInitialLoading={false}
          setCurrentUser={setCurrentUser}
          setUsers={setUsers}
          setReels={setReels}
          setProducts={setProducts}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          handleLogout={() => {
            sesionMovil.clear();
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
        />
      </div>

      <AuthModal
        isOpen={Boolean(guestInteractionAlert)}
        actionDescription={guestInteractionAlert || "interactuar con las publicaciones"}
        onClose={() => setGuestInteractionAlert(null)}
        onLoginSuccess={(loggedUser) => {
          setCurrentUser(loggedUser);
          setIsLoggedIn(true);
          sesionMovil.setUser(loggedUser);
          setGuestInteractionAlert(null);
        }}
      />
    </div>
  );
}
