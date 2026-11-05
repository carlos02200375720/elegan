import React from "react";
import { RefreshCw } from "lucide-react";

export interface CatalogoCargandoProps {
  count?: number;
}

export const CatalogoEsqueleto: React.FC<CatalogoCargandoProps> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col animate-pulse"
        >
          <div className="w-full aspect-square bg-slate-800 rounded-xl mb-3" />
          <div className="h-3.5 bg-slate-800 rounded w-3/4 mb-2" />
          <div className="h-2.5 bg-slate-800 rounded w-1/2 mb-3" />
          <div className="h-5 bg-slate-800 rounded mt-auto" />
        </div>
      ))}
    </>
  );
};

export interface InfiniteScrollLoaderProps {
  isLoadingMore: boolean;
  loaderRef: React.RefObject<HTMLDivElement | null>;
}

export const CentinelaPaginacion: React.FC<InfiniteScrollLoaderProps> = ({
  isLoadingMore,
  loaderRef,
}) => {
  return (
    <div ref={loaderRef as any} className="w-full py-5 flex flex-col items-center justify-center">
      {isLoadingMore ? (
        <div className="flex items-center space-x-2 bg-slate-100/95 border border-slate-200 px-4 py-2 rounded-full shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          <span className="text-[11px] font-semibold text-slate-600">Cargando más productos...</span>
        </div>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
      )}
    </div>
  );
};

export default CatalogoEsqueleto;
