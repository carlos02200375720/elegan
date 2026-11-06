import React from "react";
import { Product } from "../tipos";

export interface ProductoAdminProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onProductClick: (product: Product) => void;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
  onRequestDeleteProduct?: (target: { type: "product"; id: string; name: string }) => void;
}
