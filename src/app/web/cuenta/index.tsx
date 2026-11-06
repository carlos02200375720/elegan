import React from "react";
import { motion, AnimatePresence } from "motion/react";
import LoginView from "../LoginView";
import GuardadoPerfilView from "./guardado";
import CompraPerfilView from "./compra";
import ConfigPerfilView from "./config";
import { PerfilProps } from "./tipos";
import { usePerfilEstado } from "./estado";
import ModalRastreo from "./modal_rastreo";
import FeedPublicaciones from "./feed_publicaciones";

export type { PerfilProps, ProfileViewProps } from "./tipos";

export default function Perfil(props: PerfilProps) {
  const {
    currentUser, users, products = [],
    onToggleSave, onBackToSelf, onOpenDirectChat, onSelectProduct,
    onProfileUpdate, onRefreshUsers, onPublishSuccess, onLogout,
  } = props;
  const {
    isSelf, isGuestMode, profileUser, setProfileUser,
    userReels, setUserReels, userOrders, userSales, ordersLoading,
    selectedTrackingOrder, setSelectedTrackingOrder, copiedTrackingId,
    savedReels, setSavedReels, savedProducts, setSavedProductsFromApi,
    loading, activeSubTab, activeFeedReelId, setActiveFeedReelId,
    handleSelectSubTab, fetchOrders, handleCopyTrackingNumber,
  } = usePerfilEstado(props);

  if (isGuestMode) {
    return (
      <div
        className="w-full max-w-4xl mx-auto pb-0 overflow-x-hidden"
        id="guest-profile-login-wrapper"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <LoginView
          users={users}
          currentUser={currentUser}
          initialTab="register"
          restrictionNotice="Para acceder a tu perfil, tus publicaciones guardadas, el historial de tus compras y todas tus interacciones, debes registrarte en la plataforma. Toda tu información previa se transferirá automáticamente a tu cuenta."
          onRefreshUsers={onRefreshUsers || (() => {})}
          onLoginSuccess={(user) => {
            setProfileUser(user);
            onProfileUpdate?.(user);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[550px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 pb-0">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold mt-4">Sincronizando perfil...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[450px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-6 text-center pb-0">
        <p className="font-bold text-slate-700">Perfil no disponible</p>
        <button
          onClick={onBackToSelf}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Regresar a mi perfil
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-4xl mx-auto min-h-[600px] bg-white rounded-none sm:rounded-t-none sm:rounded-b-2xl border-0 sm:border sm:border-slate-200 shadow-none sm:shadow-xl overflow-visible flex flex-col no-scrollbar pb-0"
      id="profile-panel"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {isSelf ? (
        <header
          className="sticky top-0 z-40 w-full flex items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-white border-b border-slate-200 shadow-sm"
          id="profile-section-fixed-header"
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={profileUser.avatar || getDefaultAvatar()}
              alt={profileUser.name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getDefaultAvatar();
              }}
            />
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-sm sm:text-base text-slate-950 truncate">
                {profileUser.name}
              </h2>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              id="profile-logout-btn"
              className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-bold">Cerrar sesión</span>
            </button>
          )}
        </header>
      ) : (
        <div className="px-6 sm:px-8 pb-0 relative border-b border-slate-200/80 bg-slate-50 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-0 mb-4 gap-4 z-10 relative">
            <div className="flex items-end space-x-4">
              <div className="flex flex-col items-center shrink-0">
                <img
                  src={profileUser.avatar || getDefaultAvatar()}
                  alt={profileUser.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getDefaultAvatar();
                  }}
                />
                <span className="text-xs text-slate-500 font-bold font-mono mt-1 text-center">
                  {profileUser.email || ""}
                </span>
              </div>
              <div className="pb-1">
                <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-950 flex items-center space-x-2 flex-wrap">
                  <span className="inline-block" style={{ paddingLeft: "18px" }}>
                    {profileUser.name}
                  </span>
                </h2>
              </div>
            </div>
            <div className="sm:pb-1 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onOpenDirectChat(profileUser)}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                id="message-creator-btn"
              >
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Mensaje</span>
              </button>
            </div>
          </div>
          {profileUser.bio && (
            <div className="mt-2 mb-1">
              <p className="text-xs text-slate-800 leading-relaxed font-medium max-w-sm break-words bg-transparent rounded-none px-0 py-0.5 shadow-none border-0">
                {profileUser.bio.length > 50 ? profileUser.bio.slice(0, 50) + "..." : profileUser.bio}
              </p>
            </div>
          )}
          <div className="mt-2 pt-0.5 border-t border-slate-200/80 flex items-center justify-center w-full max-w-sm sm:max-w-md mx-auto">
            <FileText className="w-4.5 h-4.5 stroke-[2] text-amber-500" />
          </div>
        </div>
      )}
      {/* Profile Inner Section tabs */}
      <div className="flex-1 p-4 sm:p-6 pt-3 sm:pt-4 pb-0">
        <AnimatePresence mode="wait">
          {isSelf ? (
            /* --- 1. PERSONAL PROFILE VIEWS --- */
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <AnimatePresence mode="wait">
                {activeSubTab === "saved" && (
                  <GuardadoPerfilView
                    savedProducts={savedProducts}
                    savedReels={savedReels}
                    onSelectProduct={onSelectProduct}
                    onToggleSave={onToggleSave}
                    onRemoveSavedProductFromLocal={(productId) =>
                      setSavedProductsFromApi((prev) => prev.filter((p) => p.id !== productId))
                    }
                    onSelectReel={(reelId) => setActiveFeedReelId(reelId)}
                  />
                )}

                {activeSubTab === "orders" && (
                  <CompraPerfilView
                    userOrders={userOrders}
                    userSales={userSales}
                    ordersLoading={ordersLoading}
                    onRefreshOrders={fetchOrders}
                    onSelectTrackingOrder={(order) => setSelectedTrackingOrder(order)}
                  />
                )}

                {activeSubTab === "edit" && (
                  <ConfigPerfilView
                    currentUser={currentUser}
                    profileUser={profileUser || currentUser}
                    users={users}
                    onProfileSaved={(updatedUser) => {
                      setProfileUser(updatedUser);
                      if (onProfileUpdate) {
                        onProfileUpdate(updatedUser);
                      }
                    }}
                    onRefreshUsers={onRefreshUsers}
                    onBackToSelf={onBackToSelf}
                    onCancel={() => handleSelectSubTab("saved")}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* --- 2. PUBLIC CREATOR PROFILE VIEW --- */
            <motion.div
              key="creator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                <div className="max-w-2xl mx-auto flex justify-end">
                  <button
                    onClick={() => onOpenDirectChat(profileUser)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Contactar al Negocio</span>
                  </button>
                </div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ModalRastreo
        order={selectedTrackingOrder}
        copiedTrackingId={copiedTrackingId}
        onClose={() => setSelectedTrackingOrder(null)}
        onCopyTrackingNumber={handleCopyTrackingNumber}
      />
      <FeedPublicaciones
        activeFeedReelId={activeFeedReelId}
        profileUser={profileUser}
        currentUser={currentUser}
        isSelf={isSelf}
        activeSubTab={activeSubTab}
        savedReels={savedReels}
        userReels={userReels}
        products={products}
        setUserReels={setUserReels}
        setSavedReels={setSavedReels}
        onClose={() => setActiveFeedReelId(null)}
        onSelectProduct={onSelectProduct}
        onPublishSuccess={onPublishSuccess}
      />
    </div>
  );
}

export { default as Guardado, default as GuardadoPerfilView, PublicationCover } from "./guardado";
export * from "./guardado";
export { default as Compra, default as CompraPerfilView } from "./compra";
export * from "./compra";
export { default as Config, default as ConfigPerfilView } from "./config";
export * from "./config";
