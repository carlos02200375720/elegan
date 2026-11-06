import React from "react";
import PublishView from "../publicar";
import { LayoutDashboard, Users, Video, ShoppingBag, Truck, RefreshCw, AlertCircle, CheckCircle2, Database, X, Plus, BarChart3, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { DatosResumen } from "./tipos";

export default function Encabezado({ datos }: { datos: DatosResumen }) {
  const { currentUser, reels, products, onRefreshAll, onNavigateToTab, activeAdminTab, handleSelectAdminTab, isRefreshing, statusMessage, setStatusMessage, isPublishOpen, setIsPublishOpen, publishInitialTab, setPublishInitialTab, handleManualRefresh, totalUsersCount, totalReelsCount, totalProductsCount, totalOrdersCount } = datos;
  return (
    <>
      {/* Sticky Top Header with Sub-Tabs Navigation */}
      <header
        className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-md shadow-slate-950/30 transition-all -mt-6 mb-6"
        id="admin-sticky-header"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Sub-Tabs Navigation Bar - Full Width / Expanded in Header */}
          <div
            className="flex-1 min-w-0 bg-slate-900/90 p-1 rounded-2xl flex items-center space-x-1.5 overflow-x-auto select-none border border-slate-800/90 scrollbar-none"
            id="admin-subtabs-nav"
          >
            {[
              { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
              { id: 'metrica', label: 'Métricas', icon: BarChart3 },
              { id: 'usuarios', label: `Usuarios (${totalUsersCount})`, icon: Users },
              { id: 'reels', label: `Reels & Vídeos (${totalReelsCount})`, icon: Video },
              { id: 'productos', label: `Productos (${totalProductsCount})`, icon: ShoppingBag },
              { id: 'ordenes', label: `Pedidos (${totalOrdersCount})`, icon: Truck },
              { id: 'fotos_defecto', label: 'Fotos por Defecto', icon: ImageIcon },
              { id: 'sistema', label: 'Estado del Sistema', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAdminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectAdminTab(tab.id as AdminTab)}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`flex items-center justify-center p-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/25 scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                  }`}
                  id={`admin-tab-btn-${tab.id}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                </button>
              );
            })}

            {/* Direct Support Chat Navigation for Admin */}
            <button
              type="button"
              onClick={() => {
                onNavigateToTab('messages');
                navigateTo('/messages');
              }}
              title="Bandeja de Soporte al Cliente (cg0220037@gmail.com)"
              aria-label="Bandeja de Soporte al Cliente"
              className="flex items-center justify-center p-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer text-amber-400 hover:text-white hover:bg-slate-800/70"
              id="admin-tab-btn-support-chat"
            >
              <Headphones className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer disabled:opacity-50"
              id="admin-header-refresh-btn"
              title="Sincronizar"
              aria-label="Sincronizar"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>
            <button
              onClick={() => {
                setPublishInitialTab("product");
                handleSelectAdminTab("publicar");
              }}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
              id="admin-header-publish-btn"
              title="Publicar / Vender"
              aria-label="Publicar / Vender"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {isPublishOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6"
          id="admin-publish-overlay"
        >
          <div className="min-h-full flex items-start justify-center py-2 sm:py-6">
            <div className="w-full max-w-5xl">
              <PublishView
                currentUser={currentUser}
                initialTab={publishInitialTab}
                onBack={() => setIsPublishOpen(false)}
                onSuccess={() => {
                  onRefreshAll();
                  setIsPublishOpen(false);
                }}
                userProducts={products}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Status Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm ${
              statusMessage.type === 'success'
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === 'error'
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            <div className="flex items-center space-x-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
