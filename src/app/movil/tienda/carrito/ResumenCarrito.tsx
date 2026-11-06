import React from "react";
import { formatPrice } from "../../utilidades/moneda";

export interface ResumenCarritoProps {
  selectedCartItemsCount: number;
  totalCartCount: number;
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
}

export const ResumenCarrito: React.FC<ResumenCarritoProps> = ({
  selectedCartItemsCount,
  totalCartCount,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
}) => {
  return (
    <div className="space-y-1 mb-2.5" id="android-cart-summary-breakdown">
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
        <span>Subtotal ({selectedCartItemsCount} de {totalCartCount} selec.):</span>
        <span className="font-mono text-slate-800 font-bold">{formatPrice(cartSubtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
        <span>Costo de Envío:</span>
        <span className="font-mono font-bold text-emerald-700">
          {cartShippingTotal === 0 ? "GRATIS" : formatPrice(cartShippingTotal)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
        <span>Total a pagar</span>
        <span className="text-base text-amber-600 font-black font-mono">{formatPrice(cartTotal)}</span>
      </div>
    </div>
  );
};

export default ResumenCarrito;
