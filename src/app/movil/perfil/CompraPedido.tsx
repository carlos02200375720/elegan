import { ChevronDown, ChevronUp, MapPin, Package, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Order } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import { getStatusBadge } from "./EstadoPedido";

interface CompraPedidoProps {
  order: Order;
  index: number;
  expanded: boolean;
  onToggle: (id: string) => void;
}

function formatOrderDate(value?: string) {
  if (!value) return "Reciente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Reciente";
  return date.toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getOrderNumber(id: string | undefined, index: number) {
  if (!id) return `ORD-${index + 1}`;
  if (id.startsWith("ord_android_")) return id.replace("ord_android_", "ORD-");
  if (id.startsWith("ord_")) return id.slice(4, 12).toUpperCase();
  return id.slice(0, 8).toUpperCase();
}

function CompraPedido({ order, index, expanded, onToggle }: CompraPedidoProps) {
  const status = getStatusBadge(order.status);
  const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || order.items?.length || 1;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-amber-300">
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0"><ShoppingBag className="w-4 h-4" /></span>
            <div className="min-w-0">
              <span className="font-black text-slate-900 text-xs truncate">Pedido #{getOrderNumber(order.id, index)}</span>
              <p className="text-[10px] text-slate-400">{formatOrderDate(order.createdAt)}</p>
            </div>
          </div>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border shrink-0 ${status.bg}`}>
            {status.icon}<span>{status.label}</span>
          </span>
        </div>

        {!!order.items?.length && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            {order.items.map((item, itemIndex) => {
              const data = item as any;
              const quantity = data.quantity || 1;
              const image = data.productImage || data.imageUrl || data.product?.imageUrl || data.product?.image;
              const name = data.productName || data.name || data.product?.name || "Producto de la tienda";
              const price = data.price || data.product?.price || 0;
              return (
                <div key={`${order.id}-${data.productId || data.product?.id || "item"}-${itemIndex}`} className="flex items-center justify-between gap-2.5 py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Package className="w-5 h-5" /></div>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                      <p className="text-[11px] text-slate-500">Cant: <span className="font-semibold text-slate-700">{quantity}</span> × {formatPrice(price)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800 shrink-0">{formatPrice(price * quantity)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button type="button" onClick={() => onToggle(order.id)} className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer transition-colors">
            <span>{expanded ? "Ocultar detalles" : "Ver detalles"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-slate-400">Total pagado:</span>
            <span className="font-black text-amber-600 text-sm">{formatPrice(order.total || 0)}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-2 bg-slate-50/70 border-t border-slate-100 text-xs space-y-2.5">
          {(order.shippingAddress || (order as any).buyerShippingAddress) && (
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dirección de Entrega</p>
                <p className="text-xs text-slate-700 font-medium">{order.shippingAddress || (order as any).buyerShippingAddress}</p>
              </div>
            </div>
          )}
          {order.trackingNumber && (
            <div className="flex items-start gap-2 text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              <Truck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Guía de Envío ({order.carrier || "Mensajería"})</p>
                <p className="text-xs font-mono font-bold text-slate-800">{order.trackingNumber}</p>
                {order.estimatedDelivery && <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Entrega estimada: {order.estimatedDelivery}</p>}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1 text-emerald-700 font-medium"><ShieldCheck className="w-3.5 h-3.5" /><span>Pago confirmado</span></span>
            <span className="text-slate-400">{itemsCount} {itemsCount === 1 ? "artículo" : "artículos"}</span>
          </div>
        </div>
      )}
    </article>
  );
}

export default CompraPedido;
