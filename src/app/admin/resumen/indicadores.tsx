import React from "react";
import { Users, Video, ShoppingBag, Truck, ChevronRight } from "lucide-react";

import { DatosResumen } from "./tipos";

export default function Indicadores({ datos }: { datos: DatosResumen }) {
  const { users, reels, products, handleSelectAdminTab, totalUsersCount, totalReelsCount, totalProductsCount, totalOrdersCount, totalPlatformRevenue, totalReelViews } = datos;
  return (
    <>
      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" id="admin-kpi-cards">
        {/* Card 1: Usuarios */}
        <div
          onClick={() => handleSelectAdminTab('usuarios')}
          className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
          id="kpi-card-users"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Usuarios Registrados</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {totalUsersCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span>Ver directorio de cuentas</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Card 2: Reels & Videos */}
        <div
          onClick={() => handleSelectAdminTab('reels')}
          className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
          id="kpi-card-reels"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Reels & Contenido</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {totalReelsCount}
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              ({totalReelViews} vistas)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span>Moderar publicaciones</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Card 3: Productos Tienda */}
        <div
          onClick={() => handleSelectAdminTab('productos')}
          className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
          id="kpi-card-products"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Productos en Catálogo</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {totalProductsCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span>Inventario de la tienda</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>

        {/* Card 4: Pedidos & Facturación */}
        <div
          onClick={() => handleSelectAdminTab('ordenes')}
          className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer group"
          id="kpi-card-orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pedidos Globales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {totalOrdersCount}
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-black">
              ${totalPlatformRevenue.toFixed(2)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            <span>Gestionar envíos y guías</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </p>
        </div>
      </div>

    </>
  );
}
