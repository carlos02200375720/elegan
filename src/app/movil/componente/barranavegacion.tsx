import React from "react";
import { MessageSquare, Play, ShoppingBag, User as UserIcon } from "lucide-react";
import { User, NavigationTab } from "../tipos";
import { getProfilePath, navigateTo } from "../enrutador";

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
    <div
      id="android-bottom-nav-bar"
      className="fixed inset-x-0 bottom-0 z-30 flex box-border items-start bg-white text-slate-900 border-t border-slate-100 shadow-none transition-colors"
      style={{
        height: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "max(0.25rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(0.25rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <div className="mx-auto grid h-[calc(3.5rem-1px)] w-full max-w-md grid-cols-4 items-stretch">
        <button
          onClick={() => {
            onRefreshReels();
            setActiveTab("inicio");
            navigateTo("/inicio");
          }}
          className={`flex h-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 transition-all active:bg-amber-500/10 cursor-pointer ${
            isHomeActive
              ? "text-black scale-105 font-bold"
              : "text-black hover:text-black"
          }`}
          id="android-nav-inicio"
        >
          <Play strokeWidth={2.75} className={`w-5 h-5 stroke-black ${isHomeActive ? "fill-black" : "fill-none"}`} />
          <span className="text-[10px] font-medium mt-0.5 tracking-tight">Inicio</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("shop");
            navigateTo("/tienda/catalogo");
          }}
          className={`relative flex h-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 transition-all active:bg-amber-500/10 cursor-pointer ${
            activeTab === "shop"
              ? "text-black scale-105 font-bold"
              : "text-black hover:text-black"
          }`}
          id="android-nav-shop"
        >
          <ShoppingBag strokeWidth={2.75} className={`w-5 h-5 stroke-black ${activeTab === "shop" ? "fill-black" : "fill-none"}`} />
          <span className="text-[10px] font-medium mt-0.5 tracking-tight">Tienda</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("messages");
            navigateTo("/messages");
          }}
          className={`relative flex h-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 transition-all active:bg-amber-500/10 cursor-pointer ${
            activeTab === "messages"
              ? "text-black scale-105 font-bold"
              : "text-black hover:text-black"
          }`}
          id="android-nav-messages"
        >
          <MessageSquare strokeWidth={2.75} className={`w-5 h-5 stroke-black ${activeTab === "messages" ? "fill-black" : "fill-none"}`} />
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
          className={`flex h-full min-w-0 flex-col items-center justify-center rounded-2xl px-1 transition-all active:bg-amber-500/10 cursor-pointer ${
            activeTab === "profile"
              ? "text-black scale-105 font-bold"
              : "text-black hover:text-black"
          }`}
          id="android-nav-profile"
        >
          <UserIcon strokeWidth={2.75} className={`w-5 h-5 stroke-black ${activeTab === "profile" ? "fill-black" : "fill-none"}`} />
          <span className="text-[10px] font-medium mt-0.5 tracking-tight">Mi Perfil</span>
        </button>
      </div>
    </div>
  );
}
