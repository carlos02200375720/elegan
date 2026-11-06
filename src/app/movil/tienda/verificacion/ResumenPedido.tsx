import React from "react";
import { CartItem } from "../../tipos";
import { formatPrice } from "../../utilidades/moneda";
import { getProductImageUrl } from "../productMedia";

export interface ResumenPedidoProps {
  effectiveCheckoutItems: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
}

export const ResumenPedido: React.FC<ResumenPedidoProps> = ({
  effectiveCheckoutItems,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
}) => {
  return (
    <div className="w-full bg-white rounded-none shadow-none p-4" id="android-checkout-order-summary">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Resumen de compra
        </span>
        <span className="text-[11px] font-bold text-amber-600">
          {effectiveCheckoutItems.length} {effectiveCheckoutItems.length === 1 ? "artículo" : "artículos"}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {effectiveCheckoutItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
          >
            <img
              src={getProductImageUrl(item.product)}
              alt={item.product.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-slate-900 truncate">
                  {item.product.name}
                </span>
                <span className="text-[11px] font-black text-amber-600 font-mono shrink-0">
                  {formatPrice(item.product.price * (item.quantity || 1))}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span>Cantidad: {item.quantity || 1}</span>
                <span>{formatPrice(item.product.price)} c/u</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-slate-600 font-semibold">
          <span>Subtotal</span>
          <span className="font-mono">{formatPrice(cartSubtotal)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 font-semibold">
          <span>Costo de Envío</span>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
            {cartShippingTotal === 0 ? "GRATIS" : formatPrice(cartShippingTotal)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
          <span>Total a pagar</span>
          <span className="text-amber-600 font-mono text-base">{formatPrice(cartTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default ResumenPedido;
