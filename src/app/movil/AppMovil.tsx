import React, { useState, useEffect, useRef } from "react";
import type { User, Product, ChatMessage, NavigationTab } from "./tipos";
import { useDatosMovil } from "./datos/useDatosMovil";
import { useCarritoMovil } from "./tienda/useCarritoMovil";
import { useCicloNativo } from "./nativo/useCicloNativo";
import { AndroidApp } from "./index";
import { AuthModal } from "./componente/AuthModal";
import { trackDailyVisitor } from "./analitica";
import { navigateTo, getProfilePath, getProductPath } from "./enrutador";
import { useSesionAplicacionMovil } from "./sesion/useSesionMovil";
import { useNavegacionMovil } from "./navegacion/useNavegacionMovil";
import { useMensajeriaMovil } from "./mensajeria/useMensajeriaMovil";

export default function AppMovil() {
  const { pestanaActiva: activeTab, establecerPestanaActiva: setActiveTab } = useNavegacionMovil();

  const { ocultarPantallaCarga } = useCicloNativo();
  const { users, setUsers, reels, setReels, products, setProducts, loadData } = useDatosMovil();

  const {
    usuarioActual: currentUser,
    establecerUsuarioActual: setCurrentUser,
    sesionIniciada: isLoggedIn,
    establecerSesionIniciada: setIsLoggedIn,
    cerrarSesion: handleLogout,
    iniciarSesion: handleSessionLogin,
  } = useSesionAplicacionMovil();
  const { cart, handleAddToCart, handleRemoveFromCart, handleUpdateCartQuantity, handleCheckoutCart } = useCarritoMovil(currentUser);
  const [directSelectedProduct, setDirectSelectedProduct] = useState<Product | null>(null);
  const [selectedCreatorProfileId, setSelectedCreatorProfileId] = useState<string | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [shopInitialStep, setShopInitialStep] = useState<"catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou">("catalog");
  const [shopInitialSelectedIndices, setShopInitialSelectedIndices] = useState<number[]>([]);
  const {
    usuarioChatActivo: activeChatUser,
    establecerUsuarioChatActivo: setActiveChatUser,
    mensajesPrivados: privateMessages,
    conteoMensajesSinLeer: unreadCounts,
    totalMensajesSinLeer: totalUnreads,
    enviarMensajePrivado: handleSendPrivateMessage,
    limpiarMensajesSinLeer: handleClearUnreads,
  } = useMensajeriaMovil(currentUser);
  const [savedReelIds, setSavedReelIds] = useState<string[]>([]);
  const [guestInteractionAlert, setGuestInteractionAlert] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    trackDailyVisitor("android");
  }, [currentUser.id]);

  useEffect(() => {
    loadData().finally(ocultarPantallaCarga);
  }, [loadData, ocultarPantallaCarga]);

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
          handleSendPrivateMessage={handleSendPrivateMessage}
          handleClearUnreads={handleClearUnreads}
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
          handleLogout={handleLogout}
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
          handleSessionLogin(loggedUser);
          setGuestInteractionAlert(null);
        }}
      />
    </div>
  );
}
