import React from "react";
import { ProductoAdminProps } from "./producto/tipos";
import { useEstadoProductos } from "./producto/estado";
import ListaProductos from "./producto/lista_productos";
import ModalEliminarProducto from "./producto/modal_eliminar";

export type { ProductoAdminProps } from "./producto/tipos";

export default function ProductoAdminView({
  products, setProducts, onProductClick, onStatusMessage, onRequestDeleteProduct,
}: ProductoAdminProps) {
  const estado = useEstadoProductos(products, setProducts, onStatusMessage);
  return (
    <div
      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
      id="admin-tab-content-products"
    >
      <ListaProductos
        filteredProducts={estado.filteredProducts}
        productSearch={estado.productSearch}
        setProductSearch={estado.setProductSearch}
        onProductClick={onProductClick}
        onRequestDeleteProduct={onRequestDeleteProduct}
        setProductoEliminando={estado.setProductoEliminando}
      />
      <ModalEliminarProducto
        productoEliminando={estado.productoEliminando}
        eliminando={estado.eliminando}
        onClose={() => estado.setProductoEliminando(null)}
        onConfirmarEliminacion={estado.onConfirmarEliminacion}
      />
    </div>
  );
}
