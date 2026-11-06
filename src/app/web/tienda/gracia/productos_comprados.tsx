import React from "react";
import { Order } from "../../../../types";
interface Props { activeOrder: Order | null; }
export function ProductosComprados({ activeOrder }: Props) {
  return (
    <>
      {/* Resumen de Productos Comprados */}
              {activeOrder?.items && activeOrder.items.length > 0 && (
                <div className="bg-slate-50/80 rounded-xl p-3 sm:p-4 mt-5 text-left">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    Productos Comprados (
                    {activeOrder.items.reduce((sum, item) => sum + item.quantity, 0)})
                  </span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {activeOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-md object-cover shrink-0 bg-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span>
                              Cant:{" "}
                              <strong className="text-slate-800 font-semibold">{item.quantity}</strong>
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
    </>
  );
}
