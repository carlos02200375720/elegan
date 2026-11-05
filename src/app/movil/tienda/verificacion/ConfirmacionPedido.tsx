import React from "react";
import { ArrowRight } from "lucide-react";

export interface ConfirmacionPedidoProps {
  isCheckingOut: boolean;
  isDisabled: boolean;
  onConfirmClick: () => void;
}

export const ConfirmacionPedido: React.FC<ConfirmacionPedidoProps> = ({
  isCheckingOut,
  isDisabled,
  onConfirmClick,
}) => {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 px-3 py-1.5 shadow-lg box-border"
      style={{
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
        minHeight: "calc(60px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "calc(60px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      id="android-checkout-fixed-bottom-bar"
    >
      <div className="max-w-md mx-auto flex h-[60px] items-center">
        <button
          type="button"
          id="android-checkout-fixed-confirm-btn"
          disabled={isDisabled || isCheckingOut}
          onClick={onConfirmClick}
          className="flex-1 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{isCheckingOut ? "Procesando pedido..." : "Confirmar el pago"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmacionPedido;
