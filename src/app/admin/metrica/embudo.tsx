import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";
import { navigateTo } from "../../../router";
import ClientesEmbudo from "./clientes-embudo";
type Props = any;
export default function EmbudoMetrica(props: Props) {
 const { activeSection, selectedFunnelPeriod, setSelectedFunnelPeriod, periodLabels, computedFunnelData, funnelLayers } = props;
 return (
  <>
      {/* NEW SECTION: Embudo de Venta (Sales Funnel) */}
      {(activeSection === "all" || activeSection === "embudo") && (
        <div
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6"
          id="admin-sales-funnel-section"
        >
          {/* Funnel Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-[11px] font-black uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sesión: Embudo de Venta (5 Capas)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Embudo de Conversión de Tienda y Visitas a la Página
              </h3>
              <p className="text-xs text-slate-500">
                Seguimiento completo desde que el visitante entra a{" "}
                <span className="font-mono font-bold text-slate-700">dominio/tienda</span> hasta que
                completa su compra en{" "}
                <span className="font-mono font-bold text-emerald-700">dominio/tienda/gracia</span>.
              </p>
            </div>

            {/* Period Filter Pills for the Funnel Layers */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl self-start lg:self-center overflow-x-auto max-w-full">
              {(
                [
                  { id: "day", label: "Día" },
                  { id: "week", label: "Semana" },
                  { id: "month", label: "Mes" },
                  { id: "year", label: "Año" },
                  { id: "all", label: "Total" },
                ] as { id: FunnelTimePeriod; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedFunnelPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedFunnelPeriod === p.id
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* TOP OF FUNNEL: Visitas de la Página por Día, Semana, Mes, Año */}
          <div className="space-y-2.5" id="funnel-top-visits-summary">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Visitas Totales de la Página (Por Día, Semana, Mes y Año)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Mostrando embudo: <b className="text-slate-700">{periodLabels[selectedFunnelPeriod]}</b>
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                {
                  id: "day" as FunnelTimePeriod,
                  title: "Tráfico por Día",
                  subtitle: "Últimas 24 horas (Hoy)",
                  badge: "DÍA",
                  count: computedFunnelData.pageVisits.day,
                  usersCount: computedFunnelData.pageUsers.day,
                  accent: "border-sky-200 bg-sky-50/40 hover:border-sky-400",
                  activeRing: "ring-2 ring-sky-500 border-sky-500 bg-sky-50/80",
                  badgeColor: "bg-sky-500/15 text-sky-700",
                  numColor: "text-sky-900",
                },
                {
                  id: "week" as FunnelTimePeriod,
                  title: "Tráfico por Semana",
                  subtitle: "Últimos 7 días",
                  badge: "SEMANA",
                  count: computedFunnelData.pageVisits.week,
                  usersCount: computedFunnelData.pageUsers.week,
                  accent: "border-indigo-200 bg-indigo-50/40 hover:border-indigo-400",
                  activeRing: "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/80",
                  badgeColor: "bg-indigo-500/15 text-indigo-700",
                  numColor: "text-indigo-900",
                },
                {
                  id: "month" as FunnelTimePeriod,
                  title: "Tráfico por Mes",
                  subtitle: "Últimos 30 días",
                  badge: "MES",
                  count: computedFunnelData.pageVisits.month,
                  usersCount: computedFunnelData.pageUsers.month,
                  accent: "border-amber-200 bg-amber-50/40 hover:border-amber-400",
                  activeRing: "ring-2 ring-amber-500 border-amber-500 bg-amber-50/80",
                  badgeColor: "bg-amber-500/20 text-amber-800",
                  numColor: "text-amber-900",
                },
                {
                  id: "year" as FunnelTimePeriod,
                  title: "Tráfico por Año",
                  subtitle: "Últimos 365 días",
                  badge: "AÑO",
                  count: computedFunnelData.pageVisits.year,
                  usersCount: computedFunnelData.pageUsers.year,
                  accent: "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400",
                  activeRing: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/80",
                  badgeColor: "bg-emerald-500/15 text-emerald-800",
                  numColor: "text-emerald-900",
                },
              ].map((card) => {
                const isSelected = selectedFunnelPeriod === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedFunnelPeriod(card.id)}
                    className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      isSelected ? card.activeRing : card.accent
                    }`}
                    id={`funnel-visits-card-${card.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-700">
                        {card.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase ${card.badgeColor}`}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className={`text-xl sm:text-2xl font-display font-black ${card.numColor}`}
                          >
                            {card.count.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                            visitas
                          </span>
                        </div>
                      </div>
                      <div className="h-6 w-px bg-slate-200/80" />
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-xl sm:text-2xl font-display font-black text-slate-800">
                            {card.usersCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                            usuarios
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{card.subtitle}</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-LAYER VISUAL SALES FUNNEL */}
          <div className="pt-2 space-y-1.5" id="sales-funnel-layers-container">
            {funnelLayers.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <React.Fragment key={layer.layerNumber}>
                  {/* Connector Arrow Between Funnel Layers */}
                  {index > 0 && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-600">
                        <ArrowDown className="w-3 h-3 text-slate-500" />
                        <span>
                          Avance Capa {layer.layerNumber}:{" "}
                          <b className="text-slate-900">{layer.stepConversionPct}%</b> visitas •{" "}
                          <b className="text-indigo-700">{layer.usersStepConversionPct}%</b> usuarios
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Funnel Layer Card */}
                  <div
                    className={`${layer.widthClass} mx-auto rounded-2xl border ${layer.borderColor} bg-gradient-to-r ${layer.bgGradient} p-4 sm:p-5 transition-all shadow-2xs relative overflow-hidden`}
                    id={`funnel-layer-${layer.layerNumber}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      {/* Left: Layer Badge, Title, Route & Description */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider ${layer.badgeClass}`}
                          >
                            {layer.badge}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${layer.routeBadgeClass}`}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{layer.routeDisplay}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateTo(layer.targetPath)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title={`Ir a ${layer.routeDisplay}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          {layer.title}
                        </h4>
                        <p className="text-xs text-slate-600">{layer.description}</p>
                      </div>

                      {/* Right: Dual Counter (Por Visita & Por Usuario) */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 border-slate-200/60 pt-2.5 sm:pt-0">
                        {/* Counter 1: Por Visita */}
                        <div className="bg-white/90 border border-slate-200/80 rounded-xl px-3.5 py-2 text-right shadow-2xs">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 block">
                            Por Visita
                          </span>
                          <div className="flex items-baseline justify-end gap-1 mt-0.5">
                            <span
                              className={`text-xl sm:text-2xl font-display font-black ${layer.numberColor}`}
                            >
                              {layer.count.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                              {layer.unitLabel}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            {layer.pctOfTop}% de visitas
                          </span>
                        </div>

                        {/* Counter 2: Por Usuario Único */}
                        <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2 text-right shadow-2xs">
                          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-end gap-1">
                            <Users className="w-3 h-3 text-amber-400" />
                            <span>Por Usuario</span>
                          </span>
                          <div className="flex items-baseline justify-end gap-1 mt-0.5">
                            <span className="text-xl sm:text-2xl font-display font-black text-white">
                              {layer.usersCount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                              {layer.usersUnitLabel}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            {layer.usersPctOfTop}% de usuarios
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Funnel Progress Bar */}
                    <div className="mt-3 w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${layer.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(6, layer.pctOfTop)}%` }}
                      />
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Bottom Summary Bar of Funnel Conversion */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  Conversión Tienda → Producto (Capa 1 → 2)
                </p>
                <p className="text-xs text-slate-400">Interés en catálogo</p>
              </div>
              <span className="text-lg font-display font-black text-violet-700">
                {funnelLayers[1]?.stepConversionPct || 0}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500">
                  Conversión Carrito → Verificación (Capa 3 → 4)
                </p>
                <p className="text-xs text-slate-400">Intención de pago</p>
              </div>
              <span className="text-lg font-display font-black text-cyan-700">
                {funnelLayers[3]?.stepConversionPct || 0}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-800">
                  Conversión Final a Compra (Capa 1 → 5)
                </p>
                <p className="text-xs text-emerald-600">Llegaron a dominio/tienda/gracia</p>
              </div>
              <span className="text-lg font-display font-black text-emerald-700">
                {funnelLayers[4]?.pctOfTop || 0}%
              </span>
            </div>
          </div>

          {/* REAL-TIME TOKEN CLIENT TRACKING TABLE: Seguimiento en Vivo por Token */}
                    <ClientesEmbudo {...props} />

        </div>
      )}


  </>
 );
}
