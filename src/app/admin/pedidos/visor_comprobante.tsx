import React from "react";
import {
  Building2, ZoomIn, ZoomOut, RotateCw, CheckCircle2,
  Loader2, ShieldCheck, X, Download,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Order } from "../../../types";

interface Props {
  order: Order | null;
  imageZoom: number;
  setImageZoom: React.Dispatch<React.SetStateAction<number>>;
  imageRotation: number;
  setImageRotation: React.Dispatch<React.SetStateAction<number>>;
  isVerifyingPaymentId: string | null;
  handleToggleVerifyReceipt: (order: Order, verified: boolean) => void;
  onClose: () => void;
}

export default function VisorComprobante({
  order, imageZoom, setImageZoom, imageRotation, setImageRotation,
  isVerifyingPaymentId, handleToggleVerifyReceipt, onClose,
}: Props) {
  return (
      {/* MODAL LIGHTBOX PARA INSPECCIONAR COMPROBANTE EN PANTALLA COMPLETA */}
      <AnimatePresence>
        {order && order.paymentReceiptUrl && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col p-3 sm:p-5 select-none animate-in fade-in">
            {/* Top Bar */}
            <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-white shrink-0 shadow-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">
                    Inspección de Comprobante • Pedido #{order.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cliente:{" "}
                    <span className="font-bold text-white">
                      {order.buyerName || "Cliente"}
                    </span>{" "}
                    • Monto exacto:{" "}
                    <span className="font-bold font-mono text-amber-400">
                      ${Number(order.total).toFixed(2)} USD
                    </span>
                  </p>
                </div>
              </div>

              {/* Controls: Zoom, Rotate, Verify, Close */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setImageZoom((prev) => Math.min(prev + 0.25, 3))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Acercar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom((prev) => Math.max(prev - 0.25, 0.5))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Alejar (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Girar 90 grados"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="h-6 w-px bg-slate-700 mx-1" />

                {/* Botón de aprobación rápida dentro del visor */}
                <button
                  type="button"
                  onClick={() =>
                    handleToggleVerifyReceipt(
                      order,
                      !order.receiptVerified
                    )
                  }
                  disabled={isVerifyingPaymentId === order.id}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                    order.receiptVerified
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isVerifyingPaymentId === order.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : order.receiptVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {order.receiptVerified
                      ? "Verificado (clic para deshacer)"
                      : "Aprobar pago como real"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onClose()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer ml-1"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Image Viewport */}
            <div className="flex-1 w-full max-w-5xl mx-auto my-3 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-black/40 border border-slate-800/80">
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                  src={order.paymentReceiptUrl}
                  alt="Comprobante en detalle"
                  style={{
                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                />
              </div>
            </div>

            {/* Bottom Footer Info Bar */}
            <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Archivo: {order.receiptFileName || "foto_comprobante.jpg"}
                </span>
                <span className="text-[11px] text-slate-400">
                  Zoom: {Math.round(imageZoom * 100)}%
                </span>
                {imageRotation > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Rotación: {imageRotation}°
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={order.paymentReceiptUrl}
                  download={
                    order.receiptFileName ||
                    `comprobante_${order.id}.jpg`
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar imagen original</span>
                </a>
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>


  );
}
