import React from "react";
import { Search, X, ShoppingBag } from "lucide-react";

export interface CabeceraCatalogoProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  openCartPage: () => void;
  cartCount: number;
  isCartShockwave: boolean;
  shockwaveKey: number;
}

export const CabeceraCatalogo: React.FC<CabeceraCatalogoProps> = ({
  searchQuery,
  setSearchQuery,
  openCartPage,
  cartCount,
  isCartShockwave,
  shockwaveKey,
}) => {
  return (
    <div
      id="android-shop-search-header"
      className="px-3 pb-2.5 flex items-center gap-2 bg-white"
      style={{
        paddingTop: "max(14px, calc(env(safe-area-inset-top, 0px) + 10px))",
      }}
    >
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-9 pr-8 py-2 bg-white hover:bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            aria-label="Borrar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={openCartPage}
        className="relative p-2 text-slate-900 active:scale-95 transition-transform shrink-0"
        aria-label="Carrito de compras"
      >
        <ShoppingBag
          className={`w-5 h-5 transition-all duration-300 ${
            isCartShockwave ? "text-slate-950 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "text-slate-950"
          }`}
        />
        {(cartCount > 0 || isCartShockwave) && (
          <span
            key={`main-cart-counter-${shockwaveKey}`}
            className={`absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow transition-all duration-300 ${
              isCartShockwave
                ? "scale-125 ring-2 ring-amber-300 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                : "scale-100"
            }`}
          >
            {Math.max(1, cartCount)}

            {isCartShockwave && (
              <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-amber-400 animate-cart-shockwave" />
                <span className="absolute inset-0 rounded-full border-2 border-amber-300 animate-cart-shockwave-2" />
                <span className="absolute inset-0 rounded-full border border-amber-200 animate-cart-shockwave-3" />
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
};

export default CabeceraCatalogo;
