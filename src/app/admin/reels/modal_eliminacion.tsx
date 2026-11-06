import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { ReelEliminar } from "./tipos";

interface Props {
  reel: ReelEliminar | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModalEliminacionReel({
  reel,
  isDeleting,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <AnimatePresence>
      {reel && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-900"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">¿Confirmar eliminación?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Estás a punto de eliminar de forma permanente el reel{" "}
                <span className="font-bold text-slate-900">"{reel?.name}"</span>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={onCancel}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
