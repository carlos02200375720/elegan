import React from "react";
import { Truck, CheckCircle2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { DatosResumen } from "./tipos";

export default function ModalPedidos({ datos }: { datos: DatosResumen }) {
  const { editingOrder, setEditingOrder, orderNewStatus, setOrderNewStatus, orderNewCarrier, setOrderNewCarrier, orderNewTracking, setOrderNewTracking, orderNewNotes, setOrderNewNotes, isUpdatingOrder, handleSaveOrderUpdate } = datos;
  return (
    <>
      {/* Modal for Updating Order Tracking & Status */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900">
                    Actualizar Pedido #{editingOrder.id}
                  </h3>
                </div>
                <button onClick={() => setEditingOrder(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Comprobante de transferencia bancaria si existe */}
              {editingOrder.paymentReceiptUrl && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Comprobante de Transferencia Adjunto
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        editingOrder.receiptVerified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {editingOrder.receiptVerified ? "Pago verificado" : "Por verificar"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={editingOrder.paymentReceiptUrl}
                      alt="Comprobante"
                      className="w-14 h-14 rounded-xl object-cover border border-amber-300 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">
                        {editingOrder.receiptFileName || "comprobante.jpg"}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Monto orden: ${Number(editingOrder.total).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado del Pedido</label>
                  <select
                    value={orderNewStatus}
                    onChange={(e) => setOrderNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Pendiente de preparación</option>
                    <option value="processing">En preparación por el vendedor</option>
                    <option value="shipped">Despachado / En tránsito</option>
                    <option value="delivered">Entregado al comprador</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Empresa de Paquetería / Courier</label>
                  <input
                    type="text"
                    value={orderNewCarrier}
                    onChange={(e) => setOrderNewCarrier(e.target.value)}
                    placeholder="Ej. DHL Express, FedEx, Estafeta, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Número de Guía / Código de Rastreo</label>
                  <input
                    type="text"
                    value={orderNewTracking}
                    onChange={(e) => setOrderNewTracking(e.target.value)}
                    placeholder="Ej. DHL-984729184"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Notas para el Comprador</label>
                  <textarea
                    value={orderNewNotes}
                    onChange={(e) => setOrderNewNotes(e.target.value)}
                    rows={2}
                    placeholder="Indicaciones adicionales de entrega..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditingOrder(null)}
                  disabled={isUpdatingOrder}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOrderUpdate}
                  disabled={isUpdatingOrder}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                >
                  {isUpdatingOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isUpdatingOrder ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
}
