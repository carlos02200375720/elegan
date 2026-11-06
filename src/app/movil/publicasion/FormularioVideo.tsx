import React from "react";
import { Video } from "lucide-react";
import { formatPrice } from "../../utilidades/moneda";
import AndroidVideoUploadPreview from "../componente/vistapreviavideo";
import type { VideoFormProps } from "./TiposPublicasion";
export default function FormularioVideo({ video, setVideo, videoInputRef, aspect, selectVideo, title, setTitle, description, setDescription, productId, setProductId, userProducts }: VideoFormProps) {
  return (
              <div className="space-y-4">
                {/* Video selector / preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Archivo de Video <span className="text-amber-500">*</span>
                  </label>
                  {video ? (
                    <div className="space-y-2">
                      <AndroidVideoUploadPreview
                        file={video}
                        onRemove={() => {
                          setVideo(null);
                          if (videoInputRef.current) videoInputRef.current.value = "";
                        }}
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                        <span>Aspecto detectado: <b className="text-white capitalize">{aspect}</b></span>
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                        >
                          Cambiar video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-slate-700/90 hover:border-amber-500/80 bg-slate-900/50 hover:bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                        <Video className="w-6 h-6 text-slate-400 group-hover:text-amber-400" />
                      </div>
                      <span className="text-sm font-semibold text-white mb-1">Toca para seleccionar video</span>
                      <span className="text-[11px] text-slate-400">MP4, WebM o MOV (hasta 100MB)</span>
                    </button>
                  )}
                  <input
                    ref={videoInputRef}
                    hidden
                    type="file"
                    accept="video/*"
                    onChange={selectVideo}
                  />
                </div>
    
                {/* Video Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Título del Reel <span className="text-amber-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Escribe un título llamativo..."
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    maxLength={100}
                  />
                </div>
    
                {/* Video Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descripción y hashtags (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escribe detalles del video, hashtags (#moda, #tendencia)..."
                    rows={3}
                    className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>
    
                {/* Tagged Product (if creator has products) */}
                {userProducts.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Etiquetar producto en el video (opcional)
                    </label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">Sin producto etiquetado</option>
                      {userProducts.map((p, pIdx) => (
                        <option key={`${p.id}-${pIdx}`} value={p.id}>
                          {p.name} ({formatPrice(p.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
  );
}
