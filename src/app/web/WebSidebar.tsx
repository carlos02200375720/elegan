import React, { useState } from "react";
import { ShoppingBag, User as UserIcon, MessageSquare, Sparkles, Menu, X, ShieldCheck, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, NavigationTab, isGuestUser } from "../../types";
import { navigateTo, getProfilePath, parseRoute } from "../../router";
import { isSuperAdmin } from "../../superAdmin";


export interface WebSidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentUser: User;
  totalUnreads: number;
  selectedCreatorProfileId: string | null;
  setSelectedCreatorProfileId: (creatorId: string | null) => void;
  hideMobileHamburger?: boolean;
  onOpenSaved: () => void;
}

export default function WebSidebar({
  activeTab,
  setActiveTab,
  currentUser,
  totalUnreads,
  selectedCreatorProfileId,
  setSelectedCreatorProfileId,
  hideMobileHamburger = false,
  onOpenSaved,
}: WebSidebarProps) {
  const isHomeActive = false;
  const isDarkNavActive = false;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSavedActive = typeof window !== "undefined" && parseRoute(window.location.pathname)?.profileTab === "guardado";

  const handleOpenSaved = () => {
    setIsMobileMenuOpen(false);
    setSelectedCreatorProfileId(null);
    onOpenSaved();
  };

  const handleMobileSelect = (tab: NavigationTab) => {
    setIsMobileMenuOpen(false);
    if (tab === 'inicio' || tab === 'reels' || tab === 'shop') {
      setActiveTab('shop');
      navigateTo('/tienda/catalogo');
    } else if (tab === 'messages') {
      setActiveTab('messages');
      navigateTo('/messages');
    } else if (tab === 'profile') {
      setSelectedCreatorProfileId(null);
      setActiveTab('profile');
      navigateTo(isGuestUser(currentUser) ? '/perfil/login' : getProfilePath(currentUser));
    } else if (tab === 'admin') {
      setSelectedCreatorProfileId(null);
      setActiveTab('admin');
      navigateTo('/admin/resumen');
    }
  };

  return (
    <>
    <aside
      className={`hidden md:flex flex-col justify-between w-60 lg:w-64 fixed left-0 top-0 bottom-0 z-40 border-r p-4 select-none transition-colors duration-200 ${
        isDarkNavActive
          ? "bg-slate-950/95 border-slate-800/80 text-white backdrop-blur-md"
          : "bg-white/95 border-slate-200 text-slate-900 backdrop-blur-md"
      }`}
      id="desktop-web-sidebar"
    >
      <div>
        {/* Brand / Logo */}
        <div
          className="flex items-center space-x-2.5 px-3 py-3 mb-6 cursor-pointer group"
          onClick={() => { setActiveTab('shop'); navigateTo('/tienda/catalogo'); }}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl tracking-tight leading-none bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
              Mall
            </h1>
            <span className={`text-[10px] font-mono tracking-widest uppercase block mt-0.5 ${
              isDarkNavActive ? "text-slate-400" : "text-slate-500"
            }`}>
              Web Platform
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5" id="web-sidebar-navigation">
          {/* Inicio: catálogo oficial */}
          <button
            onClick={() => { setActiveTab('shop'); navigateTo('/tienda/catalogo'); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'shop'
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            id="web-nav-inicio"
          >
            <ShoppingBag strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'shop' ? "fill-slate-950" : ""}`} />
            <span className="font-black tracking-wide">Inicio</span>
          </button>

          {/* 3. Mensajes */}
          <button
            onClick={() => { setActiveTab('messages'); navigateTo('/messages'); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'messages'
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : isDarkNavActive
                ? "text-slate-400 hover:text-white hover:bg-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            id="web-nav-messages"
          >
            <div className="flex items-center space-x-3.5">
              <MessageSquare strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'messages' ? "fill-slate-950" : ""}`} />
              <span className="font-black tracking-wide">Mensajes</span>
            </div>
            {totalUnreads > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'messages' ? "bg-slate-950 text-amber-400" : "bg-rose-500 text-white"
              }`}>
                {totalUnreads}
              </span>
            )}
          </button>

          {/* 4. Perfil */}
          <button
            onClick={() => { setSelectedCreatorProfileId(null); setActiveTab('profile'); navigateTo(isGuestUser(currentUser) ? '/perfil/login' : getProfilePath(currentUser)); }}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              activeTab === 'profile' && selectedCreatorProfileId === null && !isSavedActive
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : isDarkNavActive
                ? "text-slate-400 hover:text-white hover:bg-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            id="web-nav-profile"
          >
            <UserIcon strokeWidth={2.6} className="w-5 h-5" />
            <span className="font-black tracking-wide">
              {isGuestUser(currentUser) ? "Mi Perfil (Registrarse)" : "Dashboard / Perfil"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenSaved}
            className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
              isSavedActive
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            id="web-nav-saved"
          >
            <Bookmark strokeWidth={2.6} className="w-5 h-5" />
            <span className="font-black tracking-wide">Guardados</span>
          </button>

          {/* 5. Panel de Administración (aparece SOLO cuando cg0220037@gmail.com inicia sesión) */}
          {isSuperAdmin(currentUser) && (
            <button
              onClick={() => {
                setSelectedCreatorProfileId(null);
                setActiveTab('admin');
                navigateTo('/admin/resumen');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/90 border border-amber-300/80 bg-amber-50/40"
              }`}
              id="web-nav-admin"
            >
              <div className="flex items-center space-x-3.5">
                <ShieldCheck strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'admin' ? "fill-slate-950 text-slate-950" : "text-amber-600"}`} />
                <span className="font-black tracking-wide">Panel de Admin</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                activeTab === 'admin' ? "bg-slate-950 text-amber-400" : "bg-amber-200/80 text-amber-900"
              }`}>
                Admin
              </span>
            </button>
          )}


        </nav>
      </div>

      {/* Desktop Web Footer Profile Card */}
      <div className={`pt-4 border-t ${isDarkNavActive ? "border-slate-800/80" : "border-slate-200"}`}>
        <div
          onClick={() => { setSelectedCreatorProfileId(null); setActiveTab('profile'); navigateTo(isGuestUser(currentUser) ? '/perfil/login' : getProfilePath(currentUser)); }}
          className={`flex items-center space-x-3 p-2.5 rounded-2xl border transition-all cursor-pointer group ${
            isDarkNavActive
              ? "bg-slate-900/80 hover:bg-slate-900 border-slate-800/80"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200"
          }`}
        >
          <img
            src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold truncate group-hover:text-amber-500 transition-colors ${
              isDarkNavActive ? "text-white" : "text-slate-900"
            }`}>
              {currentUser.name}
            </p>
            <p className={`text-[10px] truncate font-medium ${
              isDarkNavActive ? "text-slate-400" : "text-slate-500"
            }`}>
              {currentUser.email || (isGuestUser(currentUser) ? "Modo invitado" : "Cliente")}
            </p>
          </div>
        </div>
      </div>
    </aside>

    {/* Fixed Hamburger Button for Mobile Web on Tienda, Perfil y Chat */}
    {!isHomeActive && !hideMobileHamburger && (
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed left-3 z-50 w-9 h-9 rounded-full bg-slate-900/85 text-white backdrop-blur-md border border-white/15 shadow-lg flex items-center justify-center hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
        style={{
          top:
            activeTab === 'shop'
              ? "0.5rem"
              : "0.75rem",
        }}
        id="web-mobile-fixed-hamburger-btn"
        title="Abrir menú de navegación"
      >
        <Menu className="w-5 h-5 text-white" />
        {totalUnreads > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950" />
        )}
      </button>
    )}

    {/* Mobile Web Hamburger Navigation Drawer */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] flex justify-start bg-black/60 backdrop-blur-sm"
          id="web-mobile-global-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-72 max-w-[82vw] h-full bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-4 shadow-2xl text-white select-none"
            id="web-mobile-global-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div
                className="flex items-center justify-between px-2 pb-4 mb-4 border-b border-slate-800/80"
                style={{ paddingTop: "0.75rem" }}
              >
                <div
                  className="flex items-center space-x-2.5 cursor-pointer"
                  onClick={() => handleMobileSelect('shop')}
                >
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg tracking-tight leading-none bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                      Mall
                    </h2>
                    <span className="text-[10px] font-mono tracking-widest uppercase block mt-0.5 text-slate-400">
                      Menú Principal
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  id="close-web-mobile-global-drawer-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5" id="web-mobile-global-drawer-links">
                <button
                  type="button"
                  onClick={() => handleMobileSelect('shop')}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    activeTab === 'shop'
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                  id="mobile-global-nav-inicio"
                >
                  <ShoppingBag strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'shop' ? "fill-slate-950" : ""}`} />
                  <span className="font-black tracking-wide">Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileSelect('messages')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    activeTab === 'messages'
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                  id="mobile-global-nav-messages"
                >
                  <div className="flex items-center space-x-3.5">
                    <MessageSquare strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'messages' ? "fill-slate-950" : ""}`} />
                    <span className="font-black tracking-wide">Mensajes</span>
                  </div>
                  {totalUnreads > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                      activeTab === 'messages' ? "bg-slate-950 text-amber-400" : "bg-rose-500 text-white"
                    }`}>
                      {totalUnreads > 9 ? "9+" : totalUnreads}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileSelect('profile')}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                  id="mobile-global-nav-profile"
                >
                  <UserIcon strokeWidth={2.6} className="w-5 h-5" />
                  <span className="font-black tracking-wide">
                    {isGuestUser(currentUser) ? "Mi Perfil (Registrarse)" : "Perfil"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenSaved}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                    isSavedActive
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                  id="mobile-global-nav-saved"
                >
                  <Bookmark strokeWidth={2.6} className="w-5 h-5" />
                  <span className="font-black tracking-wide">Guardados</span>
                </button>

                {/* Panel de Administración (aparece SOLO cuando cg0220037@gmail.com inicia sesión) */}
                {isSuperAdmin(currentUser) && (
                  <button
                    type="button"
                    onClick={() => handleMobileSelect('admin')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                      activeTab === 'admin'
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-amber-400 hover:text-white hover:bg-slate-900 border border-amber-500/30"
                    }`}
                    id="mobile-global-nav-admin"
                  >
                    <div className="flex items-center space-x-3.5">
                      <ShieldCheck strokeWidth={2.6} className={`w-5 h-5 ${activeTab === 'admin' ? "fill-slate-950 text-slate-950" : "text-amber-400"}`} />
                      <span className="font-black tracking-wide">Panel de Admin</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                      activeTab === 'admin' ? "bg-slate-950 text-amber-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      Admin
                    </span>
                  </button>
                )}


              </nav>
            </div>

            <div
              className="pt-4 border-t border-slate-800/80"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
            >
              <div
                onClick={() => handleMobileSelect('profile')}
                className="flex items-center space-x-3 p-2.5 rounded-2xl border bg-slate-900/80 hover:bg-slate-900 border-slate-800/80 transition-all cursor-pointer group"
              >
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-white group-hover:text-amber-500 transition-colors">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] truncate font-medium text-slate-400">
                    {currentUser.email || (isGuestUser(currentUser) ? "Modo invitado" : "Cliente")}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
