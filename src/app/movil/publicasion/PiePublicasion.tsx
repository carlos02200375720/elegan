import React from "react";
import { Loader2, ShoppingBag, Upload } from "lucide-react";
import type { PublishType } from "./TiposPublicasion";
interface Props { type: PublishType; loading: boolean; publishVideo: () => void; publishProduct: () => void; }
export default function PiePublicasion({ type, loading, publishVideo, publishProduct }: Props) {
  return (
          {/* 3. Footer (Fixed at the bottom of the page) */}
          <footer
            className="flex-shrink-0 bg-slate-950/95 border-t border-slate-800/80 px-4 pt-3 pb-4 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-20"
            style={{
              paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))",
            }}
          >
            <button
              type="button"
              onClick={type === "video" ? () => publishVideo() : () => publishProduct()}
              disabled={loading}
              id="android-publish-submit-button"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : type === "video" ? (
                <>
                  <Upload className="w-5 h-5 stroke-[2.5]" />
                  <span>Publicar video</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  <span>Publicar producto</span>
                </>
              )}
            </button>
          </footer>
  );
}
