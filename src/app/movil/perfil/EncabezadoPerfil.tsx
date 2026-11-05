import React from "react";
import { User } from "../../../types";
import { ShoppingBag, ArrowLeft, BadgeCheck } from "lucide-react";
import { isSuperAdmin } from "../../../superAdmin";
import { navigateTo } from "../../../router";

interface EncabezadoPerfilProps {
  activeUser: User;
  isMe: boolean;
  onBackToSelf?: () => void;
  onEditProfile: () => void;
  onOpenCart?: () => void;
  totalCartItems: number;
}

export default function EncabezadoPerfil({
  activeUser, isMe, onBackToSelf, onEditProfile, onOpenCart, totalCartItems,
}: EncabezadoPerfilProps) {
  return (
      <header
              id="android-profile-header"
              className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-2xs"
              style={{
                backgroundColor: "#ffffff",
                paddingTop: "max(24px, env(safe-area-inset-top, 24px))",
              }}
            >
              <div className="flex items-center justify-between px-4 h-14 w-full">
                {/* Lado izquierdo: Foto / Icono de perfil (y botón para volver si es perfil de otro creador) */}
                <div className="flex items-center gap-2 shrink-0">
                  {onBackToSelf && !isMe && (
                    <button
                      type="button"
                      onClick={onBackToSelf}
                      className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 active:scale-95 transition-transform cursor-pointer"
                      aria-label="Volver a mi perfil"
                      title="Volver a mi perfil"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div
                    className={`relative ${isMe ? "cursor-pointer active:scale-95 transition-transform" : ""}`}
                    onClick={() => {
                      if (isMe) onEditProfile();
                    }}
                    title={isMe ? "Editar foto y perfil" : activeUser.name}
                  >
                    <img
                      src={activeUser.avatar}
                      alt={activeUser.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs bg-white"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                      }}
                    />
                  </div>
                </div>
      
                {/* En el medio: Solo el nombre del cliente con el icono azul de verificado */}
                <div className="flex-1 flex items-center justify-center gap-1.5 px-2 min-w-0">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {activeUser.name}
                  </span>
                  {isSuperAdmin(activeUser) && (
                    <span className="inline-flex items-center justify-center shrink-0" title="Verificado">
                      <BadgeCheck className="w-4 h-4 text-white fill-blue-500 shrink-0 drop-shadow-2xs" />
                    </span>
                  )}
                </div>
      
                {/* Esquina derecha: Icono del carrito con contador de productos */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCart) {
                        onOpenCart();
                      } else {
                        navigateTo("/tienda/carrito");
                      }
                    }}
                    id="mobile-profile-cart-btn"
                    className="relative p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                    title="Carrito de compras"
                    aria-label={`Carrito de compras (${totalCartItems} productos)`}
                  >
                    <ShoppingBag className="w-5 h-5 text-slate-800" />
                    {totalCartItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white leading-none">
                        {totalCartItems > 99 ? "99+" : totalCartItems}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </header>
  );
}
