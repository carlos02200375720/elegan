import React from "react";
import { Eye, Heart, Trash2 } from "lucide-react";
import { Reel } from "../../../types";
import { ReelEliminar } from "./tipos";

interface Props {
  reel: Reel;
  index: number;
  onReelClick: (reelId: string) => void;
  onRequestDeleteReel?: (target: { type: "reel"; id: string; name: string }) => void;
  onLocalDelete: (reel: ReelEliminar) => void;
}

export default function TarjetaReel({
  reel,
  index,
  onReelClick,
  onRequestDeleteReel,
  onLocalDelete,
}: Props) {
  const nombre = reel.title || reel.id;

  return (
    <div
      key={`${reel.id}-${index}`}
      className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60 hover:border-slate-300 transition-all flex flex-col justify-between"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <img
            src={reel.creatorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
            alt={reel.creatorName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{reel.creatorName}</p>
            <p className="text-[10px] font-mono text-slate-400 truncate">
              @{reel.creatorUsername || "creator"}
            </p>
          </div>
          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase">
            {reel.type || "video"}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{reel.title || "Sin título"}</h4>
          {reel.description && (
            <p className="text-[11px] text-slate-500 line-clamp-2">{reel.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200/60">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{reel.views || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>{reel.likes || 0}</span>
          </span>
          <span className="text-slate-400 text-[10px] truncate">ID: {reel.id}</span>
        </div>
      </div>

      <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={() => onReelClick(reel.id)}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver Reel</span>
        </button>
        <button
          onClick={() => {
            if (onRequestDeleteReel) {
              onRequestDeleteReel({ type: "reel", id: reel.id, name: nombre });
            } else {
              onLocalDelete({ id: reel.id, name: nombre });
            }
          }}
          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
          title="Eliminar publicación"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
