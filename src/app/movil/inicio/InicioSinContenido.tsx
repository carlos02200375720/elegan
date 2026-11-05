import React from "react";
import { Video, RefreshCw } from "lucide-react";

interface InicioSinContenidoProps {
  onRefreshReels?: () => void;
}

export default function InicioSinContenido({ onRefreshReels }: InicioSinContenidoProps) {
  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center text-slate-800 p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-amber-500">
        <Video className="w-8 h-8" />
      </div>
      <p className="text-base font-bold text-slate-800">No hay publicaciones disponibles</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">
        Aún no se han publicado reels o videos en la aplicación.
      </p>
      {onRefreshReels && (
        <button
          type="button"
          onClick={onRefreshReels}
          className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-transform shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      )}
    </div>
  );
}
