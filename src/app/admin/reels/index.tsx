import React from "react";
import { Search } from "lucide-react";
import TarjetaReel from "./tarjeta_reel";
import ModalEliminacionReel from "./modal_eliminacion";
import { useEstadoReels } from "./estado";
import { ReelsAdminProps } from "./tipos";

export type { ReelsAdminProps } from "./tipos";

export default function ReelsAdminView({
  reels,
  setReels,
  onReelClick,
  onStatusMessage,
  onRequestDeleteReel,
}: ReelsAdminProps) {
  const {
    reelSearch,
    setReelSearch,
    filteredReels,
    localDeletingReel,
    setLocalDeletingReel,
    isDeleting,
    confirmLocalDeleteReel,
  } = useEstadoReels({ reels, setReels, onStatusMessage });

  return (
    <div
      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
      id="admin-tab-content-reels"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Moderación de Reels y Publicaciones
          </h2>
          <p className="text-xs text-slate-500">
            Supervisa vídeos activos, métricas de engagement y elimina contenido infractor.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={reelSearch}
            onChange={(e) => setReelSearch(e.target.value)}
            placeholder="Buscar por título, creador o ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReels.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No hay reels que coincidan con la búsqueda.
          </div>
        ) : (
          filteredReels.map((reel, rIdx) => (
            <TarjetaReel
              key={`${reel.id}-${rIdx}`}
              reel={reel}
              index={rIdx}
              onReelClick={onReelClick}
              onRequestDeleteReel={onRequestDeleteReel}
              onLocalDelete={setLocalDeletingReel}
            />
          ))
        )}
      </div>

      <ModalEliminacionReel
        reel={localDeletingReel}
        isDeleting={isDeleting}
        onCancel={() => setLocalDeletingReel(null)}
        onConfirm={confirmLocalDeleteReel}
      />
    </div>
  );
}
