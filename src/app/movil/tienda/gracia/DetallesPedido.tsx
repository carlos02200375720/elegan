import React from "react";

export interface DetallesPedidoProps {
  itemsCount: number;
  orderNumber?: string;
  orderDate?: string;
}

export const DetallesPedido: React.FC<DetallesPedidoProps> = ({
  itemsCount,
  orderNumber,
  orderDate,
}) => {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80" id="android-thank-you-order-details">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-700">
          Resumen de productos
        </span>
        {orderNumber && (
          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
            #{orderNumber}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {orderDate && (
          <span className="text-[10px] text-slate-400">
            {orderDate}
          </span>
        )}
        <span className="text-[11px] font-bold text-slate-500">
          {itemsCount} {itemsCount === 1 ? "artículo" : "artículos"}
        </span>
      </div>
    </div>
  );
};

export default DetallesPedido;
