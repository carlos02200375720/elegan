import React from "react";
import { Grid, ShoppingBag, Bookmark, Package, Settings } from "lucide-react";

type TabType = "reels" | "products" | "saved" | "orders";

interface NavegacionPerfilProps {
  isSellerOrAdmin: boolean;
  isMe: boolean;
  activeTab: TabType;
  isEditProfileOpen: boolean;
  reelCount: number;
  productCount: number;
  onSelectTab: (tab: TabType) => void;
  onOpenConfig: () => void;
}

export default function NavegacionPerfil({
  isSellerOrAdmin, isMe, activeTab, isEditProfileOpen, reelCount, productCount,
  onSelectTab, onOpenConfig,
}: NavegacionPerfilProps) {
  return (
      <div className="flex border-b border-slate-200 mt-2 px-2">
              {isSellerOrAdmin && (
                <button
                  onClick={() => onSelectTab("reels")}
                  title={`Reels (${reelCount})`}
                  aria-label="Reels"
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
                    activeTab === "reels" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              )}
      
              {isSellerOrAdmin && (
                <button
                  onClick={() => onSelectTab("products")}
                  title={`Tienda (${productCount})`}
                  aria-label="Tienda"
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
                    activeTab === "products" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>
              )}
      
              {isMe && (
                <button
                  onClick={() => onSelectTab("saved")}
                  title="Guardados"
                  aria-label="Guardados"
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
                    activeTab === "saved" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
              )}
      
              {isMe && (
                <button
                  onClick={() => onSelectTab("orders")}
                  title="Pedidos"
                  aria-label="Pedidos"
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
                    activeTab === "orders" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Package className="w-5 h-5" />
                </button>
              )}
      
              {isMe && (
                <button
                  onClick={() => {
                    setIsEditProfileOpen(true);
                    navigateTo(getProfileConfigPath(activeUser));
                  }}
                  title="Configuración y Editar Perfil"
                  aria-label="Configuración y Editar Perfil"
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer active:scale-95 ${
                    isEditProfileOpen ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
            </div>
  );
}
