import { AnimatePresence, motion } from "motion/react";
import type { CarritoTiendaViewProps } from "./tipos";
import { CabeceraCarrito } from "./cabecera";
import { ListaProductosCarrito } from "./lista_productos";
import { ResumenCompraCarrito } from "./resumen_compra";

export function CarritoTiendaView({
  showCartDrawer, closeCartDrawer, cart, cartItemCount, selectedCartIndices,
  isAllCartSelected, toggleSelectAllCart, toggleItemSelection, onRemoveFromCart,
  onUpdateCartQuantity, onSelectProductFromCart, selectedCartItems, cartSubtotal,
  cartShippingTotal, cartTotal, startCheckout,
}: CarritoTiendaViewProps) {
  return (
    <AnimatePresence>
      {showCartDrawer && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
            className="fixed inset-0 bg-black z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[100] border-l border-slate-200 flex flex-col justify-between"
          >
            <CabeceraCarrito
              closeCartDrawer={closeCartDrawer}
              cart={cart}
              cartItemCount={cartItemCount}
              selectedCartIndices={selectedCartIndices}
              isAllCartSelected={isAllCartSelected}
              toggleSelectAllCart={toggleSelectAllCart}
            />
            <ListaProductosCarrito
              cart={cart}
              selectedCartIndices={selectedCartIndices}
              toggleItemSelection={toggleItemSelection}
              onRemoveFromCart={onRemoveFromCart}
              onUpdateCartQuantity={onUpdateCartQuantity}
              onSelectProductFromCart={onSelectProductFromCart}
            />
            <ResumenCompraCarrito
              cart={cart}
              selectedCartItems={selectedCartItems}
              cartSubtotal={cartSubtotal}
              cartShippingTotal={cartShippingTotal}
              cartTotal={cartTotal}
              startCheckout={startCheckout}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const Carrito = CarritoTiendaView;
export default CarritoTiendaView;
