import React from "react";
import { ArrowLeft, ShoppingBag, Video } from "lucide-react";
import type { PublishType } from "./TiposPublicasion";
interface Props { onBack: () => void; type: PublishType; setType: (type: PublishType) => void; setError: (error: string | null) => void; }
export default function EncabezadoPublicasion({ onBack, type, setType, setError }: Props) {
  return (
          {/* 1. Header (Fixed at top) */}
          <header
            className="flex-shrink-0 bg-slate-950/95 border-b border-slate-850 px-4 py-3 backdrop-blur-md z-10"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Volver</span>
              </button>
              <h1 className="text-base font-bold text-white tracking-wide">Publicar</h1>
              <div className="w-16" /> {/* Spacer to keep title centered */}
            </div>
    
            {/* Type Switcher Tabs */}
            <div className="flex gap-2 mt-3 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80">
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === "video"
                    ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() => {
                  setType("video");
                  setError(null);
                }}
              >
                <Video className="w-4 h-4" />
                <span>Video Reel</span>
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === "product"
                    ? "bg-amber-500 text-slate-950 shadow-md scale-[1.01]"
                    : "text-slate-400 hover:text-white"
                }`}
                onClick={() => {
                  setType("product");
                  setError(null);
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Producto</span>
              </button>
            </div>
          </header>
  );
}
