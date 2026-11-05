import React from "react";
import { MapPin } from "lucide-react";
import { AndroidCheckoutForm } from "./TiposVerificacion";
import { DatosComprador } from "./DatosComprador";

export interface DireccionEntregaProps {
  checkoutForm: AndroidCheckoutForm;
  setCheckoutForm: React.Dispatch<React.SetStateAction<AndroidCheckoutForm>>;
}

export const DireccionEntrega: React.FC<DireccionEntregaProps> = ({
  checkoutForm,
  setCheckoutForm,
}) => {
  return (
    <div className="w-full bg-white rounded-none shadow-none p-4" id="android-checkout-delivery-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Datos de entrega
        </span>
        <MapPin className="w-4 h-4 text-amber-500" />
      </div>

      <div className="mt-3.5 space-y-3">
        {/* Información personal del comprador */}
        <DatosComprador
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
        />

        {/* Dirección de entrega */}
        <div>
          <label className="text-[11px] font-black text-slate-700">Dirección de entrega *</label>
          <input
            value={checkoutForm.shippingAddress}
            onChange={(e) =>
              setCheckoutForm((prev) => ({ ...prev, shippingAddress: e.target.value }))
            }
            className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            placeholder="Calle, número, sector o edificio"
          />
        </div>

        {/* Ciudad y País */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-700">Ciudad *</label>
            <input
              value={checkoutForm.city || ""}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Santo Domingo"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-700">País *</label>
            <input
              value={checkoutForm.country}
              onChange={(e) =>
                setCheckoutForm((prev) => ({ ...prev, country: e.target.value }))
              }
              className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="República Dominicana"
            />
          </div>
        </div>

        {/* Código postal */}
        <div>
          <label className="text-[11px] font-black text-slate-700">Código postal *</label>
          <input
            value={checkoutForm.postalCode}
            onChange={(e) =>
              setCheckoutForm((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            placeholder="10101"
          />
        </div>
      </div>
    </div>
  );
};

export default DireccionEntrega;
