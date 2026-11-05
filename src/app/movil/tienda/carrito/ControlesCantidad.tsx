import React from "react";
import { Minus, Plus } from "lucide-react";
import { CartItem } from "../../../../types";
import { getAvailableCartStock } from "./FuncionesCarrito";

export interface ControlesCantidadProps {
  idx: number;
  item: CartItem;
  handleItemQtyChange: (idx: number, item: CartItem, newQty: number) => void;
}

export const ControlesCantidad: React.FC<ControlesCantidadProps> = ({
  idx,
  item,
  handleItemQtyChange,
}) => {
  const currentQty = item.quantity || 1;
  const stock = getAvailableCartStock(item.product);
  const isMaxReached = stock !== undefined && currentQty >= stock;

  return (
    <div className="flex items-center space-x-1.5" id={`android-cart-qty-controls-${idx}`}>
      <button
        type="button"
        onClick={() => handleItemQtyChange(idx, item, Math.max(1, currentQty - 1))}
        className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
        aria-label="Disminuir cantidad"
      >
        <Minus className="w-3 h-3" />
      </button>

      <span className="text-xs font-mono font-extrabold text-slate-900 px-1">
        {currentQty}
      </span>

      <button
        type="button"
        onClick={() => handleItemQtyChange(idx, item, currentQty + 1)}
        disabled={isMaxReached}
        className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs disabled:opacity-50 transition-colors cursor-pointer"
        aria-label="Aumentar cantidad"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};

export default ControlesCantidad;
