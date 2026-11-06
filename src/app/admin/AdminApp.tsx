import React from "react";
import AdminView from "./resumen/index";
import { AdminViewProps } from "./tipos";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

export type AdminAppProps = AdminViewProps;

export default function AdminApp(props: AdminAppProps) {
  const { onNavigateToTab, activePlatform, onSwitchPlatform } = props;

  const handleReturnToStore = () => {
    if (onNavigateToTab) {
      onNavigateToTab("shop");
    } else {
      window.location.href = "/tienda/catalogo";
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none" id="admin-app-root">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-50 bg-slate-950 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReturnToStore}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-800"
            title="Volver a la tienda"
            id="admin-btn-back-to-store"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-display font-extrabold text-xs sm:text-sm tracking-tight text-white">
              Panel Administrativo Autónomo
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
              Admin App
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onSwitchPlatform && activePlatform && (
            <div className="hidden md:flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => onSwitchPlatform("web")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePlatform === "web" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Web
              </button>
              <button
                type="button"
                onClick={() => onSwitchPlatform("android")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePlatform === "android" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Android
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleReturnToStore}
            className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-bold px-2 py-1 transition-colors"
          >
            <span className="hidden sm:inline">Ver Tienda</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Admin View Content */}
      <main className="flex-1 pb-16">
        <AdminView {...props} />
      </main>
    </div>
  );
}

export { AdminApp };
