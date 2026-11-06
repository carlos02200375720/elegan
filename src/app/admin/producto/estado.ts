import React, { useMemo, useState } from "react";
import { Product } from "../../../types";
import { apiFetch } from "../../../config";

interface Mensaje {
  type: "success" | "error" | "info";
  text: string;
}

export function useEstadoProductos(
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
  onStatusMessage?: (msg: Mensaje | null) => void
) {
  const [productSearch, setProductSearch] = useState("");
  const [productoEliminando, setProductoEliminando] = useState<{ id: string; name: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const notify = (msg: Mensaje) => {
    if (onStatusMessage) {
      onStatusMessage(msg);
      setTimeout(() => onStatusMessage(null), 4000);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const onConfirmarEliminacion = async () => {
    if (!productoEliminando) return;
    setEliminando(true);
    try {
      const res = await apiFetch(`/api/products/${productoEliminando.id}`, { method: "DELETE" });
      if (res) {
        setProducts((prev) => prev.filter((p) => p.id !== productoEliminando.id));
        notify({
          type: "success",
          text: `Producto "${productoEliminando.name}" eliminado del catálogo.`,
        });
      }
    } catch (err: any) {
      console.error("Error deleting product in admin:", err);
      notify({
        type: "error",
        text: err.message || "Error al procesar la eliminación",
      });
    } finally {
      setEliminando(false);
      setProductoEliminando(null);
    }
  };

  return {
    productSearch, setProductSearch, filteredProducts,
    productoEliminando, setProductoEliminando, eliminando,
    onConfirmarEliminacion,
  };
}
