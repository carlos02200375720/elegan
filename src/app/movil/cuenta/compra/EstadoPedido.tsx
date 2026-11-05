import { CheckCircle2, Clock, Truck } from "lucide-react";

export function getStatusBadge(status?: string) {
  const value = (status || "").toLowerCase().trim();
  if (["completado", "entregado", "delivered", "completed"].includes(value)) return { label: "Entregado", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> };
  if (["enviado", "en camino", "shipped"].includes(value)) return { label: "En camino", bg: "bg-sky-50 text-sky-800 border-sky-200", icon: <Truck className="w-3.5 h-3.5 text-sky-600" /> };
  if (["cancelado", "cancelled"].includes(value)) return { label: "Cancelado", bg: "bg-rose-50 text-rose-800 border-rose-200", icon: <Clock className="w-3.5 h-3.5 text-rose-600" /> };
  return { label: status || "En proceso", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: <Clock className="w-3.5 h-3.5 text-amber-600" /> };
}
