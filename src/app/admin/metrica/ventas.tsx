import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";

type Props = any;
export default function VentasMetrica(props: Props) {
 const { activeSection, orders, totalShippingRevenue, orderStatusBreakdown, topProducts, onProductClick } = props;
 return (
  <>
      {/* Section: Ventas & Estado Logístico */}
      {(activeSection === "all" || activeSection === "ventas") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Funnel de Órdenes */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Distribución de Pedidos ({orders.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Envíos: ${totalShippingRevenue.toFixed(2)}
              </span>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  key: "delivered",
                  label: "Entregados",
                  count: orderStatusBreakdown.delivered,
                  color: "bg-emerald-500",
                  textColor: "text-emerald-700",
                },
                {
                  key: "shipped",
                  label: "En Tránsito / Enviados",
                  count: orderStatusBreakdown.shipped,
                  color: "bg-blue-500",
                  textColor: "text-blue-700",
                },
                {
                  key: "processing",
                  label: "En Preparación",
                  count: orderStatusBreakdown.processing,
                  color: "bg-amber-500",
                  textColor: "text-amber-700",
                },
                {
                  key: "pending",
                  label: "Pendientes",
                  count: orderStatusBreakdown.pending,
                  color: "bg-slate-400",
                  textColor: "text-slate-700",
                },
                {
                  key: "cancelled",
                  label: "Cancelados",
                  count: orderStatusBreakdown.cancelled,
                  color: "bg-rose-500",
                  textColor: "text-rose-700",
                },
              ].map((item) => {
                const pct =
                  orders.length > 0 ? Math.round((item.count / orders.length) * 100) : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{item.label}</span>
                      <span className={`font-mono font-bold ${item.textColor}`}>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Productos por Rendimiento */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Productos con Mayor Rendimiento
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Top {topProducts.length} del catálogo
              </span>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No hay productos registrados en el catálogo.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topProducts.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${idx}`}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-5 text-xs font-mono font-black text-slate-400">
                        #{idx + 1}
                      </span>
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Precio:{" "}
                          <span className="font-mono font-bold text-slate-800">
                            ${Number(item.product.price).toFixed(2)}
                          </span>{" "}
                          • Stock: {item.product.stock}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 text-right">
                      <div>
                        <p className="text-xs font-mono font-black text-emerald-600">
                          {item.unitsSold} vendidos (${item.revenue.toFixed(2)})
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {item.views} vistas en tienda
                        </p>
                      </div>
                      {onProductClick && (
                        <button
                          type="button"
                          onClick={() => onProductClick(item.product)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Ver producto"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


  </>
 );
}
