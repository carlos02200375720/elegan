import React from "react";
import { ShoppingBag } from "lucide-react";

export interface CarritoVacioProps {
  onExploreProducts: () => void;
}

export const CarritoVacio: React.FC<CarritoVacioProps> = ({ onExploreProducts }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center" id="android-cart-empty-view">
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
        <ShoppingBag className="w-10 h-10 text-amber-500" />
      </div>
      <h3 className="mt-4 text-sm font-black text-slate-900">Tu carrito está vacío</h3>
      <p className="text-[11px] text-slate-500 mt-1">Añade productos para empezar tu compra.</p>
      <button
        type="button"
        onClick={onExploreProducts}
        className="mt-5 px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-md hover:bg-amber-400 active:scale-95 transition-all"
        id="android-cart-empty-explore-btn"
      >
        Explorar productos
      </button>
    </div>
  );
};

export default CarritoVacio;
