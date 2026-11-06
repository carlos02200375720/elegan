import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";

type Props = any;
export default function ClientesEmbudo(props: Props) {
 const { funnelApiData, tokenSearchFilter, setTokenSearchFilter, tokenLayerFilter, setTokenLayerFilter } = props;
 return (
  <>
<div className="pt-5 border-t border-slate-100 space-y-4" id="funnel-token-client-tracker">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Monitoreo en Tiempo Real de Clientes por Token</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Identificador persistente único de cada usuario. Permite saber en qué etapa del embudo está el cliente y asegura que su carrito nunca se borre al refrescar la página.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tokenSearchFilter}
                  onChange={(e) => setTokenSearchFilter(e.target.value)}
                  placeholder="Buscar por token o ruta..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter Pills by Funnel Layer */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              <button
                type="button"
                onClick={() => setTokenLayerFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  tokenLayerFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas las Capas ({funnelApiData?.activeClients?.length || 0})
              </button>
              {[
                { layer: 1, label: "Capa 1: Tienda", color: "text-indigo-700 bg-indigo-50" },
                { layer: 2, label: "Capa 2: Producto", color: "text-violet-700 bg-violet-50" },
                { layer: 3, label: "Capa 3: Carrito", color: "text-amber-800 bg-amber-50" },
                { layer: 4, label: "Capa 4: Verificación", color: "text-cyan-800 bg-cyan-50" },
                { layer: 5, label: "Capa 5: Compra", color: "text-emerald-800 bg-emerald-50" },
              ].map((pill) => {
                const count = (funnelApiData?.activeClients || []).filter(
                  (c) => c.stageLayer === pill.layer
                ).length;
                return (
                  <button
                    key={pill.layer}
                    type="button"
                    onClick={() => setTokenLayerFilter(pill.layer)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      tokenLayerFilter === pill.layer
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                        : `${pill.color} border-transparent hover:border-slate-300`
                    }`}
                  >
                    {pill.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Client List or Empty State */}
            {(!funnelApiData?.activeClients || funnelApiData.activeClients.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400 bg-slate-50/50">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Registrando interacciones por token...</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  A medida que los usuarios naveguen por la tienda, verán aquí su token y la etapa exacta del embudo en tiempo real.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Token del Cliente</th>
                      <th className="py-2.5 px-3">Etapa Actual del Embudo</th>
                      <th className="py-2.5 px-3">Estado del Carrito</th>
                      <th className="py-2.5 px-3">Última Ruta Visitada</th>
                      <th className="py-2.5 px-3 text-right">Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(funnelApiData.activeClients || [])
                      .filter((c) => {
                        if (tokenLayerFilter !== "all" && c.stageLayer !== tokenLayerFilter) return false;
                        if (!tokenSearchFilter) return true;
                        const q = tokenSearchFilter.toLowerCase().trim();
                        return (
                          c.token.toLowerCase().includes(q) ||
                          (c.userId && c.userId.toLowerCase().includes(q)) ||
                          (c.stageName && c.stageName.toLowerCase().includes(q)) ||
                          (c.lastPath && c.lastPath.toLowerCase().includes(q))
                        );
                      })
                      .map((client) => {
                        const isRecent = Date.now() - client.lastSeen < 60000;
                        const layerBadgeClass =
                          client.stageLayer === 1
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : client.stageLayer === 2
                            ? "bg-violet-100 text-violet-800 border-violet-200"
                            : client.stageLayer === 3
                            ? "bg-amber-100 text-amber-900 border-amber-300 font-black"
                            : client.stageLayer === 4
                            ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                            : client.stageLayer === 5
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-black"
                            : "bg-slate-100 text-slate-700 border-slate-200";

                        const timeDiff = Math.max(0, Math.floor((Date.now() - client.lastSeen) / 1000));
                        const timeStr =
                          timeDiff < 60
                            ? `Hace ${timeDiff}s`
                            : timeDiff < 3600
                            ? `Hace ${Math.floor(timeDiff / 60)} min`
                            : `Hace ${Math.floor(timeDiff / 3600)} h`;

                        return (
                          <tr key={client.token} className="hover:bg-slate-50 transition-colors">
                            {/* Token */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    isRecent ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                  }`}
                                  title={isRecent ? "Activo ahora" : "Visto recientemente"}
                                />
                                <div className="min-w-0">
                                  <span
                                    className="font-mono text-[11px] font-bold text-slate-800 truncate block max-w-[150px] sm:max-w-[200px]"
                                    title={client.token}
                                  >
                                    {client.token}
                                  </span>
                                  {client.userId && client.userId !== client.token && (
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      Usuario: @{client.userId}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Funnel Stage */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] border ${layerBadgeClass}`}
                              >
                                {client.stageName}
                              </span>
                            </td>

                            {/* Cart Status */}
                            <td className="py-2.5 px-3">
                              {client.cartCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-[11px]">
                                  <ShoppingCart className="w-3 h-3 text-amber-600" />
                                  <span>{client.cartCount} {client.cartCount === 1 ? "producto" : "productos"}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Sin productos</span>
                              )}
                            </td>

                            {/* Last Path */}
                            <td className="py-2.5 px-3">
                              <span
                                className="font-mono text-[11px] text-slate-600 truncate block max-w-[180px]"
                                title={client.lastPath}
                              >
                                {client.lastPath || "/tienda"}
                              </span>
                            </td>

                            {/* Last Activity */}
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-mono text-[11px] text-slate-500">
                                {timeStr}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
  </>
 );
}
