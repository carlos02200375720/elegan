import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Truck,
  RotateCw,
  MapPin,
  ChevronDown,
  ChevronUp,
  Receipt,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Order, User, Product } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import { navigateTo } from "../../../router";
import { apiFetch } from "../../../config";
import { androidApiFetch } from "../api";

export interface CompraPerfilProps {
  orders?: Order[];
  activeUser?: User;
  currentUser?: User;
  socket?: WebSocket | null;
  onSelectProduct?: (product: Product) => void;
}

export function CompraPerfilView({
  orders: initialOrders = [],
  activeUser,
  currentUser,
  socket,
  onSelectProduct,
}: CompraPerfilProps) {
  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Identify targeted user
  const effectiveUser = activeUser || currentUser;
  const isSelf = Boolean(
    !activeUser ||
    (currentUser && (
      activeUser.id === currentUser.id ||
      (activeUser.originalId && activeUser.originalId === currentUser.originalId) ||
      (activeUser.username && currentUser.username && activeUser.username.toLowerCase() === currentUser.username.toLowerCase())
    ))
  );

  const targetUserId = effectiveUser?.originalId || effectiveUser?.id || "current_user";
  const targetUsername = effectiveUser?.username?.toLowerCase();
  const targetEmail = effectiveUser?.email?.toLowerCase();

  // Load cached orders from localStorage for instant display
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

      const foundOrders: Order[] = [];
      const seenIds = new Set<string>();

      for (const key of keysToTry) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item?.id && !seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  foundOrders.push(item);
                }
              }
            } else if (parsed?.id && !seenIds.has(parsed.id)) {
              seenIds.add(parsed.id);
              foundOrders.push(parsed);
            }
          } catch {}
        }
      }
      return foundOrders;
    } catch {
      return [];
    }
  }, [targetUserId, effectiveUser, isSelf]);

  // Fetch orders from API
  const fetchUserOrders = useCallback(async () => {
    if (!targetUserId) return;
    setIsLoading(true);
    try {
      // 1. First attempt: standard /api/orders endpoint with userId query
      let ordersList: Order[] = [];
      try {
        const res = await apiFetch(`/api/orders?userId=${encodeURIComponent(targetUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            if (Array.isArray(data.purchases)) {
              ordersList = data.purchases;
            } else if (Array.isArray(data)) {
              ordersList = data;
            } else if (Array.isArray(data.orders)) {
              ordersList = data.orders;
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch from /api/orders, trying android fallback:", err);
      }

      // 2. Fallback attempt: /api/android/orders
      if (ordersList.length === 0) {
        try {
          const androidRes = await androidApiFetch(`/orders?userId=${encodeURIComponent(targetUserId)}`);
          if (androidRes.ok) {
            const data = await androidRes.json();
            if (data && !data.error) {
              if (Array.isArray(data.purchases)) {
                ordersList = data.purchases;
              } else if (Array.isArray(data)) {
                ordersList = data;
              } else if (Array.isArray(data.orders)) {
                ordersList = data.orders;
              }
            }
          }
        } catch (androidErr) {
          console.warn("Android orders fetch fallback also failed:", androidErr);
        }
      }

      // Merge with localStorage cached orders
      const localCached = loadLocalCachedOrders();
      const combined = [...ordersList, ...localCached];
      const deduplicated: Order[] = [];
      const seenIds = new Set<string>();

      for (const ord of combined) {
        if (!ord || !ord.id || seenIds.has(ord.id)) continue;
        seenIds.add(ord.id);
        deduplicated.push(ord);
      }

      // Sort by newest first
      deduplicated.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      setFetchedOrders(deduplicated);
      setLastUpdated(new Date());

      // Save latest orders to local storage for quick offline access
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

  // Initial fetch and cache load
  useEffect(() => {
    // Immediate populate from local cache
    const initialLocal = loadLocalCachedOrders();
    if (initialLocal.length > 0) {
      setFetchedOrders(initialLocal);
    }
    // Then query fresh data from server
    fetchUserOrders();
  }, [fetchUserOrders, loadLocalCachedOrders]);

  // Listen to custom window events when an order is completed in store
  useEffect(() => {
    const handleOrderCreated = (event: Event) => {
      const customEvent = event as CustomEvent<Order>;
      const newOrder = customEvent.detail;
      if (newOrder && newOrder.id) {
        setFetchedOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });
      }
    };

    window.addEventListener("mall_order_created", handleOrderCreated);
    window.addEventListener("order_created", handleOrderCreated);

    return () => {
      window.removeEventListener("mall_order_created", handleOrderCreated);
      window.removeEventListener("order_created", handleOrderCreated);
    };
  }, []);

  // Listen to WebSocket broadcasts for new orders
  useEffect(() => {
    if (!socket) return;
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_order" && data.order) {
          const ord: Order = data.order;
          // Check if this new order belongs to target user
          const matches =
            ord.buyerId === targetUserId ||
            (effectiveUser?.id && ord.buyerId === effectiveUser.id) ||
            (effectiveUser?.originalId && ord.buyerId === effectiveUser.originalId) ||
            (targetUsername && ord.buyerUsername?.toLowerCase() === targetUsername) ||
            (targetEmail && ord.buyerEmail?.toLowerCase() === targetEmail);

          if (matches) {
            setFetchedOrders((prev) => {
              if (prev.some((o) => o.id === ord.id)) return prev;
              return [ord, ...prev];
            });
          }
        }
      } catch {}
    };

    socket.addEventListener("message", handleWsMessage);
    return () => {
      socket.removeEventListener("message", handleWsMessage);
    };
  }, [socket, targetUserId, effectiveUser, targetUsername, targetEmail]);

  // Combine initial props orders and fetched orders, then filter for this user
  const userOrders = useMemo(() => {
    const validBuyerIds = [
      targetUserId,
      effectiveUser?.id,
      effectiveUser?.originalId,
      currentUser?.id,
      currentUser?.originalId,
      isSelf ? "current_user" : null,
      isSelf ? "user_guest" : null,
    ].filter(Boolean) as string[];

    const pool = [...initialOrders, ...fetchedOrders];
    const seen = new Set<string>();
    const filtered: Order[] = [];

    for (const o of pool) {
      if (!o || !o.id || seen.has(o.id)) continue;

      const buyerId = o.buyerId || "";
      const buyerUsername = (o as any).buyerUsername?.toLowerCase();
      const buyerEmail = (o as any).buyerEmail?.toLowerCase();

      let isMatch = false;

      // 1. Match by ID
      if (validBuyerIds.includes(buyerId)) {
        isMatch = true;
      }
      // 2. Match by username
      if (targetUsername && buyerUsername && buyerUsername === targetUsername) {
        isMatch = true;
      }
      // 3. Match by email
      if (targetEmail && buyerEmail && buyerEmail === targetEmail) {
        isMatch = true;
      }
      // 4. If viewing own profile and order has no specific buyerId or is current_user
      if (isSelf && (buyerId === "current_user" || !buyerId)) {
        isMatch = true;
      }

      if (isMatch) {
        seen.add(o.id);
        filtered.push(o);
      }
    }

    // Sort descending by date
    filtered.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return filtered;
  }, [initialOrders, fetchedOrders, targetUserId, effectiveUser, currentUser, isSelf, targetUsername, targetEmail]);

  // Calculate totals
  const totalSpent = useMemo(() => {
    return userOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  }, [userOrders]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Reciente";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Reciente";
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Reciente";
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "completado" || s === "entregado" || s === "delivered" || s === "completed") {
      return {
        label: "Entregado",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      };
    }
    if (s === "enviado" || s === "en camino" || s === "shipped") {
      return {
        label: "En camino",
        bg: "bg-sky-50 text-sky-800 border-sky-200",
        icon: <Truck className="w-3.5 h-3.5 text-sky-600" />,
      };
    }
    if (s === "cancelado" || s === "cancelled") {
      return {
        label: "Cancelado",
        bg: "bg-rose-50 text-rose-800 border-rose-200",
        icon: <Clock className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    // Default processing/en preparación
    return {
      label: status || "En proceso",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    };
  };

  return (
    <div className="space-y-3 pb-8" id="android-profile-orders-section">
      {/* Top Header & Refresh Bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Historial de Compras</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            {userOrders.length === 1
              ? "1 compra registrada"
              : `${userOrders.length} compras registradas`}
            {userOrders.length > 0 && ` • Total: ${formatPrice(totalSpent)}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUserOrders()}
          disabled={isLoading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
          title="Actualizar historial de compras"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {/* Empty State */}
      {userOrders.length === 0 ? (
        <div className="py-14 px-4 text-center text-xs text-slate-400 flex flex-col items-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-amber-500 shadow-inner">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <p className="font-black text-slate-800 text-sm">
            {isSelf
              ? "No has realizado ningún pedido todavía"
              : `Sin compras registradas para @${effectiveUser?.username || "usuario"}`}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs text-center leading-relaxed">
            Todas las compras realizadas en la tienda por este usuario aparecerán aquí con su estado de entrega y comprobante.
          </p>

          <button
            type="button"
            onClick={() => navigateTo("/tienda/catalogo")}
            className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explorar la Tienda</span>
          </button>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3">
          {userOrders.map((ord, oIdx) => {
            const itemCount =
              ord.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ||
              ord.items?.length ||
              1;
            const badge = getStatusBadge(ord.status);
            const isExpanded = expandedOrderId === ord.id;
            const orderShortId = ord.id
              ? ord.id.startsWith("ord_android_")
                ? ord.id.replace("ord_android_", "ORD-")
                : ord.id.startsWith("ord_")
                ? ord.id.slice(4, 12).toUpperCase()
                : ord.id.slice(0, 8).toUpperCase()
              : `ORD-${oIdx + 1}`;

            return (
              <div
                key={`${ord.id || "order"}-${oIdx}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-amber-300"
              >
                {/* Order Card Header */}
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-xs truncate">
                            Pedido #{orderShortId}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(ord.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border shrink-0 ${badge.bg}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Purchased Items List Preview */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      {ord.items.map((it: any, itIdx: number) => {
                        const itemQty = it.quantity || 1;
                        const itemImg = it.productImage || it.imageUrl || it.product?.imageUrl || it.product?.image;
                        const itemName = it.productName || it.name || it.product?.name || "Producto de la tienda";
                        const itemPrice = it.price || it.product?.price || 0;

                        return (
                          <div
                            key={`ord-item-${it.productId || it.product?.id || itIdx}`}
                            className="flex items-center justify-between gap-2.5 py-1"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                {itemImg ? (
                                  <img
                                    src={itemImg}
                                    alt={itemName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {itemName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Cant: <span className="font-semibold text-slate-700">{itemQty}</span> × {formatPrice(itemPrice)}
                                </p>
                              </div>
                            </div>

                            <span className="text-xs font-black text-slate-800 shrink-0">
                              {formatPrice(itemPrice * itemQty)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary Bottom Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleExpand(ord.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? "Ocultar detalles" : "Ver detalles"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-slate-400">Total pagado:</span>
                      <span className="font-black text-amber-600 text-sm">
                        {formatPrice(ord.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Drawer */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 bg-slate-50/70 border-t border-slate-100 text-xs space-y-2.5">
                    {/* Shipping Address */}
                    {(ord.shippingAddress || (ord as any).buyerShippingAddress) && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Dirección de Entrega
                          </p>
                          <p className="text-xs text-slate-700 font-medium">
                            {ord.shippingAddress || (ord as any).buyerShippingAddress}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tracking Info if available */}
                    {ord.trackingNumber && (
                      <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        <Truck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Guía de Envío ({ord.carrier || "Mensajería"})
                          </p>
                          <p className="text-xs font-mono font-bold text-slate-800">
                            {ord.trackingNumber}
                          </p>
                          {ord.estimatedDelivery && (
                            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                              Entrega estimada: {ord.estimatedDelivery}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment & Security Badge */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Pago confirmado</span>
                      </span>
                      <span className="text-slate-400">
                        {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { CompraPerfilView as Compra };
export default CompraPerfilView;
