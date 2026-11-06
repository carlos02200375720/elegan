import React from "react";
import {
  Edit3, Truck, Loader2, CheckCircle2, Building2, CreditCard,
  Eye, AlertTriangle, Download, ShieldCheck, FileCheck,
} from "lucide-react";
import { Order } from "../../../types";

interface Props {
  filteredOrders: Order[];
  orderStatusFilter: string;
  setOrderStatusFilter: (value: string) => void;
  onRequestEditOrder?: (order: Order) => void;
  setLocalEditingOrder: (order: Order | null) => void;
  setOrderNewStatus: (value: string) => void;
  setOrderNewCarrier: (value: string) => void;
  setOrderNewTracking: (value: string) => void;
  setOrderNewNotes: (value: string) => void;
  handleToggleVerifyReceipt: (order: Order, verified: boolean) => void;
  isVerifyingPaymentId: string | null;
  openReceiptModal: (order: Order) => void;
}

export default function ListaPedidos(props: Props) {
  const {
    filteredOrders, orderStatusFilter, setOrderStatusFilter,
    onRequestEditOrder, setLocalEditingOrder, setOrderNewStatus,
    setOrderNewCarrier, setOrderNewTracking, setOrderNewNotes,
    handleToggleVerifyReceipt, isVerifyingPaymentId, openReceiptModal,
  } = props;
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
    
        </div>
    
  );
}
