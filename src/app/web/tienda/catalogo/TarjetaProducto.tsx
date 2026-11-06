import React from "react";
import { Bookmark } from "lucide-react";
import { Product, User } from "../../../../types";
import { obtenerVendedor } from "./FuncionesCatalogo";

interface TarjetaProductoProps {
  key?: React.Key;
  product: Product;
  index: number;
  users: User[];
  isSaved: boolean;
  onSelect: (product: Product) => void;
  onToggleSave: (productId: string) => void;
}

export default function TarjetaProducto({
  product,
  index,
  users,
  isSaved,
  onSelect,
  onToggleSave,
}: TarjetaProductoProps) {
  const seller = obtenerVendedor(product.sellerId, users);

  return (
    <div
      className="border border-slate-100 hover:border-amber-500/30 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col bg-white group cursor-pointer justify-between"
      onClick={() => onSelect(product)}
      id={`prod-card-${product.id}`}
    >
      <div className="relative aspect-square w-full bg-white overflow-hidden flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 mb-1">
            <img
              src={
                seller.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
              }
              alt={seller.name}
              referrerPolicy="no-referrer"
              className="w-3.5 h-3.5 rounded-full object-cover"
            />
            <span className="font-bold truncate">
              @{seller.name.toLowerCase().replace(/\s+/g, "")}
            </span>
          </div>

          <h3 className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-500 transition-colors line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-tight">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col items-start gap-0.5">
          <div className="w-full flex items-center justify-between">
            <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(product.id);
              }}
              className="bg-transparent border-0 p-0 shadow-none outline-none flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              id={`card-save-btn-${product.id}`}
              aria-label="Guardar producto"
              title={isSaved ? "Guardado" : "Guardar producto"}
            >
              <Bookmark
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors duration-200 ${
                  isSaved
                    ? "fill-amber-500 text-amber-500"
                    : "text-slate-400 hover:text-amber-500"
                }`}
              />
            </button>
          </div>
          {Boolean(product.freeShipping) && (
            <span className="text-[10px] font-bold bg-transparent text-emerald-700 leading-tight">
              Envío Gratis
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { TarjetaProducto };
