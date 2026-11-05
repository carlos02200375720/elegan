import React, { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { User, Reel, Product, Order } from "../../../types";


import AndroidUserPublicationsFeed from "../componente/Feedperfil";
import AndroidPublishView from "../publicasion";
import { isSuperAdmin } from "../../../superAdmin";
import { navigateTo, getProfilePath, getProfileConfigPath } from "../../../router";
import usePerfilData from "./usePerfilData";

// Sub-components inside src/app/movil/perfil/
import ConfigPerfilView from "./config";
import EncabezadoPerfil from "./EncabezadoPerfil";
import NavegacionPerfil from "./NavegacionPerfil";
import ModalEliminarPublicacion from "./ModalEliminarPublicacion";
import PresentacionPerfil from "./PresentacionPerfil";
import ContenidoPestanaPerfil from "./ContenidoPestanaPerfil";

export interface AndroidPerfilProps {
  user?: User;
  currentUser: User;
  selectedCreatorId?: string | null;
  users?: User[];
  reels?: Reel[];
  products?: Product[];
  cart?: any[];
  cartCount?: number;
  onOpenCart?: () => void;
  onLogout: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectReel?: (reel: Reel | string) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onOpenSocial?: () => void;
  unreadCount?: number;
  onOpenPublishModal?: () => void;
  isCurrentUserProfile?: boolean;
  onDeleteReel?: (reelId: string) => void;
  onUpdateReels?: (reels: Reel[]) => void;
  onUpdateProducts?: (products: Product[]) => void;
  savedReelIds?: string[];
  onToggleSaveReel?: (reelId: string) => void;
  orders?: Order[];
  onUpdateOrders?: (orders: Order[]) => void;
  onBackToSelf?: () => void;
  onOpenDirectChat?: (targetUser: User) => void;
  onRefreshUsers?: () => void;
  onPublishSuccess?: () => void;
  socket?: WebSocket | null;
  initialTab?: TabType;
  onClearInitialTab?: () => void;
}

export type AndroidProfileViewProps = AndroidPerfilProps;

type TabType = "reels" | "products" | "saved" | "orders";

export default function Perfil({
  user: directUser,
  currentUser,
  selectedCreatorId,
  users = [],
  reels = [],
  products = [],
  cart,
  cartCount,
  onOpenCart,
  onLogout,
  onSelectProduct,
  onSelectReel,
  onUpdateUser,
  onProfileUpdate,
  onOpenPublishModal,
  onDeleteReel,
  savedReelIds = [],
  onToggleSaveReel,
  orders = [],
  onBackToSelf,
  onOpenDirectChat,
  onRefreshUsers,
  onPublishSuccess,
  initialTab,
  onClearInitialTab,
  socket,
}: AndroidPerfilProps) {
  // Determine who we are viewing
  const activeUser =
    directUser ||
    (selectedCreatorId
      ? users.find(
          (u) =>
            u.id === selectedCreatorId ||
            (u.originalId && u.originalId === selectedCreatorId) ||
            (u.username && u.username.toLowerCase() === selectedCreatorId.toLowerCase())
        )
      : null) ||
    currentUser;

  const isMe = activeUser.id === currentUser.id || activeUser.username === currentUser.username;
  const isAdmin = (currentUser as any)?.role === "admin" || (currentUser as any)?.isAdmin === true;
  const isSellerOrAdmin = Boolean(activeUser.canSell === true || isSuperAdmin(activeUser));
  const canDelete = isMe || isAdmin || !selectedCreatorId;

  // Configuración de la barra de estado nativa en celulares para la página de perfil:
  // Fondo blanco sólido (#ffffff, sin transparencia) y texto/iconos oscuros legibles
  useEffect(() => {
    const applyProfileStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && Capacitor.isPluginAvailable("StatusBar")) {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (e) {
        console.warn("StatusBar setup in Perfil:", e);
      }

      // Sincronizar theme-color en el DOM para la barra de estado nativa
      const themeMeta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", "#ffffff");
      }
      document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
        tag.setAttribute("content", "#ffffff");
      });

      // Configurar apple-mobile-web-app-status-bar-style a default para eliminar translucidez
      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusMeta) {
        appleStatusMeta.setAttribute("content", "default");
      }

      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
    };

    applyProfileStatusBar();
  }, []);

  // Asegurar que al navegar a la página de perfil siempre abra en la parte superior de la pantalla
  useEffect(() => {
    const scrollToTop = () => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const scrollableSelectors = [
          "#android-app-layout",
          "#android-profile-view",
          "#android-profile-container",
          "#app-android-container",
          "main"
        ];
        scrollableSelectors.forEach((selector) => {
          const el = document.querySelector(selector);
          if (el) {
            el.scrollTop = 0;
          }
        });
      }
    };

    // Scroll inmediato
    scrollToTop();

    // Re-verificar tras el pintado del navegador (RAF y timeout corto) para neutralizar cualquier scroll previo
    const rafId = requestAnimationFrame(scrollToTop);
    const timeoutId = setTimeout(scrollToTop, 40);

    const handleRouteChange = () => {
      scrollToTop();
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("app-route-change", handleRouteChange);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("app-route-change", handleRouteChange);
    };
  }, [activeUser.id, activeUser.username, selectedCreatorId]);

  const perfilData = usePerfilData({
    activeUser, currentUser, isMe, isSellerOrAdmin,
    props: {
      initialTab, onClearInitialTab, onDeleteReel, onPublishSuccess,
      onRefreshUsers, savedReelIds, cart, cartCount,
    },
  });
  const {
    activeTab, setActiveTab, selectedFeedReelId, setSelectedFeedReelId,
    isEditProfileOpen, setIsEditProfileOpen, isPublishingOpen, setIsPublishingOpen,
    publicationToDelete, setPublicationToDelete, isDeletingPublication,
    deleteErrorMessage, userReels, userProducts, savedReels, savedProducts,
    totalCartItems, handleSelectMobileTab, executeDeletePublication,
    handleDeletePublication,
  } = perfilData;

  return (
    <div
      className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none pb-24 relative"
      id="android-profile-view"
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Barra de estado fija en blanco sólido 100% opaco para eliminar cualquier fondo transparente en celulares */}
      <div
        className="w-full bg-white fixed top-0 inset-x-0 z-50 pointer-events-none transition-colors"
        style={{
          height: "max(24px, env(safe-area-inset-top, 24px))",
          backgroundColor: "#ffffff",
        }}
        aria-hidden="true"
      />

      {/* Cabecera fija del perfil con fondo blanco igual que la barra de estado nativa de Android */}
      <EncabezadoPerfil
        activeUser={activeUser}
        isMe={isMe}
        onBackToSelf={onBackToSelf}
        onEditProfile={() => {
          setIsEditProfileOpen(true);
          navigateTo(getProfileConfigPath(activeUser));
        }}
        onOpenCart={onOpenCart}
        totalCartItems={totalCartItems}
      />

      {/* Contenedor del contenido del perfil */}
      <div
        className="w-full flex-1 flex flex-col"
        style={{
          marginTop: "0px",
        }}
      >
        {/* Profile Bio Section */}
        <PresentacionPerfil
          activeUser={activeUser}
          isMe={isMe}
          isSellerOrAdmin={isSellerOrAdmin}
          userReels={userReels}
          onOpenPublishModal={onOpenPublishModal}
          onOpenDirectChat={onOpenDirectChat}
          onOpenPublishing={() => setIsPublishingOpen(true)}
        />
      </div>

      {/* Tabs */}      <NavegacionPerfil
        isSellerOrAdmin={isSellerOrAdmin}
        isMe={isMe}
        activeTab={activeTab}
        isEditProfileOpen={isEditProfileOpen}
        reelCount={userReels.length}
        productCount={userProducts.length}
        onSelectTab={handleSelectMobileTab}
        onOpenConfig={() => {
          setIsEditProfileOpen(true);
          navigateTo(getProfileConfigPath(activeUser));        }}
      />

      {/* Tab Content */}
      <ContenidoPestanaPerfil
        activeTab={activeTab}
        isSellerOrAdmin={isSellerOrAdmin}
        isMe={isMe}
        canDelete={canDelete}
        userReels={userReels}
        userProducts={userProducts}
        savedReels={savedReels}
        savedProducts={savedProducts}
        orders={orders}
        activeUser={activeUser}
        currentUser={currentUser}
        socket={socket}
        onSelectReel={onSelectReel}
        onSelectProduct={onSelectProduct}
        onToggleSaveReel={onToggleSaveReel}
        onOpenFeed={setSelectedFeedReelId}
        onDeletePublication={handleDeletePublication}
      />
      </div>
      </div>

      {/* Publications Feed Modal */}
      {selectedFeedReelId && (
        <AndroidUserPublicationsFeed
          user={activeUser}
          reels={userReels}
          products={products}
          initialReelId={selectedFeedReelId}
          currentUser={currentUser}
          onClose={() => setSelectedFeedReelId(null)}
          onSelectProduct={onSelectProduct}
          onDeleteReel={handleDeletePublication}
          savedReelIds={savedReelIds}
          onToggleSaveReel={onToggleSaveReel}
        />
      )}

      {/* Standalone Publish Modal for Android */}
      {isPublishingOpen && (
        <AndroidPublishView
          currentUser={currentUser}
          onBack={() => setIsPublishingOpen(false)}
          onSuccess={() => {
            setIsPublishingOpen(false);
            onPublishSuccess?.();
          }}
          userProducts={userProducts}
        />
      )}

      {/* Edit Profile Sheet (Imported from ./config) */}
      <ConfigPerfilView
        isOpen={isEditProfileOpen}
        activeUser={activeUser}
        currentUser={currentUser}
        onProfileUpdate={onProfileUpdate}
        onUpdateUser={onUpdateUser}
        onLogout={onLogout}
        onClose={() => {
          setIsEditProfileOpen(false);
          navigateTo(getProfilePath(activeUser));
        }}      />

      <ModalEliminarPublicacion
        publication={publicationToDelete}
        isDeleting={isDeletingPublication}
        errorMessage={deleteErrorMessage}
        onCancel={() => setPublicationToDelete(null)}
        onConfirm={executeDeletePublication}
      />

    </div>
  );
}

export { Perfil, Perfil as ProfileView };