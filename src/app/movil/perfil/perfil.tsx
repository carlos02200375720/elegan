import React from "react";
import { User, Reel, Product, Order } from "../../../types";


import { isSuperAdmin } from "../../../superAdmin";
import { navigateTo, getProfileConfigPath } from "../../../router";
import usePerfilData from "./usePerfilData";
import usePerfilEffects from "./usePerfilEffects";
import ModalesPerfil from "./ModalesPerfil";

// Sub-components inside src/app/movil/perfil/
import EncabezadoPerfil from "./EncabezadoPerfil";
import NavegacionPerfil from "./NavegacionPerfil";
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

  usePerfilEffects(activeUser, selectedCreatorId);

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

      <ModalesPerfil
        selectedFeedReelId={selectedFeedReelId}
        onCloseFeed={() => setSelectedFeedReelId(null)}
        activeUser={activeUser}
        userReels={userReels}
        products={products}
        currentUser={currentUser}
        onSelectProduct={onSelectProduct}
        onDeleteReel={handleDeletePublication}
        savedReelIds={savedReelIds}
        onToggleSaveReel={onToggleSaveReel}
        isPublishingOpen={isPublishingOpen}
        onClosePublishing={() => setIsPublishingOpen(false)}
        onPublishSuccess={onPublishSuccess}
        userProducts={userProducts}
        isEditProfileOpen={isEditProfileOpen}
        onProfileUpdate={onProfileUpdate}
        onUpdateUser={onUpdateUser}
        onLogout={onLogout}
        onCloseConfig={() => {
          setIsEditProfileOpen(false);
          navigateTo(getProfilePath(activeUser));
        }}
        publicationToDelete={publicationToDelete}
        isDeletingPublication={isDeletingPublication}
        deleteErrorMessage={deleteErrorMessage}
        onCancelDelete={() => setPublicationToDelete(null)}
        onConfirmDelete={executeDeletePublication}
      />
    </div>
  );
}

export { Perfil, Perfil as ProfileView };