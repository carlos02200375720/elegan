import React from "react";
import { CartItem } from "../../tipos";
import { formatPrice } from "../../utilidades/moneda";
import { getProductImageUrl } from "../productMedia";
import { ContactInfo } from "./TiposConfirmacion";
import { DetallesPedido } from "./DetallesPedido";
import { InformacionEntrega } from "./InformacionEntrega";

export interface ResumenCompraProps {
  lastOrderItems: CartItem[];
  lastDeliveryAddress: string;
  lastContactInfo: ContactInfo;
  subtotal: number;
  effectiveShipping: number;
  lastShippingCarrier?: string;
  thankYouTotal: number;
}

export const ResumenCompra: React.FC<ResumenCompraProps> = ({
  lastOrderItems,
  lastDeliveryAddress,
  lastContactInfo,
  subtotal,
  effectiveShipping,
  lastShippingCarrier,
  thankYouTotal,
}) => {
  return (
    <div
      className="mt-5 bg-slate-50/90 border border-slate-200 rounded-[2rem] p-4 shadow-sm"
      id="android-thank-you-purchase-summary"
    >
      {/* Encabezado e identificación del pedido */}
      <DetallesPedido itemsCount={lastOrderItems.length} />

      {/* Lista de productos comprados */}
      <div className="mt-3 space-y-2.5">
        {lastOrderItems.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-3">
            Sin productos en esta compra.
          </div>
        ) : (
          lastOrderItems.map((item, idx) => (
            <div
              key={`${item.product.id}-${idx}`}
              className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-3 shadow-2xs"
            >
              <img
                src={getProductImageUrl(item.product)}
                alt={item.product.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 line-clamp-1">
                    {item.product.name}
                  </span>
                  <span className="text-xs font-black text-slate-900 whitespace-nowrap">
                    {formatPrice(item.product.price * (item.quantity || 1))}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Cantidad: {item.quantity || 1}</span>
                  <span>{formatPrice(item.product.price)} c/u</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Datos y dirección de entrega */}
      <InformacionEntrega
        lastDeliveryAddress={lastDeliveryAddress}
        lastContactInfo={lastContactInfo}
      />

      {/* Desglose financiero: Subtotal, Envío y Total */}
      <div className="mt-2.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-600 pt-2.5 border-t border-slate-200/80">
          <span>Subtotal productos</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5">
            <span>Precio de envío</span>
            {lastShippingCarrier && (
              <span className="text-[10px] text-slate-500 font-medium">
                ({lastShippingCarrier})
              </span>
            )}
            {effectiveShipping === 0 && (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200/80">
                Gratis
              </span>
            )}
          </span>
          <span
            className={`font-semibold ${
              effectiveShipping === 0 ? "text-emerald-700 font-bold" : "text-slate-900"
            }`}
          >
            {effectiveShipping === 0 ? "Envío Gratis" : formatPrice(effectiveShipping)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm font-black">
          <span className="text-slate-800">Total</span>
          <span className="text-slate-950 font-mono text-base">
            {formatPrice(thankYouTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResumenCompra;
