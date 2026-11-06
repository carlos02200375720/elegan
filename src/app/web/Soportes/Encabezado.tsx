import { X, ArrowLeft, Headphones } from "lucide-react";
import { SUPPORT_EMAIL } from "../../../utils/supportChat";

export default function EncabezadoSoporte({ props }: { props: any }) {
  const { isAdmin, activeChatUser, onSelectChatUser, onClose } = props;
  return (
      <header
        className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs z-20"
        style={{ paddingTop: "max(0.75rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))" }}
      >
        <div className="flex items-center space-x-3">
          {/* Back button on mobile when a chat is open */}
          {activeChatUser && (
            <button
              type="button"
              onClick={() => onSelectChatUser(null)}
              className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Volver a la lista de chats"
              aria-label="Volver a la lista de chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-sm shrink-0">
            <Headphones className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">
                {isAdmin ? "Bandeja de Soporte al Cliente" : "Soporte al Cliente"}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {isAdmin ? "Admin" : "Oficial"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">
              {isAdmin
                ? `Atendiendo como Administrador (${SUPPORT_EMAIL})`
                : `Canal oficial de atención • ${SUPPORT_EMAIL}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>En Línea</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Cerrar panel de mensajes"
            aria-label="Cerrar panel de mensajes"
            id="btn-close-support-panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>
  );
}
