import React from "react";
import { Check, Trash2 } from "lucide-react";
import { Product, CartItem } from "../../../../types";
import { formatPrice } from "../../../../utils/currency";
import { getProductImageUrl } from "../productMedia";
import { calculateItemShippingFee } from "./FuncionesCarrito";
import { ControlesCantidad } from "./ControlesCantidad";

export interface TarjetaProductoCarritoProps {
  idx: number;
  item: CartItem;
  isSelected: boolean;
  toggleSelectCartItem: (idx: number) => void;
  handleItemRemove: (idx: number, item: CartItem) => void;
  handleItemQtyChange: (idx: number, item: CartItem, newQty: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const TarjetaProductoCarrito: React.FC<TarjetaProductoCarritoProps> = ({
  idx,
  item,
  isSelected,
  toggleSelectCartItem,
  handleItemRemove,
  handleItemQtyChange,
  onSelectProduct,
}) => {
  const { fee: shippingFee, carrier: carrierName } = calculateItemShippingFee(item);

  return (
    <div
      className={`flex items-stretch rounded-2xl border transition-all shadow-sm overflow-hidden h-28 shrink-0 relative ${
        isSelected
          ? "bg-amber-500/[0.04] border-amber-400/80 shadow-amber-500/10 ring-1 ring-amber-400/40"
          : "bg-slate-50/70 border-slate-200 opacity-70 hover:opacity-100"
      }`}
      id={`android-cart-item-${item.product.id}-${idx}`}
    >
      {/* Product Image Thumbnail */}
      <div className="w-24 sm:w-28 shrink-0 relative bg-slate-200 h-full overflow-hidden">
        <img
          src={getProductImageUrl(item.product)}
          alt={item.product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={() => onSelectProduct(item.product)}
        />
      </div>

      {/* Product Info & Controls */}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4
              className="text-xs font-extrabold text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
              title={item.product.name}
              onClick={() => onSelectProduct(item.product)}
            >
              {item.product.name}
            </h4>
            <button
              type="button"
              onClick={() => handleItemRemove(idx, item)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
              title="Eliminar producto"
              aria-label="Eliminar producto del carrito"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-xs font-mono font-extrabold text-amber-600">
              {formatPrice(item.product.price)}
            </span>
            <span className="text-[9px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded leading-tight">
              Envío: {shippingFee > 0 ? formatPrice(shippingFee) : "Gratis"}
              {carrierName ? ` (${carrierName})` : ""}
            </span>
          </div>
        </div>

        {/* Incrementor buttons & Selection in bottom-right */}
        <div className="flex items-center justify-between">
          <ControlesCantidad
            idx={idx}
            item={item}
            handleItemQtyChange={handleItemQtyChange}
          />

          {/* Selector in bottom-right corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelectCartItem(idx);
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isSelected
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105"
                : "bg-white border-slate-300 hover:border-amber-400 text-transparent hover:text-slate-300"
            }`}
            title={isSelected ? "Deseleccionar producto para pago" : "Seleccionar producto para pagar"}
            aria-label={isSelected ? "Deseleccionar producto" : "Seleccionar producto"}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TarjetaProductoCarrito;
