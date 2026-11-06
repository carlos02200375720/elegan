import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import { Reel } from "../../tipos";

interface ModalEliminarPublicacionProps {
  publication: Reel | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: (publication: Reel) => void;
}

export default function ModalEliminarPublicacion({
  publication, isDeleting, errorMessage, onCancel, onConfirm,
}: ModalEliminarPublicacionProps) {
  if (!publication) return null;
  return (
    <AnimatePresence>
      {publication && (
                <div
                  id="modal-confirm-delete-publication"
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
                  onClick={() => !isDeleting && onCancel()}
                >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-slate-900 border border-slate-200 flex flex-col items-center text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                      <Trash2 className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      ¿Eliminar publicación?
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Esta publicación se eliminará permanentemente de MongoDB Atlas, Google Cloud Storage y de todos los servidores.
                    </p>
      
                    {errorMessage && (
                      <div className="mt-2 text-xs text-rose-600 font-semibold">
                        {errorMessage}
                      </div>
                    )}
      
                    <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={onCancel}
                        className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        id="btn-confirm-delete-publication"
                        disabled={isDeleting}
                        onClick={() => onConfirm(publication)}
                        className="py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Eliminando...</span>
                          </>
                        ) : (
                          <span>Eliminar</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
      )}
    </AnimatePresence>
  );
}
