import React from "react";
import { Sparkles, ShoppingBag } from "lucide-react";
import { CartItem } from "../../../types";

export interface AndroidGraciaProps {
  lastOrderItems: CartItem[];
  lastDeliveryAddress: string;
  lastContactInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  onContinueShopping: () => void;
  onNavigateToHistory?: () => void;
}

export function GraciaTiendaView({
  lastOrderItems,
  lastDeliveryAddress,
  lastContactInfo,
  onContinueShopping,
  onNavigateToHistory,
}: AndroidGraciaProps) {
  const thankYouTotal = lastOrderItems.reduce(
    (sum, item) => sum + item.product.price * (item.quantity || 1),
    0
  );

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none overflow-x-hidden overflow-y-auto">
      <div
        className="relative z-10 px-4 py-8 flex flex-col min-h-screen bg-white"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)" }}
      >
        <div className="flex items-center justify-center mt-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-amber-300 bg-amber-50 flex items-center justify-center shadow-lg shadow-amber-100">
              <Sparkles className="w-10 h-10 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <div className="text-[11px] uppercase tracking-[0.3em] text-amber-600 font-black">
            Compra confirmada
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            ¡Gracias por tu compra!
          </h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Tu pedido fue recibido con éxito y está siendo preparado.
          </p>
        </div>

        <div className="mt-5 bg-slate-50/90 border border-slate-200 rounded-[2rem] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">
              Resumen de productos
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {lastOrderItems.length} artículos
            </span>
          </div>

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
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-xs font-black text-slate-900 whitespace-nowrap">
                        ${(item.product.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>Cantidad: {item.quantity || 1}</span>
                      <span>${item.product.price.toFixed(2)} c/u</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Dirección de entrega</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {lastDeliveryAddress}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Contacto</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {lastContactInfo.fullName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Email</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {lastContactInfo.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Teléfono</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                {lastContactInfo.phone}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm font-black">
              <span className="text-slate-800">Total</span>
              <span className="text-slate-950">${thankYouTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={onContinueShopping}
            className="w-full max-w-xs py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-transform cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Seguir Comprando</span>
          </button>
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="w-full max-w-xs py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-black rounded-2xl shadow-2xs flex items-center justify-center space-x-2 active:scale-95 transition-transform cursor-pointer"
              style={{ marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 3px)" }}
            >
              <ShoppingBag className="w-4 h-4 text-slate-700" />
              <span>Historial de Pedidos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GraciaTiendaView;
export { GraciaTiendaView as GrasiaTiendaView };
export type AndroidGrasiaProps = AndroidGraciaProps;
