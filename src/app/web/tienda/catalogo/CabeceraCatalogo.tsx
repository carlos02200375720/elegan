import React from "react";
import { ArrowLeft, Search, X, ShoppingCart, Bookmark } from "lucide-react";
import { Product } from "../../tipos";
import { PasoTienda } from "./TiposCatalogo";
import CarruselCategorias from "./CarruselCategorias";

interface CabeceraCatalogoProps {
  activeStep: PasoTienda;
  selectedProduct: Product | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  cartItemCount: number;
  openCartDrawer: () => void;
  handleBackToCatalog: () => void;
  onToggleSaveProduct: () => void;
  isSavedOrFavorite: boolean;
}

export default function CabeceraCatalogo({
  activeStep,
  selectedProduct,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  cartItemCount,
  openCartDrawer,
  handleBackToCatalog,
  onToggleSaveProduct,
  isSavedOrFavorite,
}: CabeceraCatalogoProps) {
  // 1. Transparent Fixed Header for Product Detail View
  if (activeStep === "detail") {
    return (
      <header
        className="fixed top-0 left-0 right-0 md:left-60 lg:left-64 z-40 flex items-center justify-between px-3 sm:px-5 pb-2 bg-transparent border-0 pointer-events-none transition-all duration-200"
        style={{
          paddingTop: "0.5rem",
        }}
        id="product-detail-transparent-header"
      >
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBackToCatalog}
            className="w-10 h-10 rounded-full bg-transparent text-black flex items-center justify-center hover:scale-105 transition-all active:scale-95 pointer-events-auto cursor-pointer border-0 shadow-none outline-none"
            aria-label="Regresar al catálogo"
            id="detail-back-button"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleSaveProduct}
            className="w-10 h-10 rounded-full bg-transparent text-black flex items-center justify-center hover:scale-105 transition-all active:scale-95 pointer-events-auto cursor-pointer border-0 shadow-none outline-none"
            id="detail-save-trigger-btn"
            aria-label="Guardar producto"
            title={isSavedOrFavorite ? "Guardado" : "Guardar producto"}
          >
            <Bookmark
              className={`w-5 h-5 transition-all duration-200 ${
                isSavedOrFavorite
                  ? "fill-amber-500 text-amber-500 scale-105"
                  : "text-black"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative w-10 h-10 rounded-full bg-transparent text-black flex items-center justify-center hover:scale-105 transition-all active:scale-95 pointer-events-auto cursor-pointer border-0 shadow-none outline-none"
            id="detail-cart-trigger-btn"
            aria-label="Ver carrito"
          >
            <ShoppingCart className="w-5 h-5 text-black" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-extrabold font-mono text-[9px] sm:text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-none">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>
    );
  }

  // 2. Regular Shop Navigation Header (Catalog / Checkout / Thankyou)
  return (
    <header
      className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-2xs flex flex-col"
      style={{
        paddingTop: activeStep === "catalog" ? "4px" : "0.5rem",
      }}
    >
      {/* Top Bar: Navigation / Search / Cart */}
      <div
        className={`${
          activeStep === "catalog"
            ? "relative grid grid-cols-[1fr_minmax(0,28rem)_1fr]"
            : "flex justify-between"
        } relative items-center gap-3 bg-white px-3 sm:px-5 pb-1.5 sm:pb-2 w-full`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          {activeStep !== "catalog" && (
            <button
              type="button"
              onClick={handleBackToCatalog}
              className="p-1 sm:p-1.5 rounded-full hover:bg-slate-200 text-slate-600 transition-all cursor-pointer flex items-center justify-center pointer-events-auto"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs font-bold text-slate-700 ml-1">Regresar</span>
            </button>
          )}
        </div>

        {/* Center Search Bar */}
        {activeStep === "catalog" && (
          <div className="w-full max-w-md min-w-0 relative mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100 focus:bg-white border border-transparent focus:border-slate-200 rounded-full transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Cart Trigger Badge */}
        <div
          className={`flex items-center shrink-0 relative z-50 ${
            activeStep === "catalog" ? "justify-self-end" : "ml-auto"
          }`}
        >
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-md pointer-events-auto active:scale-95 flex items-center justify-center"
            id="cart-trigger-btn"
            aria-label={`Abrir carrito (${cartItemCount} productos)`}
            title="Ver carrito"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-extrabold font-mono text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Category Carousel */}
      {activeStep === "catalog" && (
        <CarruselCategorias
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}
    </header>
  );
}

export { CabeceraCatalogo };
