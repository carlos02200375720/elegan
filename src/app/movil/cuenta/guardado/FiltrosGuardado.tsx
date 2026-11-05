import { Bookmark, Play, ShoppingBag } from "lucide-react";
import { GuardadoSubTab } from "./useGuardadoPerfil";

interface FiltrosGuardadoProps {
  activeTab: GuardadoSubTab;
  total: number;
  reels: number;
  products: number;
  onChange: (tab: GuardadoSubTab) => void;
}

export default function FiltrosGuardado({
  activeTab,
  total,
  reels,
  products,
  onChange,
}: FiltrosGuardadoProps) {
  const buttonClass = (tab: GuardadoSubTab) =>
    `px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
      activeTab === tab
        ? "bg-amber-500 text-slate-950 shadow-xs font-black ring-2 ring-amber-500/20"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div className="flex flex-row items-center gap-2 pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
      <button type="button" id="android-saved-filter-all" onClick={() => onChange("all")} className={buttonClass("all")}>
        <Bookmark className="w-3.5 h-3.5" />
        <span>Todos ({total})</span>
      </button>
      <button type="button" id="android-saved-filter-reels" onClick={() => onChange("reels")} className={buttonClass("reels")}>
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Publicaciones ({reels})</span>
      </button>
      <button type="button" id="android-saved-filter-products" onClick={() => onChange("products")} className={buttonClass("products")}>
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Productos ({products})</span>
      </button>
    </div>
  );
}
