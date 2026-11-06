import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";

type Props = any;
export default function VideosMetrica(props: Props) {
 const { activeSection, totalReelViews, totalReelLikes, totalReelComments, totalReelSaves, topReels, onReelClick } = props;
 return (
  <>
      {/* Section: Rendimiento de Reels */}
      {(activeSection === "all" || activeSection === "reels") && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Video className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-black text-slate-900">
                Reels con Mayor Alcance e Interacción
              </h3>
            </div>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {totalReelViews} vistas
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {totalReelLikes} likes
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                {totalReelComments} comentarios
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                {totalReelSaves} guardados
              </span>
            </div>
          </div>

          {topReels.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No hay reels publicados actualmente.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topReels.map((reel, idx) => (
                <div
                  key={`${reel.id}-${idx}`}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 font-mono font-black text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {reel.creatorName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        {reel.type || "video"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-1">
                      {reel.title || reel.description || "Publicación sin título"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono text-slate-600">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center gap-1" title="Vistas">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <b>{reel.views || 0}</b>
                      </span>
                      <span className="flex items-center gap-1" title="Me gusta">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <b>{reel.likes || 0}</b>
                      </span>
                      <span className="flex items-center gap-1" title="Comentarios">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <b>{Array.isArray(reel.comments) ? reel.comments.length : 0}</b>
                      </span>
                    </div>

                    {onReelClick && (
                      <button
                        type="button"
                        onClick={() => onReelClick(reel.id)}
                        className="text-xs font-sans font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                      >
                        Ver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


  </>
 );
}
