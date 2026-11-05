import React from "react";
import { CreditCard } from "lucide-react";
import { formatPrice } from "../../../../utils/currency";
import { ResumenCarrito } from "./ResumenCarrito";

export interface BarraCompraCarritoProps {
  isDrawer: boolean;
  selectedCartItemsCount: number;
  totalCartCount: number;
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  hasSelection: boolean;
  onProceedToCheckout: () => void;
  fixedFooterRef: React.RefObject<HTMLDivElement | null>;
}

export const BarraCompraCarrito: React.FC<BarraCompraCarritoProps> = ({
  isDrawer,
  selectedCartItemsCount,
  totalCartCount,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
  hasSelection,
  onProceedToCheckout,
  fixedFooterRef,
}) => {
  return (
    <div
      ref={fixedFooterRef}
      id="android-cart-footer-summary"
      className={`${isDrawer ? "absolute" : "fixed"} bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-4 py-3`}
      style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))" }}
    >
      <div className="max-w-md mx-auto w-full">
        {/* Resumen de costos */}
        <ResumenCarrito
          selectedCartItemsCount={selectedCartItemsCount}
          totalCartCount={totalCartCount}
          cartSubtotal={cartSubtotal}
          cartShippingTotal={cartShippingTotal}
          cartTotal={cartTotal}
        />

        {/* Botón para continuar a la verificación */}
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onProceedToCheckout}
          className={`w-full py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 ${
            !hasSelection
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 hover:brightness-110 active:scale-[0.98] cursor-pointer"
          }`}
          id="android-cart-proceed-checkout-btn"
        >
          <CreditCard className="w-4 h-4" />
          <span>
            {!hasSelection
              ? "Selecciona productos para pagar"
              : `Completar Compra (${selectedCartItemsCount}) - ${formatPrice(cartTotal)}`}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BarraCompraCarrito;
