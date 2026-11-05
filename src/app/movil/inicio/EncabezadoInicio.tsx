import React from "react";
import { ShoppingBag } from "lucide-react";
import type { User } from "../../../types";
import { isGuestUser } from "../../../types";
import { MovilHamburgerButton } from "../componente/menu";

interface EncabezadoInicioProps {
  currentUser: User;
  totalCartCount: number;
  totalUnreads: number;
  unreadCount: number;
  onOpenMenu: () => void;
  onOpenCart: () => void;
}

export default function EncabezadoInicio({
  currentUser,
  totalCartCount,
  totalUnreads,
  unreadCount,
  onOpenMenu,
  onOpenCart,
}: EncabezadoInicioProps) {
  const displayName = currentUser?.name?.trim() && !isGuestUser(currentUser)
    ? currentUser.name
    : "Inicio";

  return (
    <header
      className="sticky top-0 inset-x-0 z-40 flex flex-col shrink-0 box-border justify-end bg-white border-t-0 border-b border-slate-200/80 pointer-events-auto"
      style={{
        height: "calc(50px + env(safe-area-inset-top, 0px))",
        minHeight: "calc(50px + env(safe-area-inset-top, 0px))",
        maxHeight: "calc(50px + env(safe-area-inset-top, 0px))",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        backgroundColor: "#ffffff",
      }}
      id="android-reels-fixed-header"
    >
      <div
        className="relative mx-auto flex h-[50px] min-h-[50px] max-h-[50px] w-full max-w-md shrink-0 items-center justify-between px-5 bg-white border-t-0"
        style={{ height: "50px", minHeight: "50px", maxHeight: "50px", backgroundColor: "#ffffff" }}
      >
        <h1
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-[calc(100%-10rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-base font-bold text-slate-900"
          title={displayName}
        >
          {displayName}
        </h1>
        <div className="flex items-center space-x-2">
          <MovilHamburgerButton dark onOpen={onOpenMenu} totalUnreads={totalUnreads || unreadCount || 0} />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCart}
            className="relative p-1.5 rounded-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center pointer-events-auto"
            id="android-reels-cart-btn"
            title="Ver carrito de compras"
            aria-label={`Ver carrito (${totalCartCount} productos)`}
          >
            <ShoppingBag className="w-5 h-5 text-slate-800" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-mono text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {totalCartCount > 99 ? "99+" : totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
