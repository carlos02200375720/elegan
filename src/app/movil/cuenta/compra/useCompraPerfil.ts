import { useCallback, useEffect, useMemo, useState } from "react";
import { Order, User } from "../../tipos";
import { apiFetch } from "../../../../config";
import { androidApiFetch } from "../../api";

export interface CompraPerfilProps {
  orders?: Order[];
  activeUser?: User;
  currentUser?: User;
  socket?: WebSocket | null;
}

export function useCompraPerfil({
  orders: initialOrders = [],
  activeUser,
  currentUser,
  socket,
}: CompraPerfilProps) {
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const effectiveUser = activeUser || currentUser;
  const isSelf = Boolean(
    !activeUser ||
    (currentUser && (
      activeUser.id === currentUser.id ||
      (activeUser.originalId && activeUser.originalId === currentUser.originalId) ||
      (activeUser.username && currentUser.username &&
        activeUser.username.toLowerCase() === currentUser.username.toLowerCase())
    ))
  );
  const targetUserId = effectiveUser?.originalId || effectiveUser?.id || "current_user";
  const targetUsername = effectiveUser?.username?.toLowerCase();
  const targetEmail = effectiveUser?.email?.toLowerCase();

  const loadLocalCachedOrders = useCallback((): Order[] => {
    if (typeof window === "undefined") return [];
    try {
      const keysToTry = [
        `mall_user_orders_${targetUserId}`,
        effectiveUser?.id ? `mall_user_orders_${effectiveUser.id}` : null,
        effectiveUser?.originalId ? `mall_user_orders_${effectiveUser.originalId}` : null,
        isSelf ? "mall_user_orders_current_user" : null,
        "mall_last_order",
      ].filter(Boolean) as string[];
      const found: Order[] = [];
      const seen = new Set<string>();

      for (const key of keysToTry) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const entries = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of entries) {
            if (item?.id && !seen.has(item.id)) {
              seen.add(item.id);
              found.push(item);
            }
          }
        } catch {}
      }
      return found;
    } catch {
      return [];
    }
  }, [targetUserId, effectiveUser, isSelf]);

  const fetchUserOrders = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      let ordersList: Order[] = [];
      const readOrders = async (response: Response) => {
        if (!response.ok) return [];
        const data = await response.json();
        if (!data || data.error) return [];
        if (Array.isArray(data.purchases)) return data.purchases;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.orders)) return data.orders;
        return [];
      };

      try {
        const response = await apiFetch(`/api/orders?userId=${encodeURIComponent(targetUserId)}`);
        ordersList = await readOrders(response);
      } catch (error) {
        console.warn("Could not fetch from /api/orders, trying android fallback:", error);
      }

      if (ordersList.length === 0) {
        try {
          const response = await androidApiFetch(`/orders?userId=${encodeURIComponent(targetUserId)}`);
          ordersList = await readOrders(response);
        } catch (error) {
          console.warn("Android orders fetch fallback also failed:", error);
        }
      }

      const combined = [...ordersList, ...loadLocalCachedOrders()];
      const seen = new Set<string>();
      const deduplicated = combined.filter((order) => {
        if (!order?.id || seen.has(order.id)) return false;
        seen.add(order.id);
        return true;
      });
      deduplicated.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setFetchedOrders(deduplicated);

      if (typeof window !== "undefined" && deduplicated.length > 0) {
        try {
          localStorage.setItem(`mall_user_orders_${targetUserId}`, JSON.stringify(deduplicated));
        } catch {}
      }
    } catch (error) {
      console.error("Error in fetchUserOrders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, loadLocalCachedOrders]);

  useEffect(() => {
    const cached = loadLocalCachedOrders();
    if (cached.length) setFetchedOrders(cached);
    void fetchUserOrders();
  }, [fetchUserOrders, loadLocalCachedOrders]);

  useEffect(() => {
    const handleOrderCreated = (event: Event) => {
      const order = (event as CustomEvent<Order>).detail;
      if (!order?.id) return;
      setFetchedOrders((previous) =>
        previous.some((item) => item.id === order.id) ? previous : [order, ...previous]
      );
    };
    window.addEventListener("mall_order_created", handleOrderCreated);
    window.addEventListener("order_created", handleOrderCreated);
    return () => {
      window.removeEventListener("mall_order_created", handleOrderCreated);
      window.removeEventListener("order_created", handleOrderCreated);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "new_order" || !data.order) return;
        const order: Order = data.order;
        const matches =
          order.buyerId === targetUserId ||
          (effectiveUser?.id && order.buyerId === effectiveUser.id) ||
          (effectiveUser?.originalId && order.buyerId === effectiveUser.originalId) ||
          (targetUsername && order.buyerUsername?.toLowerCase() === targetUsername) ||
          (targetEmail && order.buyerEmail?.toLowerCase() === targetEmail);
        if (!matches) return;
        setFetchedOrders((previous) =>
          previous.some((item) => item.id === order.id) ? previous : [order, ...previous]
        );
      } catch {}
    };
    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, targetUserId, effectiveUser, targetUsername, targetEmail]);

  const userOrders = useMemo(() => {
    const validBuyerIds = [
      targetUserId, effectiveUser?.id, effectiveUser?.originalId,
      currentUser?.id, currentUser?.originalId,
      isSelf ? "current_user" : null, isSelf ? "user_guest" : null,
    ].filter(Boolean) as string[];
    const seen = new Set<string>();
    const filtered: Order[] = [];

    for (const order of [...initialOrders, ...fetchedOrders]) {
      if (!order?.id || seen.has(order.id)) continue;
      const buyerId = order.buyerId || "";
      const buyerUsername = (order as any).buyerUsername?.toLowerCase();
      const buyerEmail = order.buyerEmail?.toLowerCase();
      const matches =
        validBuyerIds.includes(buyerId) ||
        Boolean(targetUsername && buyerUsername === targetUsername) ||
        Boolean(targetEmail && buyerEmail === targetEmail) ||
        Boolean(isSelf && (buyerId === "current_user" || !buyerId));
      if (matches) {
        seen.add(order.id);
        filtered.push(order);
      }
    }
    return filtered.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [initialOrders, fetchedOrders, targetUserId, effectiveUser, currentUser, isSelf, targetUsername, targetEmail]);

  const totalSpent = useMemo(
    () => userOrders.reduce((total, order) => total + (order.total || 0), 0),
    [userOrders]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedOrderId((current) => current === id ? null : id);
  }, []);

  return {
    userOrders, totalSpent, isLoading, fetchUserOrders, expandedOrderId,
    toggleExpand, effectiveUser, isSelf,
  };
}
