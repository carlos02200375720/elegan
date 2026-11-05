import React from "react";
import { ShoppingBag, Sparkles } from "lucide-react";

export interface AccionesConfirmacionProps {
  onContinueShopping: () => void;
  onNavigateToHistory?: () => void;
}

export const AccionesConfirmacion: React.FC<AccionesConfirmacionProps> = ({
  onContinueShopping,
  onNavigateToHistory,
}) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2.5 flex flex-row items-center justify-between gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "max(10px, calc(env(safe-area-inset-bottom, 0px) + 8px))" }}
      id="android-thank-you-bottom-actions"
    >
      {onNavigateToHistory ? (
        <>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 active:scale-95 transition-transform cursor-pointer truncate"
            id="android-thank-you-history-btn"
          >
            <ShoppingBag className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="truncate">Historial de Pedidos</span>
          </button>

          <button
            type="button"
            onClick={onContinueShopping}
            className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 active:scale-95 transition-transform cursor-pointer truncate"
            id="android-thank-you-continue-btn"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Seguir Comprando</span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-transform cursor-pointer"
          id="android-thank-you-continue-full-btn"
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Seguir Comprando</span>
        </button>
      )}
    </div>
  );
};

export default AccionesConfirmacion;
