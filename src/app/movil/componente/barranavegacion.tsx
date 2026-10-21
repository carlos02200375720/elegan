import React from "react";
import { MessageSquare, Play, ShoppingBag, User as UserIcon } from "lucide-react";
import { User, NavigationTab } from "../../../types";
import { getProfilePath, navigateTo } from "../../../router";

interface BarraNavegacionProps {
  isVisible: boolean;
  activeTab: NavigationTab;
  setActiveTab: React.Dispatch<React.SetStateAction<NavigationTab>>;
  currentUser: User;
  totalUnreads: number;
  requiresLogin: boolean;
  onRefreshReels: () => void;
  onClearSelectedCreator: () => void;
}

export default function BarraNavegacion({
  isVisible,
  activeTab,
  setActiveTab,
  currentUser,
  totalUnreads,
  requiresLogin,
  onRefreshReels,
  onClearSelectedCreator,
}: BarraNavegacionProps) {
  if (!isVisible) return null;

  const isHomeActive = activeTab === "inicio" || activeTab === "reels";

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-white"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />
      <div
        id="android-bottom-nav-bar"
        className="fixed bottom-0 inset-x-0 z-30 flex h-14 box-border items-center px-1 transition-colors shadow-none bg-white text-slate-900 border-t border-slate-100"
        style={{
          bottom: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: "#ffffff",
          paddingBottom: "0px",
        }}
      >
        <div className="w-full max-w-md mx-auto grid grid-cols-4 items-center">
          <button
            onClick={() => {
              onRefreshReels();
              setActiveTab("inicio");
              navigateTo("/inicio");
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:bg-amber-500/10 cursor-pointer ${
              isHomeActive
                ? "text-amber-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-800"
            }`}
            id="android-nav-inicio"
          >
            <Play className={`w-5 h-5 transition-all ${isHomeActive ? "fill-amber-600 stroke-amber-600" : ""}`} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">Inicio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("shop");
              navigateTo("/tienda/catalogo");
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:bg-amber-500/10 cursor-pointer relative ${
              activeTab === "shop"
                ? "text-amber-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-800"
            }`}
            id="android-nav-shop"
          >
            <ShoppingBag className={`w-5 h-5 transition-all ${activeTab === "shop" ? "fill-amber-600 stroke-amber-600" : ""}`} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">Tienda</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("messages");
              navigateTo("/messages");
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:bg-amber-500/10 cursor-pointer relative ${
              activeTab === "messages"
                ? "text-amber-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-800"
            }`}
            id="android-nav-messages"
          >
            <MessageSquare className={`w-5 h-5 transition-all ${activeTab === "messages" ? "fill-amber-600 stroke-amber-600" : ""}`} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">Mensajes</span>
            {totalUnreads > 0 && (
              <span className="absolute top-0.5 right-2 w-4 h-4 bg-rose-500 text-white font-mono font-bold text-[9px] rounded-full flex items-center justify-center border border-white animate-pulse shadow-sm">
                {totalUnreads}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onClearSelectedCreator();
              setActiveTab("profile");
              navigateTo(requiresLogin ? "/perfil/login" : getProfilePath(currentUser));
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:bg-amber-500/10 cursor-pointer ${
              activeTab === "profile"
                ? "text-amber-600 scale-105 font-bold"
                : "text-slate-400 hover:text-slate-800"
            }`}
            id="android-nav-profile"
          >
            <UserIcon className={`w-5 h-5 transition-all ${activeTab === "profile" ? "fill-amber-600 stroke-amber-600" : ""}`} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">Mi Perfil</span>
          </button>
        </div>
      </div>
    </>
  );
}
