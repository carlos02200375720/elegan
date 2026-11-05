import React from "react";
import { X, BadgeCheck } from "lucide-react";

interface Props {
  verificado: boolean;
  onClose?: () => void;
}

export default function EncabezadoConfiguracion({ verificado, onClose }: Props) {
  return (
    <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">Configuración de Perfil</span>
        {verificado && (
          <span className="inline-flex items-center justify-center shrink-0" title="Verificado">
            <BadgeCheck className="w-4 h-4 text-white fill-blue-500 shrink-0 drop-shadow-2xs" />
          </span>
        )}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-full active:scale-90">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
