import React from "react";
import { Check, Copy, Truck } from "lucide-react";
import { Order } from "../../../../types";
interface Props { activeOrder: Order | null; itemsSubtotal: number; selectedShippingCost: number; selectedCarrier: string; copiedId: boolean; handleCopyOrderId: () => void; }
export function DetallePedido({ activeOrder, itemsSubtotal, selectedShippingCost, selectedCarrier, copiedId, handleCopyOrderId }: Props) {
  return (
    <>
      {/* Detalle de Pedido y Dirección Completa */}
              {activeOrder && (
                <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4 mt-3 text-left space-y-2.5 text-xs border border-slate-100">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2 items-center">
                    <span className="text-slate-500 font-medium">Código de Compra:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-extrabold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                        {activeOrder.id}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyOrderId}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded"
                        title="Copiar código de pedido"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Fecha:</span>
                    <span className="font-mono text-slate-700">
                      {new Date(activeOrder.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-b border-slate-200/60 pb-2.5">
                    <span className="text-slate-500 font-medium block mb-1">
                      Dirección de Envío Completa:
                    </span>
                    <p className="text-slate-800 font-medium text-xs leading-relaxed break-words whitespace-normal">
                      {activeOrder.shippingAddress}
                    </p>
                  </div>
      
                  {/* Subtotal de los productos */}
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Subtotal Productos:</span>
                    <span className="font-mono font-bold text-slate-800">
                      ${itemsSubtotal.toFixed(2)}
                    </span>
                  </div>
      
                  {/* Precio del Envío Seleccionado */}
                  <div className="flex justify-between border-b border-slate-200/60 pb-2 items-center" id="thankyou-shipping-cost-row">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-slate-700 font-bold">Precio del Envío Seleccionado:</span>
                      {selectedCarrier && (
                        <span className="text-[10px] bg-amber-100/90 text-amber-900 font-black px-1.5 py-0.5 rounded border border-amber-300/60">
                          {selectedCarrier}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-extrabold text-slate-900">
                      {selectedShippingCost === 0 ? (
                        <span className="text-emerald-600 font-black">GRATIS ($0.00)</span>
                      ) : (
                        `$${selectedShippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
      
                  <div className="flex justify-between text-sm font-bold pt-1 items-center">
                    <span className="text-slate-900">Total Cargado:</span>
                    <span className="text-emerald-600 font-mono text-base font-black">
                      ${activeOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
    </>
  );
}
