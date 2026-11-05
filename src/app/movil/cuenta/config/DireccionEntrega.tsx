import React from "react";
import { MapPin, Building2, Globe } from "lucide-react";

interface Props {
  direccion: string;
  ciudad: string;
  pais: string;
  codigoPostal: string;
  onDireccionChange: (value: string) => void;
  onCiudadChange: (value: string) => void;
  onPaisChange: (value: string) => void;
  onCodigoPostalChange: (value: string) => void;
}

export default function DireccionEntrega(props: Props) {
  const { direccion, ciudad, pais, codigoPostal, onDireccionChange, onCiudadChange, onPaisChange, onCodigoPostalChange } = props;
  const claseEntrada = "w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors";
  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-500" /><span>Dirección de Entrega (Calle y Número)</span>
        </label>
        <input type="text" value={direccion} onChange={(e) => onDireccionChange(e.target.value)} placeholder="Calle, número, sector o colonia" required className={claseEntrada} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500" /><span>Ciudad</span>
          </label>
          <input type="text" value={ciudad} onChange={(e) => onCiudadChange(e.target.value)} placeholder="Ej. Santo Domingo" required className={claseEntrada} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-500" /><span>País</span>
          </label>
          <input type="text" value={pais} onChange={(e) => onPaisChange(e.target.value)} placeholder="Ej. República Dominicana" required className={claseEntrada} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Código Postal</label>
        <input type="text" value={codigoPostal} onChange={(e) => onCodigoPostalChange(e.target.value)} placeholder="Código postal" className={claseEntrada} />
      </div>
    </>
  );
}
