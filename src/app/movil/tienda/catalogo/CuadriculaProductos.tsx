import React from "react";
import { Product } from "../../tipos";
import { DisplayProductItem } from "./TiposCatalogo";
import TarjetaProducto from "./TarjetaProducto";
import CatalogoSinResultados from "./CatalogoSinResultados";
import { CatalogoEsqueleto, CentinelaPaginacion } from "./CatalogoCargando";

export interface CuadriculaProductosProps {
  isLoading: boolean;
  totalProductsCount: number;
  filteredProductsCount: number;
  displayedProducts: DisplayProductItem[];
  searchQuery: string;
  activeCategory: string;
  savedReelIds?: string[];
  onSelectProduct: (product: Product) => void;
  onToggleSave?: (productId: string) => void;
  onRefreshProducts?: () => void;
  isLoadingMore: boolean;
  infiniteLoaderRef: React.RefObject<HTMLDivElement | null>;
}

export const CuadriculaProductos: React.FC<CuadriculaProductosProps> = ({
  isLoading,
  totalProductsCount,
  filteredProductsCount,
  displayedProducts,
  searchQuery,
  activeCategory,
  savedReelIds = [],
  onSelectProduct,
  onToggleSave,
  onRefreshProducts,
  isLoadingMore,
  infiniteLoaderRef,
}) => {
  return (
    <>
      <div className="px-[4px] py-2 grid grid-cols-2 gap-[4px] flex-1">
        {isLoading && totalProductsCount === 0 ? (
          <CatalogoEsqueleto count={4} />
        ) : filteredProductsCount === 0 ? (
          <CatalogoSinResultados
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            onRefreshProducts={onRefreshProducts}
          />
        ) : (
          displayedProducts.map((p, pIdx) => {
            const isSaved = savedReelIds.includes(p.id);
            return (
              <TarjetaProducto
                key={`${p._renderKey || p.id}-${pIdx}`}
                product={p}
                isSaved={isSaved}
                onSelect={onSelectProduct}
                onToggleSave={onToggleSave}
              />
            );
          })
        )}
      </div>

      {filteredProductsCount > 0 && (
        <CentinelaPaginacion
          isLoadingMore={isLoadingMore}
          loaderRef={infiniteLoaderRef}
        />
      )}
    </>
  );
};

export default CuadriculaProductos;
