import { Bookmark, ShoppingBag } from "lucide-react";
import { Product } from "../../../../types";
import { formatPrice } from "../../utilidades/moneda";

interface TarjetaProductoGuardadoProps {
  product: Product;
  categoryLabel?: string;
  onSelect?: (product: Product) => void;
  onUnsave?: (id: string) => void;
}

export default function TarjetaProductoGuardado({
  product,
  categoryLabel = "Producto",
  onSelect,
  onUnsave,
}: TarjetaProductoGuardadoProps) {
  return (
    <div
      id={`android-saved-product-card-${product.id}`}
      onClick={() => onSelect?.(product)}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-xs hover:border-amber-300 relative aspect-[3/4]"
    >
      <div className="relative flex-1 w-full overflow-hidden bg-slate-100 min-h-0">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-1">
          <ShoppingBag className="w-2.5 h-2.5" />
          <span>{categoryLabel}</span>
        </span>
        {onUnsave && (
          <button
            type="button"
            id={`android-unsave-prod-${product.id}`}
            onClick={(event) => {
              event.stopPropagation();
              onUnsave(product.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-amber-400 hover:bg-black/80 active:scale-90 transition-transform cursor-pointer"
            title="Quitar de guardados"
            aria-label="Quitar de guardados"
          >
            <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </button>
        )}
      </div>
      <div className="p-2 shrink-0 bg-white border-t border-slate-100 flex flex-col justify-between">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h4>
        <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
          <span className="text-xs font-black text-amber-600">{formatPrice(product.price)}</span>
          {product.freeShipping && (
            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
              <span>Envío Gratis</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
