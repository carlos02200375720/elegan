import React from "react";
import { Sparkles } from "lucide-react";

export const EncabezadoConfirmacion: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center mt-4" id="android-thank-you-header">
      {/* Icono de éxito */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-amber-300 bg-amber-50 flex items-center justify-center shadow-lg shadow-amber-100">
          <Sparkles className="w-10 h-10 text-amber-500" />
        </div>
      </div>

      {/* Título y mensaje de agradecimiento */}
      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.3em] text-amber-600 font-black">
          Compra confirmada
        </div>
        <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
          ¡Gracias por tu compra!
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">
          Tu pedido fue recibido con éxito y está siendo preparado.
        </p>
      </div>
    </div>
  );
};

export default EncabezadoConfirmacion;
