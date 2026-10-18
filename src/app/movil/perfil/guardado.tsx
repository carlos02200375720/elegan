import React, { useState, useMemo } from "react";
import { Bookmark, Play, ShoppingBag } from "lucide-react";
import { Product, Reel } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import AndroidPublicationCover from "../components/miniaturapublicacion";

export interface GuardadoPerfilProps {
  savedProducts?: Product[];
  savedReels?: Reel[];
  products?: Product[];
  reels?: Reel[];
  savedReelIds?: string[];
  onSelectProduct?: (product: Product) => void;
  onSelectReel?: (reel: Reel | string) => void;
  onToggleSaveReel?: (id: string) => void;
  onOpenFeed?: (reelId: string) => void;
}

export function GuardadoPerfilView({
  savedProducts: propSavedProducts,
  savedReels: propSavedReels,
  products = [],
  reels = [],
  savedReelIds = [],
  onSelectProduct,
  onSelectReel,
  onToggleSaveReel,
  onOpenFeed,
}: GuardadoPerfilProps) {
  const [savedSubTab, setSavedSubTab] = useState<"all" | "products" | "reels">("all");

  const resolvedSavedReels = useMemo(() => {
    if (propSavedReels) return propSavedReels;
    const result: Reel[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    reels.forEach((r) => {
      if (!r || !r.id || !savedReelIds.includes(r.id) || seenIds.has(r.id)) return;
      const url = (r.videoUrl || r.hlsUrl || "").split("?")[0].trim().toLowerCase();
      if (url && seenUrls.has(url)) return;

      seenIds.add(r.id);
      if (url) seenUrls.add(url);
      result.push(r);
    });
    return result;
  }, [propSavedReels, reels, savedReelIds]);

  const resolvedSavedProducts = useMemo(() => {
    if (propSavedProducts) return propSavedProducts;
    const seen = new Set<string>();
    return products.filter((p) => {
      if (savedReelIds.includes(p.id) && !seen.has(p.id)) {
        seen.add(p.id);
        return true;
      }
      return false;
    });
  }, [propSavedProducts, products, savedReelIds]);

  const totalSavedCount = resolvedSavedReels.length + resolvedSavedProducts.length;

  // Interleaved items for the unified "Todos" view in saved section
  const unifiedSavedItems = useMemo(() => {
    type UnifiedItem =
      | { kind: "product"; data: Product; id: string }
      | { kind: "reel"; data: Reel; id: string };

    const pList = [...resolvedSavedProducts];
    const rList = [...resolvedSavedReels];
    const items: UnifiedItem[] = [];
    const maxLen = Math.max(pList.length, rList.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < rList.length) {
        items.push({ kind: "reel", data: rList[i], id: rList[i].id });
      }
      if (i < pList.length) {
        items.push({ kind: "product", data: pList[i], id: pList[i].id });
      }
    }
    return items;
  }, [resolvedSavedProducts, resolvedSavedReels]);

  const handleReelClick = (reel: Reel) => {
    if (onSelectReel) onSelectReel(reel);
    if (onOpenFeed) onOpenFeed(reel.id);
  };

  return (
    <div className="space-y-3" id="android-profile-saved-section">
      {/* Filter Tabs - Organizados de forma horizontal */}
      <div className="flex flex-row items-center gap-2 pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          type="button"
          id="android-saved-filter-all"
          onClick={() => setSavedSubTab("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            savedSubTab === "all"
              ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-500/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Todos ({totalSavedCount})</span>
        </button>
        <button
          type="button"
          id="android-saved-filter-reels"
          onClick={() => setSavedSubTab("reels")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            savedSubTab === "reels"
              ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-500/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Publicaciones ({resolvedSavedReels.length})</span>
        </button>
        <button
          type="button"
          id="android-saved-filter-products"
          onClick={() => setSavedSubTab("products")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            savedSubTab === "products"
              ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-500/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Productos ({resolvedSavedProducts.length})</span>
        </button>
      </div>

      {totalSavedCount === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700">No tienes publicaciones ni productos guardados</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs text-center">
            Guarda productos en la tienda o publicaciones tocando el icono de guardado para encontrarlos aquí fácilmente.
          </p>
        </div>
      ) : (
        <div>
          {/* 1. Vista Unificada "Todos": Muestra todas las publicaciones, tanto productos como videos, organizadas juntas */}
          {savedSubTab === "all" && (
            <div className="grid grid-cols-2 gap-2.5">
              {unifiedSavedItems.map((item, index) => {
                if (item.kind === "product") {
                  const p = item.data;
                  return (
                    <div
                      key={`saved-unified-p-${p.id}-${index}`}
                      id={`android-saved-product-card-${p.id}`}
                      onClick={() => onSelectProduct?.(p)}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-xs hover:border-amber-300 relative aspect-[3/4]"
                    >
                      <div className="relative flex-1 w-full overflow-hidden bg-slate-100 min-h-0">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Producto</span>
                        </span>
                        {onToggleSaveReel && (
                          <button
                            type="button"
                            id={`android-unsave-prod-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSaveReel(p.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-amber-400 hover:bg-black/80 active:scale-90 transition-transform cursor-pointer"
                            title="Quitar de guardados"
                            aria-label="Quitar de guardados"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </button>
                        )}
                      </div>
                      <div className="p-2 shrink-0 bg-white border-t border-slate-100 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                          <span className="text-xs font-black text-amber-600">{formatPrice(p.price)}</span>
                          {p.freeShipping && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <span>Envío Gratis</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                const reel = item.data;
                return (
                  <div
                    key={`saved-unified-r-${reel.id}-${index}`}
                    id={`android-saved-reel-card-${reel.id}`}
                    onClick={() => handleReelClick(reel)}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 cursor-pointer active:scale-[0.98] transition-transform group shadow-xs hover:border-amber-400"
                  >
                    <AndroidPublicationCover reel={reel} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-between p-2 pointer-events-none">
                      <div className="flex items-center justify-between w-full pointer-events-auto">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1 shadow-xs">
                          <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                          <span>@{reel.creatorUsername || reel.creatorName || "creador"}</span>
                        </span>
                        {onToggleSaveReel && (
                          <button
                            type="button"
                            id={`android-unsave-reel-${reel.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSaveReel(reel.id);
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
              })}
            </div>
          )}

          {/* 2. Filtro Publicaciones */}
          {savedSubTab === "reels" && (
            <div>
              {resolvedSavedReels.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No tienes publicaciones guardadas en tu perfil.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {resolvedSavedReels.map((reel, rIdx) => (
                    <div
                      key={`reel-tab-${reel.id}-${rIdx}`}
                      id={`android-saved-reel-card-${reel.id}`}
                      onClick={() => handleReelClick(reel)}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 cursor-pointer active:scale-[0.98] transition-transform group shadow-xs hover:border-amber-400"
                    >
                      <AndroidPublicationCover reel={reel} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-between p-2 pointer-events-none">
                        <div className="flex items-center justify-between w-full pointer-events-auto">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1 shadow-xs">
                            <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                            <span>@{reel.creatorUsername || reel.creatorName || "creador"}</span>
                          </span>
                          {onToggleSaveReel && (
                            <button
                              type="button"
                              id={`android-unsave-reel-${reel.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSaveReel(reel.id);
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Filtro Productos */}
          {savedSubTab === "products" && (
            <div>
              {resolvedSavedProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No tienes productos guardados en tu perfil.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {resolvedSavedProducts.map((p, pIdx) => (
                    <div
                      key={`prod-tab-${p.id}-${pIdx}`}
                      id={`android-saved-product-card-${p.id}`}
                      onClick={() => onSelectProduct?.(p)}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-xs hover:border-amber-300 relative aspect-[3/4]"
                    >
                      <div className="relative flex-1 w-full overflow-hidden bg-slate-100 min-h-0">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-1">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>{p.category || "Producto"}</span>
                        </span>
                        {onToggleSaveReel && (
                          <button
                            type="button"
                            id={`android-unsave-prod-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSaveReel(p.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-amber-400 hover:bg-black/80 active:scale-90 transition-transform cursor-pointer"
                            title="Quitar de guardados"
                            aria-label="Quitar de guardados"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </button>
                        )}
                      </div>
                      <div className="p-2 shrink-0 bg-white border-t border-slate-100 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between mt-1 gap-1 flex-wrap">
                          <span className="text-xs font-black text-amber-600">{formatPrice(p.price)}</span>
                          {p.freeShipping && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <span>Envío Gratis</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { GuardadoPerfilView as Guardado };
export default GuardadoPerfilView;
