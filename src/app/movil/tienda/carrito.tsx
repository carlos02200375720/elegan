import React from "react";
import { ArrowRight, ShoppingBag, Check, Trash2, Minus, Plus, CreditCard } from "lucide-react";
import { Product, CartItem } from "../../../types";

export interface AndroidCarritoProps {
  cart: CartItem[];
  selectedCartIndices: number[];
  isAllCartSelected: boolean;
  toggleSelectAllCart: () => void;
  toggleSelectCartItem: (idx: number) => void;
  selectedCartItems: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  handleItemRemove: (idx: number, item: CartItem) => void;
  handleItemQtyChange: (idx: number, item: CartItem, newQty: number) => void;
  onSelectProduct: (product: Product) => void;
  onProceedToCheckout: () => void;
  onCloseCart: () => void;
  onExploreProducts: () => void;
}

export function CarritoTiendaView({
  cart,
  selectedCartIndices,
  isAllCartSelected,
  toggleSelectAllCart,
  toggleSelectCartItem,
  selectedCartItems,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
  handleItemRemove,
  handleItemQtyChange,
  onSelectProduct,
  onProceedToCheckout,
  onCloseCart,
  onExploreProducts,
}: AndroidCarritoProps) {
  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none" id="android-cart-page">
      {/* Cart Top Header */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 pb-3 border-b border-slate-200 flex items-center justify-between"
        style={{ paddingTop: "max(12px, calc(env(safe-area-inset-top, 0px) + 8px))" }}
      >
        <button
          type="button"
          onClick={onCloseCart}
          className="p-2 rounded-full bg-slate-100 text-slate-900 active:scale-95 cursor-pointer hover:bg-slate-200 transition-colors"
          id="android-cart-back-btn"
          title="Volver"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-black text-slate-900">Carrito de Compras</h1>
        </div>
        <div className="w-8" />
      </div>

      {/* Cart Items List */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${cart.length > 0 ? "pb-36" : "pb-10"}`}>
        {cart.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
              <ShoppingBag className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="mt-4 text-sm font-black text-slate-900">Tu carrito está vacío</h3>
            <p className="text-[11px] text-slate-500 mt-1">Añade productos para empezar tu compra.</p>
            <button
              type="button"
              onClick={onExploreProducts}
              className="mt-5 px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:bg-amber-400 active:scale-95 transition-all"
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <>
            {/* Select all bar */}
            <div className="flex items-center justify-between pb-1 px-1">
              <button
                type="button"
                onClick={toggleSelectAllCart}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors cursor-pointer select-none"
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                    isAllCartSelected
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : selectedCartIndices.length > 0
                      ? "bg-amber-200 text-amber-900"
                      : "border-2 border-slate-300 bg-white"
                  }`}
                >
                  {isAllCartSelected ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : selectedCartIndices.length > 0 ? (
                    <div className="w-1.5 h-1.5 bg-amber-900 rounded-xs" />
                  ) : null}
                </div>
                <span>
                  {isAllCartSelected ? "Deseleccionar todo" : "Seleccionar todo"} ({selectedCartIndices.length}/{cart.length})
                </span>
              </button>
              <span className="text-[11px] font-bold text-amber-700">
                {selectedCartIndices.length} para pagar
              </span>
            </div>

            {cart.map((item, idx) => {
              const isSelected = selectedCartIndices.includes(idx);
              const shippingFee =
                item.selectedShippingCost !== undefined
                  ? Number(item.selectedShippingCost)
                  : Number(item.product.shippingCost ?? 0);
              const carrierName = item.selectedCarrier || item.product.selectedCarrier;

              return (
                <div
                  key={`${item.product.id}-${idx}`}
                  className={`flex items-stretch rounded-2xl border transition-all shadow-sm overflow-hidden h-28 shrink-0 relative ${
                    isSelected
                      ? "bg-amber-500/[0.04] border-amber-400/80 shadow-amber-500/10 ring-1 ring-amber-400/40"
                      : "bg-slate-50/70 border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                  id={`android-cart-item-${item.product.id}-${idx}`}
                >
                  <div className="w-24 sm:w-28 shrink-0 relative bg-slate-200 h-full overflow-hidden">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => onSelectProduct(item.product)}
                    />
                  </div>

                  <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          className="text-xs font-extrabold text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                          title={item.product.name}
                          onClick={() => onSelectProduct(item.product)}
                        >
                          {item.product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleItemRemove(idx, item)}
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

                    {/* Incrementor buttons & Selection in bottom-right */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleItemQtyChange(idx, item, Math.max(1, (item.quantity || 1) - 1))}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-extrabold text-slate-900 px-1">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleItemQtyChange(idx, item, (item.quantity || 1) + 1)}
                          disabled={item.product.stock !== undefined && (item.quantity || 1) >= item.product.stock}
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Selector in bottom-right corner */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectCartItem(idx);
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105"
                            : "bg-white border-slate-300 hover:border-amber-400 text-transparent hover:text-slate-300"
                        }`}
                        title={isSelected ? "Deseleccionar producto para pago" : "Seleccionar producto para pagar"}
                        aria-label={isSelected ? "Deseleccionar producto" : "Seleccionar producto"}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Cart Bottom Checkout Summary */}
      {cart.length > 0 && (
        <div
          id="android-cart-footer-summary"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))" }}
        >
          <div className="max-w-md mx-auto w-full">
            <div className="space-y-1 mb-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Subtotal ({selectedCartItems.length} de {cart.length} selec.):</span>
                <span className="font-mono text-slate-800 font-bold">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Costo de Envío:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {cartShippingTotal === 0 ? "GRATIS" : `$${cartShippingTotal.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Total a pagar</span>
                <span className="text-base text-amber-600 font-black font-mono">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={selectedCartIndices.length === 0}
              onClick={onProceedToCheckout}
              className={`w-full py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 ${
                selectedCartIndices.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 hover:brightness-110 active:scale-[0.98] cursor-pointer"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {selectedCartIndices.length === 0
                  ? "Selecciona productos para pagar"
                  : `Completar Compra (${selectedCartItems.length}) - $${cartTotal.toFixed(2)}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarritoTiendaView;
