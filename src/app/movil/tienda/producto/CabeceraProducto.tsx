import React from "react";
import { ArrowRight, Bookmark, ShoppingBag } from "lucide-react";
import { CartItem } from "../../tipos";

export interface CabeceraProductoProps {
  onBackToCatalog: () => void;
  isSaved: boolean;
  onToggleSave?: () => void;
  openCartPage: () => void;
  cart: CartItem[];
  isCartShockwave: boolean;
  shockwaveKey: number;
}

export const CabeceraProducto: React.FC<CabeceraProductoProps> = ({
  onBackToCatalog,
  isSaved,
  onToggleSave,
  openCartPage,
  cart,
  isCartShockwave,
  shockwaveKey,
}) => {
  return (
    <>
      {/* Barra de estado nativa en blanco */}
      <div
        className="w-full bg-white shrink-0 z-40 fixed top-0 inset-x-0 pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Cabecera 100% transparente fija */}
      <header
        id="android-detail-fixed-header"
        className="fixed top-0 inset-x-0 z-50 bg-transparent pointer-events-none"
        style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}
      >
        <div className="max-w-md mx-auto w-full px-3.5 py-2.5 flex items-center justify-between pointer-events-none">
          {/* Botón de regreso */}
          <button
            type="button"
            id="android-detail-back-btn"
            onClick={onBackToCatalog}
            className="pointer-events-auto p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group"
            title="Volver a la tienda"
          >
            <ArrowRight className="w-6 h-6 rotate-180 text-black group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex-1" />

          {/* Botón Guardar producto en publicaciones */}
          <button
            type="button"
            id="android-detail-save-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave?.();
            }}
            className="pointer-events-auto relative p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group mr-1"
            title={isSaved ? "Guardado en publicaciones" : "Guardar en publicaciones"}
            aria-label="Guardar producto en publicaciones"
          >
            <Bookmark
              className={`w-6 h-6 transition-all duration-200 ${
                isSaved ? "fill-black text-black scale-105" : "text-black group-hover:text-neutral-700"
              }`}
            />
          </button>

          {/* Icono del carrito */}
          <button
            type="button"
            id="android-detail-cart-btn"
            onClick={openCartPage}
            className="pointer-events-auto relative p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group"
            title="Ver carrito"
          >
            <ShoppingBag
              className={`w-6 h-6 text-black group-hover:scale-110 transition-all duration-300 ${
                isCartShockwave ? "scale-115 !text-black" : ""
              }`}
            />
            {(cart.length > 0 || isCartShockwave) && (
              <span
                key={`detail-cart-counter-${shockwaveKey}`}
                className={`absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                  isCartShockwave
                    ? "scale-125 ring-2 ring-amber-300 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                    : "scale-100"
                }`}
              >
                {Math.max(1, cart.reduce((s, i) => s + (i.quantity || 1), 0))}

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
      </header>
    </>
  );
};

export default CabeceraProducto;
