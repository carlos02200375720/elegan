import React from "react";
import { Order } from "../tipos";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Check, Truck, Copy, ExternalLink, MapPin, Calendar, Clock, PackageSearch,
} from "lucide-react";

interface ModalRastreoProps {
  order: Order | null;
  copiedTrackingId: string | null;
  onClose: () => void;
  onCopyTrackingNumber: (trackingNum: string, orderId: string, e?: React.MouseEvent) => void;
}

export default function ModalRastreo({
  order, copiedTrackingId, onClose, onCopyTrackingNumber,
}: ModalRastreoProps) {
  const selectedTrackingOrder = order;
  return (
      <AnimatePresence>
        {selectedTrackingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
              id="modal-live-tracking"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <PackageSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-900">Rastreo de Envío en Vivo</h3>
                    <p className="text-[11px] font-mono text-slate-500">Ref: {selectedTrackingOrder.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onClose()}
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Truck className="w-3 h-3" />
                      <span>{selectedTrackingOrder.carrier || "Paquetería Express"}</span>
                    </span>

                    {selectedTrackingOrder.estimatedDelivery && (
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Entrega: {selectedTrackingOrder.estimatedDelivery}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Número de Guía / Seguimiento
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-base font-black font-mono text-slate-900 tracking-wider">
                        {selectedTrackingOrder.trackingNumber || "Pendiente de asignación"}
                      </span>
                      {selectedTrackingOrder.trackingNumber && (
                        <button
                          onClick={(e) =>
                            onCopyTrackingNumber(
                              selectedTrackingOrder.trackingNumber!,
                              selectedTrackingOrder.id,
                              e
                            )
                          }
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedTrackingId === selectedTrackingOrder.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-700 font-bold">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copiar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedTrackingOrder.trackingUrl && (
                    <div className="pt-1">
                      <a
                        href={selectedTrackingOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        <span>Abrir portal oficial de {selectedTrackingOrder.carrier || "paquetería"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">
                    Estado Actual del Paquete
                  </p>
                  {(() => {
                    const st = selectedTrackingOrder.status;
                    const step = st === "delivered" ? 4 : st === "shipped" ? 3 : st === "processing" ? 2 : 1;
                    return (
                      <div className="relative flex items-center justify-between px-2">
                        <div className="absolute left-6 right-6 top-3 h-1 bg-slate-200 z-0" />
                        <div
                          className="absolute left-6 top-3 h-1 bg-amber-500 transition-all duration-300 z-0"
                          style={{
                            width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%",
                          }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 1
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Confirmado</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 2
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Preparando</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 3
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">En Camino</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step === 4
                                ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step === 4 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Entregado</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Historial Cronológico de Paradas y Despacho
                  </p>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
                    {selectedTrackingOrder.statusHistory && selectedTrackingOrder.statusHistory.length > 0 ? (
                      selectedTrackingOrder.statusHistory.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start space-x-3 text-xs">
                          <div className="relative flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-black ring-4 ring-amber-50 shrink-0">
                              ✓
                            </div>
                            {hIdx < (selectedTrackingOrder.statusHistory?.length || 1) - 1 && (
                              <div className="w-0.5 h-10 bg-slate-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-slate-900 text-xs truncate">
                                {h.label || "Actualización de despacho"}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {new Date(h.timestamp).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {h.note && <p className="text-[11px] text-slate-600">{h.note}</p>}
                            {h.trackingNumber && (
                              <p className="text-[10px] text-amber-700 font-mono font-bold">
                                Guía asignada: {h.trackingNumber} ({h.carrier || "Transportista"})
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        <Clock className="w-6 h-6 mx-auto mb-1 stroke-1 text-slate-300" />
                        <p>El paquete está en proceso de despacho inicial.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Dirección de Destino:</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedTrackingOrder.shippingAddress}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
}
