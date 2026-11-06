import React from "react";
import { PedidosAdminProps } from "./pedidos/tipos";
import { useEstadoPedidos } from "./pedidos/estado";
import ListaPedidos from "./pedidos/lista_pedidos";
import VisorComprobante from "./pedidos/visor_comprobante";
import ModalActualizarPedido from "./pedidos/modal_actualizar";

export type { PedidosAdminProps } from "./pedidos/tipos";

export default function PedidosAdminView({
  orders, setOrders, onStatusMessage, onRequestEditOrder,
}: PedidosAdminProps) {
  const estado = useEstadoPedidos(orders, setOrders, onStatusMessage);
  return (
    <>
      <ListaPedidos
        filteredOrders={estado.filteredOrders}
        orderStatusFilter={estado.orderStatusFilter}
        setOrderStatusFilter={estado.setOrderStatusFilter}
        onRequestEditOrder={onRequestEditOrder}
        setLocalEditingOrder={estado.setLocalEditingOrder}
        setOrderNewStatus={estado.setOrderNewStatus}
        setOrderNewCarrier={estado.setOrderNewCarrier}
        setOrderNewTracking={estado.setOrderNewTracking}
        setOrderNewNotes={estado.setOrderNewNotes}
        handleToggleVerifyReceipt={estado.handleToggleVerifyReceipt}
        isVerifyingPaymentId={estado.isVerifyingPaymentId}
        openReceiptModal={estado.openReceiptModal}
      />
      <VisorComprobante
        order={estado.inspectingReceiptOrder}
        imageZoom={estado.imageZoom}
        setImageZoom={estado.setImageZoom}
        imageRotation={estado.imageRotation}
        setImageRotation={estado.setImageRotation}
        isVerifyingPaymentId={estado.isVerifyingPaymentId}
        handleToggleVerifyReceipt={estado.handleToggleVerifyReceipt}
        onClose={() => estado.setInspectingReceiptOrder(null)}
      />
      <ModalActualizarPedido
        order={estado.localEditingOrder}
        orderNewStatus={estado.orderNewStatus}
        setOrderNewStatus={estado.setOrderNewStatus}
        orderNewCarrier={estado.orderNewCarrier}
        setOrderNewCarrier={estado.setOrderNewCarrier}
        orderNewTracking={estado.orderNewTracking}
        setOrderNewTracking={estado.setOrderNewTracking}
        orderNewNotes={estado.orderNewNotes}
        setOrderNewNotes={estado.setOrderNewNotes}
        isUpdatingOrder={estado.isUpdatingOrder}
        handleSaveLocalOrderUpdate={estado.handleSaveLocalOrderUpdate}
        onClose={() => estado.setLocalEditingOrder(null)}
        openReceiptModal={estado.openReceiptModal}
      />
    </>
  );
}
