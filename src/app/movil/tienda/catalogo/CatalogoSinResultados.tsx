import React from "react";
import { ShoppingBag, RefreshCw } from "lucide-react";

export interface CatalogoSinResultadosProps {
  searchQuery: string;
  activeCategory: string;
  onRefreshProducts?: () => void;
}

export const CatalogoSinResultados: React.FC<CatalogoSinResultadosProps> = ({
  searchQuery,
  activeCategory,
  onRefreshProducts,
}) => {
  const isFiltered = Boolean(searchQuery || (activeCategory !== "Todos" && activeCategory !== "todos"));

  return (
    <div className="col-span-2 py-16 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-amber-400">
        <ShoppingBag className="w-7 h-7" />
      </div>
      <p className="text-sm font-bold text-slate-200">
        {isFiltered
          ? "No se encontraron productos en esta categoría."
          : "No se encontraron productos en este catálogo."}
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">
        {isFiltered
          ? "Prueba seleccionando otra categoría o cambiando la búsqueda."
          : "Comprueba tu conexión o reintenta sincronizar con el catálogo."}
      </p>
      {onRefreshProducts && (
        <button
          type="button"
          onClick={onRefreshProducts}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-transform shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar conexión</span>
        </button>
      )}
    </div>
  );
};

export default CatalogoSinResultados;
