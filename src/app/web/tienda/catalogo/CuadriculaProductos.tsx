import React from "react";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { Product, User } from "../../../../types";
import TarjetaProducto from "./TarjetaProducto";

interface CuadriculaProductosProps {
  products: Product[];
  displayedProducts: Product[];
  filteredProductsCount: number;
  users: User[];
  savedReelIds: string[];
  favorites: string[];
  isLoadingMore: boolean;
  infiniteLoaderRef: React.RefObject<HTMLDivElement | null>;
  onSelectProduct: (product: Product) => void;
  onToggleSave: (productId: string) => void;
  onRefreshProducts?: () => void;
  onResetFilters: () => void;
}

export default function CuadriculaProductos({
  products,
  displayedProducts,
  filteredProductsCount,
  users,
  savedReelIds,
  favorites,
  isLoadingMore,
  infiniteLoaderRef,
  onSelectProduct,
  onToggleSave,
  onRefreshProducts,
  onResetFilters,
}: CuadriculaProductosProps) {
  if (filteredProductsCount === 0) {
    return (
      <motion.div
        key="no-results"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full py-16 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
          <Search className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-display font-bold text-sm text-slate-800">
          {products.length === 0 ? "Cargando catálogo..." : "No se encontraron productos"}
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          {products.length === 0
            ? "Conectando con el servidor para obtener los productos disponibles."
            : "Intenta buscar con otros términos o limpia el campo de búsqueda."}
        </p>
        {products.length === 0 && onRefreshProducts ? (
          <button
            type="button"
            onClick={() => onRefreshProducts()}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
          >
            Actualizar catálogo
          </button>
        ) : (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-full transition-colors cursor-pointer"
          >
            Ver todos los productos
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key="catalog"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 bg-white"
      >
        {displayedProducts.map((product, index) => {
          const isSaved =
            savedReelIds.includes(product.id) || favorites.includes(product.id);
          return (
            <TarjetaProducto
              key={`${product.id}-${index}`}
              product={product}
              index={index}
              users={users}
              isSaved={isSaved}
              onSelect={onSelectProduct}
              onToggleSave={onToggleSave}
            />
          );
        })}
      </motion.div>

      {/* Infinite Scroll Loader & Sentinel */}
      <div
        ref={infiniteLoaderRef}
        className="w-full py-6 flex flex-col items-center justify-center space-y-2"
      >
        {isLoadingMore ? (
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-xs">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Cargando más productos...</span>
          </div>
        ) : (
          <div className="h-4 flex items-center justify-center opacity-40">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>
        )}
      </div>
    </>
  );
}

export { CuadriculaProductos };
