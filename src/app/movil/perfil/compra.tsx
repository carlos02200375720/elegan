import { Receipt, RotateCw, ShoppingBag } from "lucide-react";
import { Order, Product, User } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import { navigateTo } from "../../../router";
import CompraPedido from "./CompraPedido";
import { CompraPerfilProps, useCompraPerfil } from "./useCompraPerfil";

export type { CompraPerfilProps };

export function CompraPerfilView(props: CompraPerfilProps) {
  const {
    userOrders, totalSpent, isLoading, fetchUserOrders, expandedOrderId,
    toggleExpand, effectiveUser, isSelf,
  } = useCompraPerfil(props);

  return (
    <div className="space-y-3 pb-8" id="android-profile-orders-section">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Historial de Compras</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            {userOrders.length === 1 ? "1 compra registrada" : `${userOrders.length} compras registradas`}
            {userOrders.length > 0 && ` • Total: ${formatPrice(totalSpent)}`}
          </p>
        </div>
        <button type="button" onClick={() => void fetchUserOrders()} disabled={isLoading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
          title="Actualizar historial de compras">
          <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {userOrders.length === 0 ? (
        <div className="py-14 px-4 text-center text-xs text-slate-400 flex flex-col items-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-3 text-amber-500 shadow-inner"><ShoppingBag className="w-7 h-7" /></div>
          <p className="font-black text-slate-800 text-sm">{isSelf ? "No has realizado ningún pedido todavía" : `Sin compras registradas para ${effectiveUser?.name || "este cliente"}`}</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs text-center leading-relaxed">Todas las compras realizadas en la tienda por este usuario aparecerán aquí con su estado de entrega y comprobante.</p>
          <button type="button" onClick={() => navigateTo("/tienda/catalogo")}
            className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-transform flex items-center gap-2 cursor-pointer">
            <ShoppingBag className="w-4 h-4" /><span>Explorar la Tienda</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {userOrders.map((order, index) => (
            <CompraPedido key={order.id || index} order={order} index={index}
              expanded={expandedOrderId === order.id} onToggle={toggleExpand} />
          ))}
        </div>
      )}
    </div>
  );
}

export { CompraPerfilView as Compra };
export default CompraPerfilView;
