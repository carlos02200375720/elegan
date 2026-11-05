import React from "react";

export default function InicioCargando() {
  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center text-slate-800 p-6 text-center">
      <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-800">Sincronizando Reels...</p>
      <p className="text-xs text-slate-500 mt-1">Conectando con la base de datos de videos</p>
    </div>
  );
}
