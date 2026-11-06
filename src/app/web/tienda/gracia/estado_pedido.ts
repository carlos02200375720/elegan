import { useEffect, useState } from "react";
import { Order } from "../../../../types";
import { apiFetch } from "../../../../config";

export function useEstadoPedido(completedOrder: Order | null, orderId?: string) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(completedOrder);
  const [isLoading, setIsLoading] = useState<boolean>(!completedOrder && Boolean(orderId));
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (completedOrder) {
      setActiveOrder(completedOrder);
      setIsLoading(false);
    }
  }, [completedOrder]);

  useEffect(() => {
    if (!completedOrder && orderId) {
      setIsLoading(true);
      apiFetch(`/api/orders/${encodeURIComponent(orderId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.id) {
            setActiveOrder(data);
          }
        })
        .catch((err) => console.warn("Error fetching order in GraciaView:", err))
        .finally(() => setIsLoading(false));
    }
  }, [orderId, completedOrder]);

  const itemsSubtotal = (activeOrder?.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const selectedShippingCost =
    activeOrder?.shippingCost !== undefined
      ? activeOrder.shippingCost
      : activeOrder
      ? Math.max(0, activeOrder.total - itemsSubtotal)
      : 0;

  const selectedCarrier =
    activeOrder?.carrier ||
    activeOrder?.items?.find((it) => it.carrier)?.carrier ||
    "";

  const handleCopyOrderId = () => {
    if (!activeOrder?.id) return;
    navigator.clipboard.writeText(activeOrder.id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  return { activeOrder, setActiveOrder, isLoading, copiedId, itemsSubtotal, selectedShippingCost, selectedCarrier, handleCopyOrderId };
}
