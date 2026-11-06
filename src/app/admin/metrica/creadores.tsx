import React from "react";
import { BarChart3, TrendingUp, DollarSign, Eye, Heart, MessageSquare, Bookmark, ShoppingBag, Users, Video, Truck, CheckCircle2, ExternalLink, Award, Activity, Filter, Calendar, ShoppingCart, CreditCard, ArrowDown, Globe, Smartphone, Clock, Search, Key } from "lucide-react";

type Props = any;
export default function CreadoresMetrica(props: Props) {
 const { activeSection, topCreators, onCreatorClick } = props;
 return (
  <>
      {/* Section: Ranking de Creadores y Vendedores */}
      {(activeSection === "all" || activeSection === "creadores") && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-slate-900">
                Creadores y Vendedores Destacados
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Por alcance y catálogo de productos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreators.map((item, idx) => (
              <div
                key={`${item.user.id}-${idx}`}
                onClick={() => onCreatorClick?.(item.user.id)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/40 hover:bg-amber-50/20 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={
                      item.user.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    }
                    alt={item.user.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-600">
                      {item.user.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {item.user.email || "Cliente de la tienda"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      <b>{item.reelsCount}</b> videos •{" "}
                      <b>{item.productsCount}</b> productos
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-mono font-black text-slate-900 block">
                    {item.totalViews}
                  </span>
                  <span className="text-[10px] text-slate-400 block">vistas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  </>
 );
}
