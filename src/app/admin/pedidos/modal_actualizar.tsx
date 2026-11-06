import React from "react";
import { Truck, X, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order } from "../tipos";

interface Props {
  order: Order | null;
  orderNewStatus: string;
  setOrderNewStatus: (value: string) => void;
  orderNewCarrier: string;
  setOrderNewCarrier: (value: string) => void;
  orderNewTracking: string;
  setOrderNewTracking: (value: string) => void;
  orderNewNotes: string;
  setOrderNewNotes: (value: string) => void;
  isUpdatingOrder: boolean;
  handleSaveLocalOrderUpdate: () => void;
  onClose: () => void;
  openReceiptModal: (order: Order) => void;
}

export default function ModalActualizarPedido({
  order, orderNewStatus, setOrderNewStatus, orderNewCarrier,
  setOrderNewCarrier, orderNewTracking, setOrderNewTracking,
  orderNewNotes, setOrderNewNotes, isUpdatingOrder,
  handleSaveLocalOrderUpdate, onClose, openReceiptModal,
}: Props) {
  return (
    <>
      {/* Fallback Modal for Updating Order Tracking & Status when used standalone */}
      <AnimatePresence>
        {order && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900">
                    Actualizar Pedido #{order.id}
                  </h3>
                </div>
                <button
                  onClick={() => onClose()}
                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Si tiene comprobante bancario, mostrar aviso y acceso directo */}
              {order.paymentReceiptUrl && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={order.paymentReceiptUrl}
                      alt="Comprobante"
                      className="w-10 h-10 rounded-lg object-cover border border-amber-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-black text-slate-900 block truncate">
                        Comprobante de Transferencia
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          order.receiptVerified
                            ? "text-emerald-700"
                            : "text-amber-800"
                        }`}
                      >
                        {order.receiptVerified
                          ? "Pago validado"
                          : "Pendiente de validación"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReceiptModal(order)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ver</span>
                  </button>
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
                  <label className="font-bold text-slate-700 block mb-1">
                    Empresa de Paquetería / Courier
                  </label>
                  <input
                    type="text"
                    value={orderNewCarrier}
                    onChange={(e) => setOrderNewCarrier(e.target.value)}
                    placeholder="Ej. DHL Express, Caribe Tours, Metro Pac, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de Guía / Código de Rastreo
                  </label>
                  <input
                    type="text"
                    value={orderNewTracking}
                    onChange={(e) => setOrderNewTracking(e.target.value)}
                    placeholder="Ej. DHL-984729184"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Notas para el Comprador
                  </label>
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
                  onClick={() => onClose()}
                  disabled={isUpdatingOrder}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLocalOrderUpdate}
                  disabled={isUpdatingOrder}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUpdatingOrder ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
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
