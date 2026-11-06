import React, { useMemo, useState } from "react";
import { Order } from "../tipos";
import { apiFetch } from "../config";
import { MensajePedidos } from "./tipos";

export function useEstadoPedidos(
  orders: Order[],
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  onStatusMessage?: (msg: MensajePedidos | null) => void
) {
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [localEditingOrder, setLocalEditingOrder] = useState<Order | null>(null);
  const [orderNewStatus, setOrderNewStatus] = useState<string>("processing");
  const [orderNewCarrier, setOrderNewCarrier] = useState<string>("");
  const [orderNewTracking, setOrderNewTracking] = useState<string>("");
  const [orderNewNotes, setOrderNewNotes] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [inspectingReceiptOrder, setInspectingReceiptOrder] = useState<Order | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [isVerifyingPaymentId, setIsVerifyingPaymentId] = useState<string | null>(null);

  const notify = (msg: MensajePedidos) => {
    if (onStatusMessage) {
      onStatusMessage(msg);
      setTimeout(() => onStatusMessage(null), 4000);
    }
  };

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    if (orderStatusFilter === "transferencias") {
      return orders.filter(
        (o) =>
          o.paymentMethod === "transferencia" ||
          Boolean(o.paymentReceiptUrl) ||
          o.id.startsWith("transferencia_") ||
          (o.paypalOrderId && o.paypalOrderId.startsWith("transferencia"))
      );
    }
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const handleSaveLocalOrderUpdate = async () => {
    if (!localEditingOrder) return;
    setIsUpdatingOrder(true);
    try {
      const payload = {
        status: orderNewStatus,
        carrier: orderNewCarrier,
        trackingNumber: orderNewTracking,
        sellerNotes: orderNewNotes,
      };
      const res = await apiFetch(`/api/orders/${localEditingOrder.id}/update-tracking`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === localEditingOrder.id ? data.order : o)));
        notify({
          type: "success",
          text: `Pedido #${localEditingOrder.id} actualizado correctamente a "${orderNewStatus}".`,
        });
      }
      setLocalEditingOrder(null);
    } catch (err: any) {
      console.error("Error updating order:", err);
      notify({ type: "error", text: err.message || "Error al actualizar pedido" });
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleToggleVerifyReceipt = async (order: Order, makeVerified: boolean) => {
    setIsVerifyingPaymentId(order.id);
    try {
      const res = await apiFetch(`/api/orders/${order.id}/update-tracking`, {
        method: "POST",
        body: JSON.stringify({
          receiptVerified: makeVerified,
          paymentStatus: makeVerified ? "paid" : "pending",
          sellerNotes: order.sellerNotes
            ? order.sellerNotes
            : makeVerified
            ? "Comprobante de transferencia validado por administración."
            : "Comprobante marcado como pendiente de verificación.",
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (data && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
        setInspectingReceiptOrder((current) => current?.id === order.id ? data.order : current);
        notify({
          type: "success",
          text: makeVerified
            ? `Comprobante de pedido #${order.id} validado y pago confirmado.`
            : `Comprobante de pedido #${order.id} marcado como pendiente.`,
        });
      } else {
        const updated = {
          ...order,
          receiptVerified: makeVerified,
          paymentStatus: makeVerified ? ("paid" as const) : ("pending" as const),
        };
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
        setInspectingReceiptOrder((current) => current?.id === order.id ? updated : current);
        notify({
          type: "success",
          text: makeVerified
            ? `Pago validado correctamente para el pedido #${order.id}.`
            : `Pago marcado como pendiente para el pedido #${order.id}.`,
        });
      }
    } catch (err: any) {
      console.error("Error verifying payment receipt:", err);
      notify({
        type: "error",
        text: err.message || "No se pudo actualizar el estado de verificación.",
      });
    } finally {
      setIsVerifyingPaymentId(null);
    }
  };

  const openReceiptModal = (order: Order) => {
    setImageZoom(1);
    setImageRotation(0);
    setInspectingReceiptOrder(order);
  };

  return {
    orderStatusFilter, setOrderStatusFilter, filteredOrders,
    localEditingOrder, setLocalEditingOrder,
    orderNewStatus, setOrderNewStatus,
    orderNewCarrier, setOrderNewCarrier,
    orderNewTracking, setOrderNewTracking,
    orderNewNotes, setOrderNewNotes,
    isUpdatingOrder, inspectingReceiptOrder, setInspectingReceiptOrder,
    imageZoom, setImageZoom, imageRotation, setImageRotation,
    isVerifyingPaymentId, handleSaveLocalOrderUpdate,
    handleToggleVerifyReceipt, openReceiptModal,
  };
}
