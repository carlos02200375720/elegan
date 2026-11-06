import React from "react";
import { ArrowLeft, Headphones, ShieldCheck, X } from "lucide-react";
import { SUPPORT_EMAIL } from "./utilidades";

interface Props {
  isAdmin: boolean;
  isConversation?: boolean;
  chatName?: string;
  avatar?: string;
  onBack?: () => void;
  onClose: () => void;
}

const headerStyle = {
  backgroundColor: "#ffffff",
  paddingTop: "calc(max(24px, env(safe-area-inset-top, 24px)) + 8px)",
};

export default function EncabezadoSocialPanel({
  isAdmin,
  isConversation = false,
  chatName,
  avatar,
  onBack,
  onClose,
}: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 pb-3 bg-white border-b border-slate-100 shadow-2xs shrink-0" style={headerStyle}>
      {isConversation ? (
        <div className="flex items-center space-x-3 min-w-0">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 cursor-pointer" title="Volver" aria-label="Volver a mensajes">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative shrink-0">
            <img src={avatar || ""} alt={chatName || "Contacto"} className="w-9 h-9 rounded-full object-cover border border-amber-500/40 bg-white" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>{chatName}</span>
              {!isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
            </p>
            <p className="text-[10px] text-amber-600 font-mono font-medium truncate">{isAdmin ? chatName : SUPPORT_EMAIL}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Headphones className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-900">{isAdmin ? "Bandeja de Clientes" : "Mensajes y Soporte"}</h2>
        </div>
      )}

      {!isConversation && (
        <div className="flex items-center space-x-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">{isAdmin ? "Admin" : "Oficial"}</span>
        </div>
      )}
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors" title="Cerrar" aria-label={isConversation ? "Cerrar chat" : "Cerrar mensajes"}>
        <X className="w-5 h-5" />
      </button>
    </header>
  );
}
