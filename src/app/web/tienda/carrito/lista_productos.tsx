import { ShoppingCart, Trash2, Minus, Plus, Check } from "lucide-react";
import type { CarritoTiendaViewProps } from "./tipos";

type Props = Pick<CarritoTiendaViewProps,
  "cart" | "selectedCartIndices" | "toggleItemSelection" |
  "onRemoveFromCart" | "onUpdateCartQuantity" | "onSelectProductFromCart"
>;

export function ListaProductosCarrito({
  cart, selectedCartIndices, toggleItemSelection, onRemoveFromCart,
  onUpdateCartQuantity, onSelectProductFromCart,
}: Props) {
  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-white no-scrollbar"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
          <ShoppingCart className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
          <p className="font-medium text-slate-600">Su carrito está vacío</p>
          <p className="text-xs text-slate-400 mt-1">
            Explora productos recomendados por nuestros creadores.
          </p>
        </div>
      ) : (
        cart.map((item, idx) => {
          const isSelected = selectedCartIndices.includes(idx);
          const shippingFee =
            item.selectedShippingCost !== undefined
              ? item.selectedShippingCost
              : item.product.shippingCost !== undefined
              ? item.product.shippingCost
              : 0;
          const carrierName = item.selectedCarrier || item.product.selectedCarrier;

          return (
            <div
              key={`${item.product.id}_${idx}`}
              className={`flex items-stretch rounded-2xl border transition-all shadow-sm overflow-hidden h-28 shrink-0 relative ${
                isSelected
                  ? "bg-amber-500/[0.04] border-amber-400/80 shadow-amber-500/10 ring-1 ring-amber-400/40"
                  : "bg-slate-50/70 border-slate-200 opacity-70 hover:opacity-100"
              }`}
              id={`cart-item-${item.product.id}-${idx}`}
            >
              <div className="w-24 sm:w-28 shrink-0 relative bg-slate-200 h-full overflow-hidden">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => onSelectProductFromCart(item.product)}
                />
              </div>
              <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h4
                      className="text-xs font-extrabold text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                      title={item.product.name}
                      onClick={() => onSelectProductFromCart(item.product)}
                    >
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveFromCart(item.product.id, idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-mono font-extrabold text-amber-600">
                      ${item.product.price.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded leading-tight">
                      Envío: {shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : "Gratis"}
                      {carrierName ? ` (${carrierName})` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() =>
                        onUpdateCartQuantity(
                          item.product.id,
                          Math.max(1, item.quantity - 1),
                          idx
                        )
                      }
                      className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-extrabold text-slate-900 px-1">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        onUpdateCartQuantity(item.product.id, item.quantity + 1, idx)
                      }
                      disabled={item.quantity >= item.product.stock}
                      className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleItemSelection(idx, e)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105"
                        : "bg-white border-slate-300 hover:border-amber-400 text-transparent hover:text-slate-300"
                    }`}
                    title={isSelected
                      ? "Deseleccionar producto para pago"
                      : "Seleccionar producto para pagar"}
                    id={`select-item-checkbox-${idx}`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
