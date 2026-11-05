import React from "react";

interface Props {
  guardando: boolean;
}

export default function PieConfiguracion({ guardando }: Props) {
  return (
    <div className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
      <button type="submit" disabled={guardando} className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2">
        {guardando ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Guardando en la base de datos...</span>
          </>
        ) : <span>Guardar y Actualizar Información</span>}
      </button>
    </div>
  );
}
