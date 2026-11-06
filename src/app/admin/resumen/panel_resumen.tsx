import React from "react";
import { Users, Video, ShoppingBag, Package, Truck, Activity, Database, Server, Loader2, ChevronRight, ArrowUpRight, Sparkles, Edit3, Headphones } from "lucide-react";
import { navigateTo } from "../../../router";
import { DatosResumen } from "./tipos";

export default function PanelResumen({ datos }: { datos: DatosResumen }) {
  const { users, onCreatorClick, onNavigateToTab, activeAdminTab, handleSelectAdminTab, allOrders, isLoadingOrders, setPublishInitialTab, setEditingOrder, setOrderNewStatus, setOrderNewCarrier, setOrderNewTracking, setOrderNewNotes, totalPlatformRevenue } = datos;
  return (
    <>
      {/* Tab 1: Resumen General */}
      {activeAdminTab === 'resumen' && (
        <div className="space-y-6" id="admin-tab-content-resumen">
          {/* Quick Actions and Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Platform Overview & Recent Orders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders Overview */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <Truck className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-black text-slate-900">Órdenes Recientes de Clientes</h2>
                  </div>
                  <button
                    onClick={() => handleSelectAdminTab('ordenes')}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                  >
                    <span>Ver todas ({allOrders.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isLoadingOrders ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    <p className="text-xs">Cargando órdenes del sistema...</p>
                  </div>
                ) : allOrders.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    No hay pedidos registrados en el sistema actualmente.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {allOrders.slice(0, 5).map((order, oIdx) => (
                      <div key={`${order.id || 'order'}-${oIdx}`} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {order.items && order.items[0]?.imageUrl ? (
                              <img src={order.items[0].imageUrl} alt="Item" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {order.buyerName || "Cliente"} <span className="text-slate-400 font-mono font-normal">(@{order.buyerUsername || "anon"})</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {order.items?.length || 0} producto(s) • Total: <span className="font-bold text-slate-800">${Number(order.total).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'delivered'
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === 'shipped'
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {order.status}
                          </span>
                          <button
                            onClick={() => {
                              setEditingOrder(order);
                              setOrderNewStatus(order.status || 'processing');
                              setOrderNewCarrier(order.carrier || '');
                              setOrderNewTracking(order.trackingNumber || '');
                              setOrderNewNotes(order.sellerNotes || '');
                            }}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                            title="Actualizar estado / guía"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Registered Users */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-base font-black text-slate-900">Cuentas Registradas Recientemente</h2>
                  </div>
                  <button
                    onClick={() => handleSelectAdminTab('usuarios')}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                  >
                    <span>Ver todos ({users.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {users.slice(0, 6).map((u, uIdx) => (
                    <div
                      key={`${u.id}-${uIdx}`}
                      onClick={() => onCreatorClick(u.id)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/30 transition-all flex items-center space-x-3 cursor-pointer group"
                    >
                      <img
                        src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-600">
                          {u.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          {u.email || u.name}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Platform Health & Shortcuts */}
            <div className="space-y-6">
              {/* Shortcuts Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Accesos Rápidos
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => { onNavigateToTab('messages'); navigateTo('/messages'); }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-amber-200/90 bg-amber-50/50 hover:bg-amber-100/50 transition-all text-left group"
                    id="admin-shortcut-support-messages"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                        <Headphones className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Bandeja de Soporte al Cliente</p>
                        <p className="text-[10px] text-amber-800 font-semibold">Responder consultas como cg0220037@gmail.com</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-700 group-hover:text-amber-950" />
                  </button>

                  <button
                    onClick={() => { onNavigateToTab('inicio'); navigateTo('/inicio'); }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Página de Inicio</p>
                        <p className="text-[10px] text-slate-500">Ver interfaz de inicio</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </button>

                  <button
                    onClick={() => onNavigateToTab('shop')}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Catálogo de Tienda</p>
                        <p className="text-[10px] text-slate-500">Explorar productos en vivo</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </button>

                  <button
                    onClick={() => {
                      setPublishInitialTab("product");
                      handleSelectAdminTab("publicar");
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Publicador de Contenido</p>
                        <p className="text-[10px] text-slate-500">Subir nuevo reel o artículo</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Server Diagnostics Widget */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Telemetría del Servidor
                    </h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Database Engine</span>
                    <span className="text-amber-400 font-bold">MongoDB Atlas</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Status Conexión</span>
                    <span className="text-emerald-400 font-bold">ReadyState 1 (Activo)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Media Transcoder</span>
                    <span className="text-indigo-400 font-bold">FFmpeg HLS (720p/1080p)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-400">Cloud Storage</span>
                    <span className="text-slate-200">GCS Bucket / Local HLS</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Ventas Registradas</span>
                    <span className="text-emerald-400 font-bold">${totalPlatformRevenue.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
