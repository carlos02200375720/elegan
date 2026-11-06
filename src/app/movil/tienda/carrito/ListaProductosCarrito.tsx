import React from "react";
import { Check } from "lucide-react";
import { Product, CartItem } from "../../tipos";
import { TarjetaProductoCarrito } from "./TarjetaProductoCarrito";

export interface ListaProductosCarritoProps {
  cart: CartItem[];
  selectedCartIndices: number[];
  isAllCartSelected: boolean;
  toggleSelectAllCart: () => void;
  toggleSelectCartItem: (idx: number) => void;
  handleItemRemove: (idx: number, item: CartItem) => void;
  handleItemQtyChange: (idx: number, item: CartItem, newQty: number) => void;
  onSelectProduct: (product: Product) => void;
}

export const ListaProductosCarrito: React.FC<ListaProductosCarritoProps> = ({
  cart,
  selectedCartIndices,
  isAllCartSelected,
  toggleSelectAllCart,
  toggleSelectCartItem,
  handleItemRemove,
  handleItemQtyChange,
  onSelectProduct,
}) => {
  return (
    <>
      {/* Select all bar */}
      <div className="flex items-center justify-between pb-1 px-1" id="android-cart-select-all-bar">
        <button
          type="button"
          onClick={toggleSelectAllCart}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors cursor-pointer select-none"
        >
          <div
            className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
              isAllCartSelected
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : selectedCartIndices.length > 0
                ? "bg-amber-200 text-amber-900"
                : "border-2 border-slate-300 bg-white"
            }`}
          >
            {isAllCartSelected ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : selectedCartIndices.length > 0 ? (
              <div className="w-1.5 h-1.5 bg-amber-900 rounded-xs" />
            ) : null}
          </div>
          <span>
            {isAllCartSelected ? "Deseleccionar todo" : "Seleccionar todo"} ({selectedCartIndices.length}/{cart.length})
          </span>
        </button>

        <span className="text-[11px] font-bold text-amber-700">
          {selectedCartIndices.length} para pagar
        </span>
      </div>

      {/* Product Items List */}
      {cart.map((item, idx) => {
        const isSelected = selectedCartIndices.includes(idx);
        return (
          <TarjetaProductoCarrito
            key={`${item.product.id}-${idx}`}
            idx={idx}
            item={item}
            isSelected={isSelected}
            toggleSelectCartItem={toggleSelectCartItem}
            handleItemRemove={handleItemRemove}
            handleItemQtyChange={handleItemQtyChange}
            onSelectProduct={onSelectProduct}
          />
        );
      })}
    </>
  );
};

export default ListaProductosCarrito;
