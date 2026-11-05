import React, { useRef } from "react";
import { Camera, Image as ImagenIcon } from "lucide-react";

interface Props {
  avatar: string;
  correo?: string;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (value: string) => void;
  onMessage: (message: { type: "success" | "error"; text: string } | null) => void;
}

const AVATAR_PREDETERMINADO = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

export default function FotoPerfil({ avatar, correo, onSelect }: Props) {
  const entradaArchivo = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col items-center">
      <input ref={entradaArchivo} type="file" accept="image/*" className="hidden" onChange={onSelect} />
      <div
        onClick={() => entradaArchivo.current?.click()}
        className="relative mb-2 cursor-pointer group active:scale-95 transition-transform"
        title="Toca para cambiar foto desde la galería"
      >
        <img
          src={avatar || AVATAR_PREDETERMINADO}
          alt="Vista previa de foto de perfil"
          className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-md bg-white group-hover:opacity-90"
          onError={(event) => { event.currentTarget.src = AVATAR_PREDETERMINADO; }}
        />
        <span className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 text-slate-950 shadow-md group-hover:bg-amber-400 transition-colors">
          <Camera className="w-4 h-4" />
        </span>
      </div>
      <button
        type="button"
        onClick={() => entradaArchivo.current?.click()}
        className="mt-1 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
      >
        <ImagenIcon className="w-4 h-4 text-amber-600" />
        <span>Elegir foto de la galería</span>
      </button>
      {correo && <p className="text-[11px] text-slate-400 mt-1 font-medium">{correo}</p>}
    </div>
  );
}
