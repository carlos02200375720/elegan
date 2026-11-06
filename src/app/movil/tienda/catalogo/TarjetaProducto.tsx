import React from "react";
import { Bookmark } from "lucide-react";
import { Product } from "../../../../types";
import { formatPrice } from "../../utilidades/moneda";
import { getProductImageUrl } from "../productMedia";

export interface TarjetaProductoProps {
  product: Product;
  isSaved: boolean;
  onSelect: (product: Product) => void;
  onToggleSave?: (productId: string) => void;
}

export const TarjetaProducto: React.FC<TarjetaProductoProps> = ({
  product,
  isSaved,
  onSelect,
  onToggleSave,
}) => {
  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
        <img
          src={getProductImageUrl(product)}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          id={`android-save-product-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(product.id);
          }}
          className="absolute top-2 left-2 z-10 p-1.5 bg-transparent active:scale-90 transition-transform cursor-pointer flex items-center justify-center border-0"
          title={isSaved ? "Guardado en publicaciones" : "Guardar en publicaciones"}
          aria-label={isSaved ? "Quitar de publicaciones guardadas" : "Guardar en publicaciones"}
        >
          <Bookmark
            className={`w-4 h-4 transition-transform duration-200 ${
              isSaved
                ? "fill-amber-500 stroke-amber-500 scale-105"
                : "fill-white text-slate-500 stroke-[2.2]"
            }`}
          />
        </button>
      </div>

      <div className="p-2.5">
        <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h3>
        {product.category && (
          <p className="text-[10px] font-bold text-amber-600 line-clamp-1 mt-0.5">
            {product.category}
          </p>
        )}
        <div className="flex items-center justify-between mt-[3px] gap-1">
          <div className="flex flex-col">
            <span className="text-xs font-black text-black">{formatPrice(product.price)}</span>
            {Boolean(product.freeShipping) && (
              <span className="text-[9px] font-bold text-emerald-700">
                Envío Gratis
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaProducto;
