import React from "react";
import { Play, ShoppingBag, MessageSquare, User as UserIcon, ShieldCheck, Sparkles, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, NavigationTab, isGuestUser } from "../tipos";
import { navigateTo, getProfilePath } from "../enrutador";
import { isSuperAdmin } from "../superAdmin";

export interface MovilHamburgerMenuProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  currentUser: User;
  totalUnreads?: number;
  onNavigateToTab?: (tab: NavigationTab) => void;
  onRefreshReels?: () => void;
  onNavigateToShop?: () => void;
  onNavigateToProfile?: () => void;
  categories?: string[];
  onSelectCategory?: (category: string) => void;
}

export function MovilHamburgerButton({
  onOpen,
  totalUnreads = 0,
  dark = false,
}: {
  onOpen: () => void;
  totalUnreads?: number;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center pointer-events-auto ${
        dark ? "bg-transparent text-slate-800 hover:bg-slate-100" : "bg-transparent text-white hover:bg-white/10 drop-shadow-md"
      }`}
      id="movil-inicio-hamburger-btn"
      title="Abrir menú de navegación móvil"
    >
      <Menu className={`w-6 h-6 ${dark ? "text-slate-900" : "text-white drop-shadow-md"}`} />
      {totalUnreads > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
      )}
    </button>
  );
}

export function MovilHamburgerMenu({
  isOpen,
  onClose,
  currentUser,
  totalUnreads = 0,
  onNavigateToTab,
  onRefreshReels,
  onNavigateToShop,
  onNavigateToProfile,
  categories = [],
  onSelectCategory,
}: MovilHamburgerMenuProps) {
  const handleSelectTab = (tab: NavigationTab) => {
    onClose();
    if (onNavigateToTab) {
      onNavigateToTab(tab);
      return;
    }
    if (tab === "inicio" || tab === "reels") {
      onRefreshReels?.();
      navigateTo("/inicio");
    } else if (tab === "shop") {
      if (onNavigateToShop) onNavigateToShop();
      else navigateTo("/tienda/catalogo");
    } else if (tab === "messages") {
      navigateTo("/messages");
    } else if (tab === "profile") {
      if (onNavigateToProfile) onNavigateToProfile();
      else navigateTo(getProfilePath(currentUser));
    } else if (tab === "admin") {
      navigateTo("/admin/resumen");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[65] flex justify-start bg-black/25 backdrop-blur-[2px]"
          id="movil-hamburger-drawer-overlay"
          onClick={onClose}
          onWheel={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-72 max-w-[82vw] h-full bg-white border-r border-slate-200 flex flex-col justify-between p-4 shadow-2xl text-slate-900 select-none"
            id="movil-hamburger-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div
                className="flex items-center justify-between px-2 pb-4 mb-4 border-b border-slate-200"
                style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
              >
                <div
                  className="flex items-center space-x-2.5 cursor-pointer"
                  onClick={() => handleSelectTab("shop")}
                >
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-lg tracking-tight leading-none bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
                      Mall
                    </h2>
                    <span className="text-[10px] font-mono tracking-widest uppercase block mt-0.5 text-slate-500">
                      Menú Móvil
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  id="close-movil-hamburger-drawer-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="shrink-0 space-y-1.5" id="movil-hamburger-nav-links">
                <button
                  type="button"
                  onClick={() => handleSelectTab("inicio")}
                  className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer bg-amber-500/90 text-slate-950 shadow-md shadow-amber-500/20"
                  id="movil-hamburger-nav-inicio"
                >
                  <Play strokeWidth={2.6} className="w-5 h-5 fill-slate-950" />
                  <span className="font-black tracking-wide">Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("shop")}
                  className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer bg-transparent text-slate-700 hover:bg-slate-100"
                  id="movil-hamburger-nav-shop"
                >
                  <ShoppingBag strokeWidth={2.6} className="w-5 h-5" />
                  <span className="font-black tracking-wide">Tienda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("messages")}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer bg-transparent text-slate-700 hover:bg-slate-100"
                  id="movil-hamburger-nav-messages"
                >
                  <div className="flex items-center space-x-3.5">
                    <MessageSquare strokeWidth={2.6} className="w-5 h-5" />
                    <span className="font-black tracking-wide">Mensajes</span>
                  </div>
                  {totalUnreads > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white">
                      {totalUnreads > 9 ? "9+" : totalUnreads}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab("profile")}
                  className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer bg-transparent text-slate-700 hover:bg-slate-100"
                  id="movil-hamburger-nav-profile"
                >
                  <UserIcon strokeWidth={2.6} className="w-5 h-5" />
                  <span className="font-black tracking-wide">
                    Mi Perfil
                  </span>
                </button>

                {isSuperAdmin(currentUser) && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab("admin")}
                    className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer bg-transparent text-slate-700 hover:bg-slate-100"
                    id="movil-hamburger-nav-admin"
                  >
                    <ShieldCheck strokeWidth={2.6} className="w-5 h-5" />
                    <span className="font-black tracking-wide">Admin</span>
                  </button>
                )}
              </nav>
              <section className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-slate-200 pt-4" aria-label="Categorías">
                <h3 className="px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Categorías
                </h3>
                <div className="space-y-1">
                  {categories.map((category, index) => (
                    <button
                      key={`menu-category-${category}-${index}`}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onSelectCategory) onSelectCategory(category);
                        else handleSelectTab("shop");
                      }}
                      className="w-full rounded-xl bg-transparent px-4 py-2.5 text-left text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div
              className="pt-4 border-t border-slate-200"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
            >
              <div
                onClick={() => handleSelectTab("profile")}
                className="flex items-center space-x-3 p-2.5 rounded-2xl border border-slate-200 bg-transparent hover:bg-slate-50 transition-all cursor-pointer group"
              >
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={currentUser?.name || "Usuario"}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-slate-900 group-hover:text-amber-600 transition-colors">
                    {currentUser?.name || "Invitado"}
                  </p>
                  <p className="text-[10px] truncate font-medium text-slate-500">
                    {currentUser?.email || (currentUser?.isGuest ? "Modo invitado" : "Cliente")}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
