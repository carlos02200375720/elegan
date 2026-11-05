import React from "react";
import { Check } from "lucide-react";

interface Props {
  mensaje: { type: "success" | "error"; text: string } | null;
}

export default function EstadoConfiguracion({ mensaje }: Props) {
  if (!mensaje) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${mensaje.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
      {mensaje.type === "success" && <Check className="w-4 h-4 text-emerald-600" />}
      <span>{mensaje.text}</span>
    </div>
  );
}
