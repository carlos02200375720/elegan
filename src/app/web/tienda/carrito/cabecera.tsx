import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import type { CarritoTiendaViewProps } from "./tipos";

type Props = Pick<CarritoTiendaViewProps,
  "closeCartDrawer" | "cart" | "cartItemCount" | "selectedCartIndices" |
  "isAllCartSelected" | "toggleSelectAllCart"
>;

export function CabeceraCarrito({
  closeCartDrawer, cart, cartItemCount, selectedCartIndices,
  isAllCartSelected, toggleSelectAllCart,
}: Props) {
  return (
    <div
      className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0"
      style={{ paddingTop: "0.75rem" }}
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={closeCartDrawer}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
          id="close-cart-drawer-btn"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center space-x-1.5">
          <ShoppingCart className="w-4 h-4 text-amber-500" />
          <span className="font-display font-bold text-sm text-slate-900">
            Carrito ({cartItemCount})
          </span>
        </div>
      </div>
      {cart.length > 0 && (
        <button
          type="button"
          onClick={toggleSelectAllCart}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer bg-transparent border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-700 active:scale-95"
          id="select-all-cart-btn"
        >
          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
            isAllCartSelected
              ? "bg-amber-500 text-slate-950"
              : selectedCartIndices.length > 0
              ? "bg-amber-200 text-amber-900"
              : "border border-slate-300 bg-white"
          }`}>
            {isAllCartSelected ? (
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            ) : selectedCartIndices.length > 0 ? (
              <div className="w-1.5 h-1.5 bg-amber-900 rounded-xs" />
            ) : null}
          </div>
          <span className="text-[10.5px]">
            {isAllCartSelected ? "Quitar" : "Todo"} ({selectedCartIndices.length}/{cart.length})
          </span>
        </button>
      )}
    </div>
  );
}
