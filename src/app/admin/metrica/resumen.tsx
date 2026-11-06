import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";

type Props = any;
export default function ResumenMetrica(props: Props) {
 const { activeSection, setActiveSection, dailyVisitorData, dailyVisitorLoading, dailyVisitorError, refreshDailyVisitors, totalRevenue, avgOrderValue, totalItemsSold, totalReelViews, engagementRate, totalReelLikes, totalReelComments, totalInventoryValue, totalInventoryUnits, totalProductViews, users, onlineUsersCount, activeSellersCount } = props;
 return (
  <>
      {/* Header & Section Filter */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-black uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            <span>Analítica en Tiempo Real</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Métricas y Rendimiento de la Plataforma
          </h2>
          <p className="text-xs text-slate-500">
            Embudo de ventas por capas, tráfico por período, ingresos, reels y crecimiento de creadores.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl self-start md:self-center overflow-x-auto max-w-full">
          {[
            { id: "all", label: "Vista Global" },
            { id: "embudo", label: "Embudo de Ventas" },
            { id: "ventas", label: "Ventas & Tienda" },
            { id: "reels", label: "Engagement Reels" },
            { id: "creadores", label: "Creadores" },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as MetricSection)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeSection === sec.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id={`metrica-section-btn-${sec.id}`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily unique visitors from the invitados collection */}
      <section
        className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
        id="admin-daily-visitors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Tráfico diario real</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Personas que visitan tu negocio
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Visitantes únicos por día, separados entre invitados y cuentas registradas.
              {dailyVisitorData?.today?.date
                ? ` Hoy: ${new Date(`${dailyVisitorData.today.date}T12:00:00`).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}.`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void refreshDailyVisitors(); }}
            disabled={dailyVisitorLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 ${dailyVisitorLoading ? "animate-pulse" : ""}`} />
            Actualizar
          </button>
        </div>

        {dailyVisitorError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {dailyVisitorError}
          </p>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-500">Visitantes únicos hoy</p>
            <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
              {dailyVisitorData?.today.visitors ?? (dailyVisitorLoading ? "…" : "0")}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Web + app móvil</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-[11px] font-bold text-amber-800">Invitados hoy</p>
            <p className="mt-1 text-2xl font-black text-amber-900 tabular-nums">
              {dailyVisitorData?.today.guests ?? (dailyVisitorLoading ? "…" : "0")}
            </p>
            <p className="text-[10px] text-amber-800/70 mt-1">Sin cuenta registrada</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
            <p className="text-[11px] font-bold text-blue-800">Visitantes con cuenta</p>
            <p className="mt-1 text-2xl font-black text-blue-900 tabular-nums">
              {dailyVisitorData?.today.registeredVisitors ?? (dailyVisitorLoading ? "…" : "0")}
            </p>
            <p className="text-[10px] text-blue-800/70 mt-1">Clientes que iniciaron sesión</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-bold text-emerald-800">Nuevos registros hoy</p>
            <p className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">
              {dailyVisitorData?.today.registrations ?? (dailyVisitorLoading ? "…" : "0")}
            </p>
            <p className="text-[10px] text-emerald-800/70 mt-1">Cuentas creadas realmente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-black text-slate-900">App / Web</h4>
              <span className="ml-auto text-lg font-black text-slate-900 tabular-nums">
                {dailyVisitorData?.today.web.visitors ?? 0}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-amber-700">{dailyVisitorData?.today.web.guests ?? 0}</p><p className="text-[10px] text-slate-500">Invitados</p></div>
              <div><p className="text-lg font-bold text-blue-700">{dailyVisitorData?.today.web.registeredVisitors ?? 0}</p><p className="text-[10px] text-slate-500">Con cuenta</p></div>
              <div><p className="text-lg font-bold text-emerald-700">{dailyVisitorData?.today.web.registrations ?? 0}</p><p className="text-[10px] text-slate-500">Registros</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-4 h-4 text-violet-600" />
              <h4 className="text-sm font-black text-slate-900">App / Móvil</h4>
              <span className="ml-auto text-lg font-black text-slate-900 tabular-nums">
                {dailyVisitorData?.today.android.visitors ?? 0}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold text-amber-700">{dailyVisitorData?.today.android.guests ?? 0}</p><p className="text-[10px] text-slate-500">Invitados</p></div>
              <div><p className="text-lg font-bold text-blue-700">{dailyVisitorData?.today.android.registeredVisitors ?? 0}</p><p className="text-[10px] text-slate-500">Con cuenta</p></div>
              <div><p className="text-lg font-bold text-emerald-700">{dailyVisitorData?.today.android.registrations ?? 0}</p><p className="text-[10px] text-slate-500">Registros</p></div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-black text-slate-900">Últimos 7 días</h4>
            <span className="text-[10px] text-slate-400">Zona horaria: República Dominicana</span>
          </div>
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3">Día</th>
                <th className="py-2 px-2 text-right">Visitantes</th>
                <th className="py-2 px-2 text-right">Invitados</th>
                <th className="py-2 px-2 text-right">Con cuenta</th>
                <th className="py-2 px-2 text-right">Registros</th>
                <th className="py-2 px-2 text-right">Web</th>
                <th className="py-2 pl-2 text-right">Móvil</th>
              </tr>
            </thead>
            <tbody>
              {(dailyVisitorData?.daily || []).slice().reverse().map((day) => (
                <tr key={day.date} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-slate-700">
                    {new Date(`${day.date}T12:00:00`).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="py-2.5 px-2 text-right font-black text-slate-900">{day.visitors}</td>
                  <td className="py-2.5 px-2 text-right text-amber-700">{day.guests}</td>
                  <td className="py-2.5 px-2 text-right text-blue-700">{day.registeredVisitors}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-700">{day.registrations}</td>
                  <td className="py-2.5 px-2 text-right text-slate-600">{day.web.visitors}</td>
                  <td className="py-2.5 pl-2 text-right text-slate-600">{day.android.visitors}</td>
                </tr>
              ))}
              {!dailyVisitorData?.daily.length && !dailyVisitorLoading && (
                <tr><td colSpan={7} className="py-5 text-center text-slate-400">Todavía no hay visitas registradas en este período.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] leading-relaxed text-slate-400">
          Cada navegador o dispositivo se cuenta una sola vez por día y plataforma; las recargas actualizan el mismo registro. Una persona que use Web y Móvil puede aparecer en ambos desgloses. Los registros cuentan solo cuentas creadas mediante el formulario de registro.
        </p>
      </section>

      {/* Primary Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ingresos Totales</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-black text-slate-900">
              ${totalRevenue.toFixed(2)} <span className="text-xs font-mono text-slate-400">USD</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Ticket promedio:{" "}
              <span className="font-bold text-emerald-600">${avgOrderValue.toFixed(2)}</span> •{" "}
              {totalItemsSold} uds. vendidas
            </p>
          </div>
        </div>

        {/* KPI 2: Alcance y Engagement */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Interacción en Reels</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-black text-slate-900">
              {totalReelViews.toLocaleString()}{" "}
              <span className="text-xs font-mono text-slate-400">vistas</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Engagement:{" "}
              <span className="font-bold text-rose-600">{engagementRate.toFixed(1)}%</span> •{" "}
              {totalReelLikes} likes • {totalReelComments} coment.
            </p>
          </div>
        </div>

        {/* KPI 3: Catálogo e Inventario */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Valor de Inventario</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-black text-slate-900">
              ${totalInventoryValue.toFixed(2)}{" "}
              <span className="text-xs font-mono text-slate-400">USD</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-indigo-600">{totalInventoryUnits}</span> unidades en
              stock • {totalProductViews} vistas
            </p>
          </div>
        </div>

        {/* KPI 4: Comunidad Activa */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Comunidad y Vendedores</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-black text-slate-900">
              {users.length}{" "}
              <span className="text-xs font-mono text-slate-400">cuentas</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-emerald-600">{onlineUsersCount} en línea</span> •{" "}
              {activeSellersCount} con permiso de venta
            </p>
          </div>
        </div>
      </div>


  </>
 );
}
