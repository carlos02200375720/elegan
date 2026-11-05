import React from "react";
import { User as IconoUsuario, Mail, Phone } from "lucide-react";

interface Props {
  nombre: string;
  correo: string;
  telefono: string;
  onNombreChange: (value: string) => void;
  onCorreoChange: (value: string) => void;
  onTelefonoChange: (value: string) => void;
}

export default function DatosPersonales(props: Props) {
  const { nombre, correo, telefono, onNombreChange, onCorreoChange, onTelefonoChange } = props;
  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <IconoUsuario className="w-3.5 h-3.5 text-amber-500" /><span>Nombre Completo</span>
        </label>
        <input type="text" value={nombre} onChange={(e) => onNombreChange(e.target.value)} placeholder="Ej. Juan Pérez" required className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-amber-500" /><span>Correo Electrónico</span>
        </label>
        <input type="email" value={correo} onChange={(e) => onCorreoChange(e.target.value)} placeholder="correo@ejemplo.com" required className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors" />
        <span className="text-[10px] text-slate-400 mt-0.5 block">Se usará para enviar confirmaciones, recuperar tu cuenta e iniciar sesión en otros celulares.</span>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-amber-500" /><span>Número de Celular / Teléfono</span>
        </label>
        <input type="tel" value={telefono} onChange={(e) => onTelefonoChange(e.target.value)} placeholder="+1 809 000 0000" className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors" />
      </div>
    </>
  );
}
