import React, { useRef, useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { AndroidCarritoProps } from "./TiposCarrito";
import { CarritoVacio } from "./CarritoVacio";
import { ListaProductosCarrito } from "./ListaProductosCarrito";
import { BarraCompraCarrito } from "./BarraCompraCarrito";

export function CarritoTiendaView({
  cart,
  selectedCartIndices,
  isAllCartSelected,
  toggleSelectAllCart,
  toggleSelectCartItem,
  selectedCartItems,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
  handleItemRemove,
  handleItemQtyChange,
  onSelectProduct,
  onProceedToCheckout,
  onCloseCart,
  onExploreProducts,
  presentation = "page",
}: AndroidCarritoProps) {
  const isDrawer = presentation === "drawer";
  const fixedFooterRef = useRef<HTMLDivElement | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(160);

  useEffect(() => {
    if (!fixedFooterRef.current) return;
    const updateHeight = () => {
      if (fixedFooterRef.current) {
        setFooterHeight(fixedFooterRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(fixedFooterRef.current);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [cart.length]);

  return (
    <div
      className={`w-full bg-white text-slate-900 flex flex-col font-sans select-none ${
        isDrawer ? "relative h-full min-h-0 overflow-hidden" : "min-h-screen"
      }`}
      id="android-cart-page"
    >
      {/* Cabecera superior del carrito */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 py-2 border-b border-slate-100 flex items-center justify-between"
        style={{ paddingTop: "max(8px, env(safe-area-inset-top, 0px))" }}
      >
        <button
          type="button"
          onClick={onCloseCart}
          className="p-1.5 rounded-full bg-slate-100 text-slate-900 active:scale-95 cursor-pointer hover:bg-slate-200 transition-colors"
          id="android-cart-back-btn"
          title="Volver"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xs font-black text-slate-900 tracking-tight">Carrito de Compras</h1>
        </div>
        <div className="w-7" />
      </div>

      {/* Lista de productos del carrito o estado vacío */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          paddingBottom: cart.length > 0 ? `${footerHeight + 5}px` : "2.5rem",
        }}
      >
        {cart.length === 0 ? (
          <CarritoVacio onExploreProducts={onExploreProducts} />
        ) : (
          <ListaProductosCarrito
            cart={cart}
            selectedCartIndices={selectedCartIndices}
            isAllCartSelected={isAllCartSelected}
            toggleSelectAllCart={toggleSelectAllCart}
            toggleSelectCartItem={toggleSelectCartItem}
            handleItemRemove={handleItemRemove}
            handleItemQtyChange={handleItemQtyChange}
            onSelectProduct={onSelectProduct}
          />
        )}
      </div>

      {/* Barra fija inferior de checkout */}
      {cart.length > 0 && (
        <BarraCompraCarrito
          isDrawer={isDrawer}
          selectedCartItemsCount={selectedCartItems.length}
          totalCartCount={cart.length}
          cartSubtotal={cartSubtotal}
          cartShippingTotal={cartShippingTotal}
          cartTotal={cartTotal}
          hasSelection={selectedCartIndices.length > 0}
          onProceedToCheckout={onProceedToCheckout}
          fixedFooterRef={fixedFooterRef}
        />
      )}
    </div>
  );
}

export default CarritoTiendaView;
