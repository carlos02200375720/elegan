import { Bookmark, Play } from "lucide-react";
import { Reel } from "../../../../types";
import AndroidPublicationCover from "../../../componente/miniaturapublicacion";

interface TarjetaPublicacionGuardadaProps {
  reel: Reel;
  onSelect?: (reel: Reel) => void;
  onUnsave?: (id: string) => void;
}

export default function TarjetaPublicacionGuardada({
  reel,
  onSelect,
  onUnsave,
}: TarjetaPublicacionGuardadaProps) {
  return (
    <div
      id={`android-saved-reel-card-${reel.id}`}
      onClick={() => onSelect?.(reel)}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 cursor-pointer active:scale-[0.98] transition-transform group shadow-xs hover:border-amber-400"
    >
      <AndroidPublicationCover reel={reel} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-between p-2 pointer-events-none">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1 shadow-xs">
            <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
            <span>@{reel.creatorUsername || reel.creatorName || "creador"}</span>
          </span>
          {onUnsave && (
            <button
              type="button"
              id={`android-unsave-reel-${reel.id}`}
              onClick={(event) => {
                event.stopPropagation();
                onUnsave(reel.id);
              }}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-amber-400 hover:bg-black/80 active:scale-90 transition-transform cursor-pointer"
              title="Quitar de guardados"
              aria-label="Quitar de guardados"
            >
              <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </button>
          )}
        </div>
        <div className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
          {reel.description || reel.title || "Publicación"}
        </div>
      </div>
    </div>
  );
}
