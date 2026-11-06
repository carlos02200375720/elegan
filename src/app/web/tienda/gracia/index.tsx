import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { GraciaTiendaViewProps } from "./tipos";
import { useEstadoPedido } from "./estado_pedido";
import { ProductosComprados } from "./productos_comprados";
import { DetallePedido } from "./detalle_pedido";
import { CuentaCreada } from "./cuenta_creada";
import { AccionesPedido } from "./acciones_pedido";

export function GraciaTiendaView({ completedOrder, orderId, onLoginSuccess, onContinueShopping, onViewOrderHistory }: GraciaTiendaViewProps) {
  const { activeOrder, isLoading, copiedId, itemsSubtotal, selectedShippingCost, selectedCarrier, handleCopyOrderId } = useEstadoPedido(completedOrder, orderId);
  return (
    <div className="w-full px-2 sm:px-4 py-2 pb-20 md:pb-6">
      <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-2xl text-center">
        <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-500 mx-auto animate-bounce" />
        <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 mt-3">¡Muchas Gracias por su Compra!</h2>
        <p className="text-xs text-slate-500 mt-1">El vendedor ha verificado la transacción correctamente.</p>
        {isLoading && <div className="py-8 text-center"><div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-xs text-slate-500 mt-2 font-medium">Cargando detalles de tu compra...</p></div>}
        <ProductosComprados activeOrder={activeOrder} />
        <DetallePedido activeOrder={activeOrder} itemsSubtotal={itemsSubtotal} selectedShippingCost={selectedShippingCost} selectedCarrier={selectedCarrier} copiedId={copiedId} handleCopyOrderId={handleCopyOrderId} />
        <CuentaCreada activeOrder={activeOrder} onLoginSuccess={onLoginSuccess} />
        <AccionesPedido onContinueShopping={onContinueShopping} onViewOrderHistory={onViewOrderHistory} />
      </motion.div>
    </div>
  );
}
export const Gracia = GraciaTiendaView;
export default GraciaTiendaView;
