import React from "react";
import { ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
import { formatPrice } from "../../utilidades/moneda";

export interface AccionesProductoProps {
  availableStock: number;
  missingOpts: string[];
  isAddedSuccess: boolean;
  price: number;
  onAddToCartClick: () => void;
  fixedBottomBarRef: React.RefObject<HTMLDivElement | null>;
}

export const AccionesProducto: React.FC<AccionesProductoProps> = ({
  availableStock,
  missingOpts,
  isAddedSuccess,
  price,
  onAddToCartClick,
  fixedBottomBarRef,
}) => {
  const hasMissingOpts = missingOpts.length > 0;

  return (
    <div
      ref={fixedBottomBarRef}
      id="android-product-fixed-bottom-bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2 px-3 sm:px-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "max(0.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))" }}
    >
      <div className="max-w-md mx-auto w-full flex items-center justify-center min-h-[38px]">
        <button
          type="button"
          onClick={onAddToCartClick}
          disabled={availableStock <= 0}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 text-center ${
            availableStock <= 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : hasMissingOpts
              ? "bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-500/20"
              : isAddedSuccess
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 scale-[1.01]"
              : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25"
          }`}
          id="android-add-to-cart-detail-btn"
        >
          {availableStock <= 0 ? (
            <span>Agotado</span>
          ) : hasMissingOpts ? (
            <>
              <AlertCircle className="w-4 h-4 shrink-0 text-slate-950" />
              <span className="whitespace-nowrap">
                {missingOpts.length === 1 ? `Elegir ${missingOpts[0]}` : "Elegir opciones"}
              </span>
            </>
          ) : isAddedSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white animate-bounce" />
              <span className="whitespace-nowrap font-black">¡Añadido con éxito!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 shrink-0 text-slate-950" />
              <span className="whitespace-nowrap">
                Añadir al Carrito • {formatPrice(price)}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccionesProducto;
