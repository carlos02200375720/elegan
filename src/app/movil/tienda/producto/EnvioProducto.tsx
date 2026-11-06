import React from "react";
import { formatPrice } from "../../utilidades/moneda";
import { ShippingOptionItem } from "./TiposProducto";

export interface EnvioProductoProps {
  shippingOptions: ShippingOptionItem[];
  selectedShippingOption: ShippingOptionItem | null;
  onSelectShippingOption: (option: ShippingOptionItem) => void;
}

export const EnvioProducto: React.FC<EnvioProductoProps> = ({
  shippingOptions,
  selectedShippingOption,
  onSelectShippingOption,
}) => {
  return (
    <div className="space-y-1.5 text-left" id="android-product-shipping-options-group">
      <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-bold">
        <span className="text-slate-600">Envío:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {shippingOptions.map((option, sIdx) => {
          const isSelected =
            selectedShippingOption?.carrier === option.carrier &&
            selectedShippingOption?.shippingCost === option.shippingCost;
          return (
            <button
              key={sIdx}
              type="button"
              onClick={() => onSelectShippingOption(option)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-wrap items-center gap-1.5 ${
                isSelected
                  ? "bg-slate-950 text-white border-black shadow-sm ring-2 ring-black"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <span>{option.carrier}:</span>
              <span
                className={`font-mono ${
                  isSelected ? "text-emerald-400 font-extrabold" : "text-emerald-700"
                }`}
              >
                {option.shippingCost === 0
                  ? "GRATIS ($0.00 USD)"
                  : formatPrice(option.shippingCost)}
              </span>
              {option.aging && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-slate-800 text-slate-200"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  ⏱ {option.aging}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnvioProducto;
