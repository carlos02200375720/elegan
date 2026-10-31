import React, { useState, useMemo } from "react";
import {
  Edit3,
  Truck,
  X,
  Loader2,
  CheckCircle2,
  Building2,
  CreditCard,
  Eye,
  AlertTriangle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order } from "../../types";
import { apiFetch } from "../../config";

export interface PedidosAdminProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
  onRequestEditOrder?: (order: Order) => void;
}

export default function PedidosAdminView({
  orders,
  setOrders,
  onStatusMessage,
  onRequestEditOrder,
}: PedidosAdminProps) {
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [localEditingOrder, setLocalEditingOrder] = useState<Order | null>(null);
  const [orderNewStatus, setOrderNewStatus] = useState<string>("processing");
  const [orderNewCarrier, setOrderNewCarrier] = useState<string>("");
  const [orderNewTracking, setOrderNewTracking] = useState<string>("");
  const [orderNewNotes, setOrderNewNotes] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Comprobante inspection modal states
  const [inspectingReceiptOrder, setInspectingReceiptOrder] = useState<Order | null>(null);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [isVerifyingPaymentId, setIsVerifyingPaymentId] = useState<string | null>(null);

  const notify = (msg: { type: "success" | "error" | "info"; text: string }) => {
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
      notify({
        type: "error",
        text: err.message || "Error al actualizar pedido",
      });
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
        if (inspectingReceiptOrder && inspectingReceiptOrder.id === order.id) {
          setInspectingReceiptOrder(data.order);
        }
        notify({
          type: "success",
          text: makeVerified
            ? `Comprobante de pedido #${order.id} validado y pago confirmado.`
            : `Comprobante de pedido #${order.id} marcado como pendiente.`,
        });
      } else {
        // Optimistic update fallback
        const updated = {
          ...order,
          receiptVerified: makeVerified,
          paymentStatus: makeVerified ? ("paid" as const) : ("pending" as const),
        };
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
        if (inspectingReceiptOrder && inspectingReceiptOrder.id === order.id) {
          setInspectingReceiptOrder(updated);
        }
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

  return (
    <div
      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
      id="admin-tab-content-orders"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Control de Pedidos y Logística</h2>
          <p className="text-xs text-slate-500">
            Historial de compras, verificación de comprobantes de pago bancarios y gestión de envíos.
          </p>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: "all", label: "Todos" },
            { id: "transferencias", label: "Transferencias" },
            { id: "pending", label: "Pendientes" },
            { id: "processing", label: "Preparando" },
            { id: "shipped", label: "Despachados" },
            { id: "delivered", label: "Entregados" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setOrderStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                orderStatusFilter === item.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No hay pedidos en la categoría seleccionada.
          </div>
        ) : (
          filteredOrders.map((order, oIdx) => {
            const isTransferOrder =
              order.paymentMethod === "transferencia" ||
              Boolean(order.paymentReceiptUrl) ||
              order.id.startsWith("transferencia_") ||
              (order.paypalOrderId && order.paypalOrderId.startsWith("transferencia"));

            const isContraEntrega =
              order.paymentMethod === "contra_entrega" ||
              order.id.startsWith("contra_entrega_") ||
              (order.paypalOrderId && order.paypalOrderId.startsWith("contra_entrega"));

            const isCardOrPaypal = !isTransferOrder && !isContraEntrega;

            return (
              <div
                key={`${order.id || "order"}-${oIdx}`}
                className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white hover:border-slate-300 transition-all flex flex-col space-y-4 shadow-2xs"
              >
                {/* Header row: Order ID, Date, Payment Method and Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      Pedido #{order.id}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                    </span>

                    {/* Method Tag */}
                    {isTransferOrder ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-700" />
                        <span>Transferencia bancaria</span>
                      </span>
                    ) : isContraEntrega ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-600" />
                        <span>Contra entrega</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-blue-600" />
                        <span>Tarjeta / PayPal</span>
                      </span>
                    )}

                    {/* Verification Status Tag for Transfers */}
                    {isTransferOrder && (
                      order.receiptVerified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Pago Verificado</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Por verificar</span>
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "shipped"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status || "processing"}
                    </span>
                    <button
                      onClick={() => {
                        if (onRequestEditOrder) {
                          onRequestEditOrder(order);
                        } else {
                          setLocalEditingOrder(order);
                          setOrderNewStatus(order.status || "processing");
                          setOrderNewCarrier(order.carrier || "");
                          setOrderNewTracking(order.trackingNumber || "");
                          setOrderNewNotes(order.sellerNotes || "");
                        }
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Actualizar Envío</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Buyer Details */}
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase font-mono">
                      Comprador
                    </p>
                    <p className="font-bold text-slate-900 mt-1">{order.buyerName || "Cliente"}</p>
                    <p className="font-mono text-slate-500 text-[11px]">
                      @{order.buyerUsername || "anon"}
                    </p>
                    <p className="text-slate-500 text-[11px]">{order.buyerEmail}</p>
                    {order.buyerPhone && (
                      <p className="text-slate-600 text-[11px] font-mono mt-0.5">
                        Tel: {order.buyerPhone}
                      </p>
                    )}
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase font-mono">
                      Dirección y Envío
                    </p>
                    <p className="text-slate-700 mt-1 line-clamp-2">
                      {order.shippingAddress || "Dirección predeterminada"}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Paquetería:{" "}
                      <span className="font-bold text-slate-800">
                        {order.carrier || "Sin asignar"}
                      </span>
                    </p>
                    {order.trackingNumber && (
                      <p className="text-[11px] font-mono text-indigo-600 font-bold">
                        Guía: {order.trackingNumber}
                      </p>
                    )}
                  </div>

                  {/* Total & Items */}
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase font-mono">
                      Resumen de Pago
                    </p>
                    <p className="text-base font-black text-emerald-600 mt-1 font-mono">
                      ${Number(order.total).toFixed(2)} USD
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {order.items?.length || 0} producto(s) en total
                    </p>
                    {isTransferOrder && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Estado pago:{" "}
                        <span
                          className={`font-bold ${
                            order.receiptVerified ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {order.receiptVerified ? "Aprobado / Real" : "Esperando validación"}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* COMPROBANTE DE PAGO BANCARIO (IMAGEN CARGADA POR EL CLIENTE) */}
                {isTransferOrder && (
                  <div className="mt-2 pt-3 border-t border-slate-100 bg-amber-500/5 rounded-2xl p-3.5 border border-amber-200/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block">
                            Comprobante de Pago Subido por el Cliente
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Revisa la imagen del depósito bancario para verificar que el pago fue real
                          </span>
                        </div>
                      </div>

                      {/* Botón de acción rápida: Validar o Marcar como Pendiente */}
                      <button
                        type="button"
                        onClick={() => handleToggleVerifyReceipt(order, !order.receiptVerified)}
                        disabled={isVerifyingPaymentId === order.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          order.receiptVerified
                            ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {isVerifyingPaymentId === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : order.receiptVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {order.receiptVerified
                            ? "Marcar como pendiente"
                            : "Aprobar y marcar pago como real"}
                        </span>
                      </button>
                    </div>

                    {order.paymentReceiptUrl ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-amber-200/60 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Miniatura clickeable con hover eye */}
                          <div
                            onClick={() => openReceiptModal(order)}
                            className="relative group cursor-pointer w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-900"
                            title="Haz clic para ver el comprobante en grande"
                          >
                            <img
                              src={order.paymentReceiptUrl}
                              alt="Comprobante bancario"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-5 h-5" />
                            </div>
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs">
                              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                {order.receiptFileName || "foto_comprobante.jpg"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Monto a corroborar:{" "}
                              <span className="font-bold text-slate-900 font-mono">
                                ${Number(order.total).toFixed(2)} USD
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Toca la imagen para inspeccionar fecha, cuenta de destino y número de transacción.
                            </p>
                          </div>
                        </div>

                        {/* Botones de inspección y descarga */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openReceiptModal(order)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Ver en pantalla completa</span>
                          </button>
                          <a
                            href={order.paymentReceiptUrl}
                            download={order.receiptFileName || `comprobante_${order.id}.jpg`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar imagen</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Este pedido fue seleccionado con Transferencia pero aún no se ha recibido la foto del comprobante.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL LIGHTBOX PARA INSPECCIONAR COMPROBANTE EN PANTALLA COMPLETA */}
      <AnimatePresence>
        {inspectingReceiptOrder && inspectingReceiptOrder.paymentReceiptUrl && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col p-3 sm:p-5 select-none animate-in fade-in">
            {/* Top Bar */}
            <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-white shrink-0 shadow-2xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">
                    Inspección de Comprobante • Pedido #{inspectingReceiptOrder.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Cliente:{" "}
                    <span className="font-bold text-white">
                      {inspectingReceiptOrder.buyerName || "Cliente"}
                    </span>{" "}
                    • Monto exacto:{" "}
                    <span className="font-bold font-mono text-amber-400">
                      ${Number(inspectingReceiptOrder.total).toFixed(2)} USD
                    </span>
                  </p>
                </div>
              </div>

              {/* Controls: Zoom, Rotate, Verify, Close */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setImageZoom((prev) => Math.min(prev + 0.25, 3))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Acercar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageZoom((prev) => Math.max(prev - 0.25, 0.5))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Alejar (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Girar 90 grados"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div className="h-6 w-px bg-slate-700 mx-1" />

                {/* Botón de aprobación rápida dentro del visor */}
                <button
                  type="button"
                  onClick={() =>
                    handleToggleVerifyReceipt(
                      inspectingReceiptOrder,
                      !inspectingReceiptOrder.receiptVerified
                    )
                  }
                  disabled={isVerifyingPaymentId === inspectingReceiptOrder.id}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                    inspectingReceiptOrder.receiptVerified
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isVerifyingPaymentId === inspectingReceiptOrder.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : inspectingReceiptOrder.receiptVerified ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {inspectingReceiptOrder.receiptVerified
                      ? "Verificado (clic para deshacer)"
                      : "Aprobar pago como real"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectingReceiptOrder(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer ml-1"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Interactive Image Viewport */}
            <div className="flex-1 w-full max-w-5xl mx-auto my-3 overflow-auto flex items-center justify-center p-2 rounded-2xl bg-black/40 border border-slate-800/80">
              <div className="relative max-w-full max-h-full flex items-center justify-center">
                <img
                  src={inspectingReceiptOrder.paymentReceiptUrl}
                  alt="Comprobante en detalle"
                  style={{
                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                    transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                />
              </div>
            </div>

            {/* Bottom Footer Info Bar */}
            <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Archivo: {inspectingReceiptOrder.receiptFileName || "foto_comprobante.jpg"}
                </span>
                <span className="text-[11px] text-slate-400">
                  Zoom: {Math.round(imageZoom * 100)}%
                </span>
                {imageRotation > 0 && (
                  <span className="text-[11px] text-slate-400">
                    Rotación: {imageRotation}°
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={inspectingReceiptOrder.paymentReceiptUrl}
                  download={
                    inspectingReceiptOrder.receiptFileName ||
                    `comprobante_${inspectingReceiptOrder.id}.jpg`
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar imagen original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setInspectingReceiptOrder(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Fallback Modal for Updating Order Tracking & Status when used standalone */}
      <AnimatePresence>
        {localEditingOrder && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900">
                    Actualizar Pedido #{localEditingOrder.id}
                  </h3>
                </div>
                <button
                  onClick={() => setLocalEditingOrder(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Si tiene comprobante bancario, mostrar aviso y acceso directo */}
              {localEditingOrder.paymentReceiptUrl && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={localEditingOrder.paymentReceiptUrl}
                      alt="Comprobante"
                      className="w-10 h-10 rounded-lg object-cover border border-amber-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-black text-slate-900 block truncate">
                        Comprobante de Transferencia
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          localEditingOrder.receiptVerified
                            ? "text-emerald-700"
                            : "text-amber-800"
                        }`}
                      >
                        {localEditingOrder.receiptVerified
                          ? "Pago validado"
                          : "Pendiente de validación"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openReceiptModal(localEditingOrder)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ver</span>
                  </button>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado del Pedido</label>
                  <select
                    value={orderNewStatus}
                    onChange={(e) => setOrderNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">Pendiente de preparación</option>
                    <option value="processing">En preparación por el vendedor</option>
                    <option value="shipped">Despachado / En tránsito</option>
                    <option value="delivered">Entregado al comprador</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Empresa de Paquetería / Courier
                  </label>
                  <input
                    type="text"
                    value={orderNewCarrier}
                    onChange={(e) => setOrderNewCarrier(e.target.value)}
                    placeholder="Ej. DHL Express, Caribe Tours, Metro Pac, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de Guía / Código de Rastreo
                  </label>
                  <input
                    type="text"
                    value={orderNewTracking}
                    onChange={(e) => setOrderNewTracking(e.target.value)}
                    placeholder="Ej. DHL-984729184"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Notas para el Comprador
                  </label>
                  <textarea
                    value={orderNewNotes}
                    onChange={(e) => setOrderNewNotes(e.target.value)}
                    rows={2}
                    placeholder="Indicaciones adicionales de entrega..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setLocalEditingOrder(null)}
                  disabled={isUpdatingOrder}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLocalOrderUpdate}
                  disabled={isUpdatingOrder}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {isUpdatingOrder ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isUpdatingOrder ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
