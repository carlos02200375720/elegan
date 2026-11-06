import React from "react";
import { formatPrice } from "../../utilidades/moneda";

export interface InformacionProductoProps {
  name: string;
  price: number;
  availableStock: number;
}

export const InformacionProducto: React.FC<InformacionProductoProps> = ({
  name,
  price,
  availableStock,
}) => {
  return (
    <>
      {/* Product Title */}
      <h1 className="font-display font-extrabold text-[11px] text-slate-900 leading-snug">
        {name}
      </h1>

      {/* Price Section */}
      <div className="flex items-center justify-between gap-2 bg-slate-50/80 px-2.5 py-2 rounded-xl border border-slate-100 flex-nowrap">
        <span
          className="text-lg sm:text-xl font-black font-mono text-slate-950 tracking-tight shrink-0"
          id="android-product-detail-price"
        >
          {formatPrice(price)}
        </span>
        <span
          id="android-product-stock-badge"
          className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border transition-colors shrink-0 whitespace-nowrap ${
            availableStock > 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              : "bg-rose-50 text-rose-700 border-rose-200/80"
          }`}
        >
          {availableStock > 0 ? `En Stock: ${availableStock}` : "Agotado"}
        </span>
      </div>
    </>
  );
};

export interface DescripcionProductoProps {
  description?: string;
}

export const DescripcionProducto: React.FC<DescripcionProductoProps> = ({
  description,
}) => {
  if (!description) return null;
  return (
    <div
      className="border-t border-slate-100 pt-3 text-left"
      id="android-product-description-container"
    >
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </div>
  );
};

export default InformacionProducto;
