import React from "react";
import { Search, ExternalLink, Trash2 } from "lucide-react";
import { Product } from "../../../types";

interface Props {
  filteredProducts: Product[];
  productSearch: string;
  setProductSearch: (value: string) => void;
  onProductClick: (product: Product) => void;
  onRequestDeleteProduct?: (target: { type: "product"; id: string; name: string }) => void;
  setProductoEliminando: (value: { id: string; name: string } | null) => void;
}

export default function ListaProductos({
  filteredProducts, productSearch, setProductSearch, onProductClick,
  onRequestDeleteProduct, setProductoEliminando,
}: Props) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Catálogo de Productos</h2>
          <p className="text-xs text-slate-500">
            Supervisa artículos disponibles en la tienda oficial, existencias y precios.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Buscar por nombre o vendedor..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No hay productos que coincidan con la búsqueda.
          </div>
        ) : (
          filteredProducts.map((prod, pIdx) => (
            <div
              key={`${prod.id}-${pIdx}`}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="p-4 flex space-x-3">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{prod.name}</h4>
                  <p className="text-[11px] font-mono font-black text-emerald-600">
                    ${Number(prod.price).toFixed(2)} USD
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Vendedor:{" "}
                    <span className="font-semibold text-slate-600">
                      {prod.sellerName || "Oficial"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => onProductClick(prod)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Producto</span>
                </button>
                <button
                  onClick={() => {
                    if (onRequestDeleteProduct) {
                      onRequestDeleteProduct({
                        type: "product",
                        id: prod.id,
                        name: prod.name,
                      });
                    } else {
                      setProductoEliminando({
                        id: prod.id,
                        name: prod.name,
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>


    </>
  );
}
