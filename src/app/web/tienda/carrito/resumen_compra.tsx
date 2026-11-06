import { ArrowLeft } from "lucide-react";
import type { CarritoTiendaViewProps } from "./tipos";

type Props = Pick<CarritoTiendaViewProps,
  "cart" | "selectedCartItems" | "cartSubtotal" | "cartShippingTotal" |
  "cartTotal" | "startCheckout"
>;

export function ResumenCompraCarrito({
  cart, selectedCartItems, cartSubtotal, cartShippingTotal, cartTotal,
  startCheckout,
}: Props) {
  return (
    <>
      {cart.length > 0 && (
        <div className="px-4 pt-2 pb-[1px] md:py-2 border-t border-slate-100 bg-white space-y-1.5 shrink-0">
          <div className="flex justify-between text-[11px] text-slate-500 font-medium leading-tight">
            <span>Subtotal ({selectedCartItems.length} de {cart.length} selec.):</span>
            <span className="font-mono text-slate-800 font-semibold">
              ${cartSubtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium leading-tight">
            <span>Costo de Envío:</span>
            <span className="font-mono font-bold text-slate-900">
              {cartShippingTotal === 0 ? "GRATIS" : `$${cartShippingTotal.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-1.5">
            <span>Total a Pagar:</span>
            <span className="font-mono text-slate-950 font-black text-sm">
              ${cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={startCheckout}
            disabled={selectedCartItems.length === 0}
            className={`w-full font-extrabold py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer mt-1 shadow-md ${
              selectedCartItems.length > 0
                ? "bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 shadow-amber-500/20"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
            id="checkout-btn"
          >
            {selectedCartItems.length > 0 ? (
              <>
                <span>
                  Pagar ({selectedCartItems.length}{" "}
                  {selectedCartItems.length === 1 ? "producto" : "productos"})
                </span>
                <ArrowLeft className="w-4 h-4 rotate-180 text-slate-950" />
              </>
            ) : (
              <span>Selecciona productos para pagar</span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
