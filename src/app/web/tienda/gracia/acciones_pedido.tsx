import React from "react";
interface Props { onContinueShopping: () => void; onViewOrderHistory: () => void; }
export function AccionesPedido({ onContinueShopping, onViewOrderHistory }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-1.5 pb-[1px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] mt-0 flex space-x-3 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:border-0 md:p-0 md:shadow-none md:mt-6">
          <button
            onClick={onContinueShopping}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Seguir Comprando
          </button>
          <button
            type="button"
            id="thankyou-order-history-btn"
            onClick={onViewOrderHistory}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Historial de Pedidos
          </button>
  );
}
