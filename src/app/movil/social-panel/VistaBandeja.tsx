import React from "react";
import { ShieldCheck } from "lucide-react";
import type { AdminClient } from "./TiposSocialPanel";
import type { User } from "../../../types";
import { SUPPORT_EMAIL, SUPPORT_USER_ID } from "../../../utils/supportChat";
import EncabezadoSocialPanel from "./EncabezadoSocialPanel";

interface Props {
  isAdmin: boolean;
  supportUser: User;
  clients: AdminClient[];
  clientUnreads: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectUser: (user: User) => void;
  onClearUnreads: (userId: string) => void;
  onClose: () => void;
}

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

export default function VistaBandeja({
  isAdmin,
  supportUser,
  clients,
  clientUnreads,
  searchQuery,
  onSearchChange,
  onSelectUser,
  onClearUnreads,
  onClose,
}: Props) {
  const openSupport = () => {
    onSelectUser(supportUser);
    onClearUnreads(supportUser.id);
    onClearUnreads(SUPPORT_USER_ID);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-slate-900 min-h-screen">
      <EncabezadoSocialPanel isAdmin={isAdmin} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-4 pb-24 bg-white">
        {!isAdmin ? (
          <div className="my-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start space-x-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-950 leading-relaxed">
                Todas las consultas de compras, pedidos y publicaciones se atienden en el chat de <strong className="text-slate-900 font-black">Soporte Oficial</strong> ({SUPPORT_EMAIL}).
              </p>
            </div>
            <button type="button" onClick={openSupport} className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-amber-400/80 cursor-pointer shadow-xs active:scale-[0.99] transition-all text-left" id="android-single-support-chat-item">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative shrink-0">
                  <img src={supportUser.avatar} alt={supportUser.name} className="w-12 h-12 rounded-full object-cover border border-amber-500 shadow-2xs bg-white" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Soporte al Cliente</span><ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  </p>
                  <p className="text-[11px] text-amber-600 font-mono font-medium">{SUPPORT_EMAIL}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Canal oficial de atención directa</p>
                </div>
              </div>
              {clientUnreads > 0 && <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold shadow-xs">{clientUnreads}</span>}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col my-3 space-y-3">
            <input type="text" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar clientes..." className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors" />
            <div className="flex-1 overflow-y-auto space-y-2">
              {clients.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No hay clientes con consultas pendientes.</div>
              ) : (
                clients.map(({ user, lastMsg, unreads }) => (
                  <button type="button" key={`android-client-${user.id}`} onClick={() => { onSelectUser(user); onClearUnreads(user.id); }} className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer active:scale-[0.99] transition-all shadow-xs text-left">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative shrink-0">
                        <img src={user.avatar || DEFAULT_AVATAR} alt={user.name} className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white" />
                        {user.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-amber-600 truncate font-mono font-medium">{user.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{lastMsg ? lastMsg.text : "Sin mensajes aún"}</p>
                      </div>
                    </div>
                    {unreads > 0 && <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold shadow-xs">{unreads}</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
