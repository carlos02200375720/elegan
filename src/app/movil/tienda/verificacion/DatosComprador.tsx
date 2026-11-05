import React from "react";
import { AndroidCheckoutForm } from "./TiposVerificacion";

export interface DatosCompradorProps {
  checkoutForm: AndroidCheckoutForm;
  setCheckoutForm: React.Dispatch<React.SetStateAction<AndroidCheckoutForm>>;
}

export const DatosComprador: React.FC<DatosCompradorProps> = ({
  checkoutForm,
  setCheckoutForm,
}) => {
  return (
    <div className="space-y-3" id="android-checkout-buyer-info">
      <div>
        <label className="text-[11px] font-black text-slate-700">Nombre completo *</label>
        <input
          value={checkoutForm.fullName}
          onChange={(e) => setCheckoutForm((prev) => ({ ...prev, fullName: e.target.value }))}
          className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          placeholder="Ej. Juan Pérez"
        />
      </div>

      <div>
        <label className="text-[11px] font-black text-slate-700">Correo electrónico *</label>
        <input
          value={checkoutForm.email}
          onChange={(e) => setCheckoutForm((prev) => ({ ...prev, email: e.target.value }))}
          className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          placeholder="correo@ejemplo.com"
          type="email"
        />
      </div>

      <div>
        <label className="text-[11px] font-black text-slate-700">Teléfono / WhatsApp *</label>
        <input
          value={checkoutForm.phone}
          onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
          className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          placeholder="809-000-0000"
        />
      </div>
    </div>
  );
};

export default DatosComprador;
