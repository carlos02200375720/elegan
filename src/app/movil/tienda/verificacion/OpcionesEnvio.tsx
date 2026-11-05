import React from "react";
import { Truck } from "lucide-react";
import { formatPrice } from "../../../../utils/currency";

export interface OpcionesEnvioProps {
  cartShippingTotal: number;
  selectedCarrier?: string;
}

export const OpcionesEnvio: React.FC<OpcionesEnvioProps> = ({
  cartShippingTotal,
  selectedCarrier,
}) => {
  return (
    <div
      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
      id="android-checkout-shipping-summary"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {selectedCarrier || "Envío Estándar"}
          </span>
          <span className="text-[10px] text-slate-500">
            {cartShippingTotal === 0 ? "Entrega gratuita incluida" : "Costo de entrega"}
          </span>
        </div>
      </div>

      <span
        className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
          cartShippingTotal === 0
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-100 text-slate-900 border-slate-200"
        }`}
      >
        {cartShippingTotal === 0 ? "GRATIS" : formatPrice(cartShippingTotal)}
      </span>
    </div>
  );
};

export default OpcionesEnvio;
