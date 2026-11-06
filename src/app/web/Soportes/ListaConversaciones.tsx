import { Send, X, ShieldCheck, ArrowLeft, Search, MessageSquare, Headphones, CheckCheck, Sparkles, AlertCircle, Check } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_USER_ID, isSupportAlias } from "../../../utils/supportChat";
import type { User } from "../../../types";

export default function ListaConversaciones({ props }: { props: any }) {
  const { isAdmin, supportUser, activeChatUser, onSelectChatUser, clearUnreads, adminClientList, clientLastMessage, clientUnreads, searchQuery, setSearchQuery, adminTabFilter, setAdminTabFilter, handleSelectClient } = props;
  return (
        <aside
          className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200/90 flex flex-col shrink-0 z-10 transition-all ${
            activeChatUser ? "hidden md:flex" : "flex"
          }`}
          id="chat-list-sidebar"
        >
          {/* Header de la lista de chats */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Lista de Chats
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {isAdmin ? `${adminClientList.length} clientes` : "1 chat disponible"}
            </span>
          </div>

          {/* CASO A: CLIENTE REGULAR / INVITADO */}
          {!isAdmin ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Aviso explicativo del canal único */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                  Por seguridad y garantía de la plataforma, todas las dudas sobre productos, pedidos y publicaciones se atienden exclusivamente en el chat de <strong className="font-extrabold">Soporte Oficial</strong>.
                </p>
              </div>

              {/* EL ÚNICO CHAT DISPONIBLE EN LA LISTA */}
              <div
                onClick={() => {
                  onSelectChatUser(supportUser);
                  clearUnreads(supportUser.id);
                  clearUnreads(SUPPORT_USER_ID);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs select-none ${
                  activeChatUser && isSupportAlias(activeChatUser.id)
                    ? "bg-amber-50/60 border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200/90 hover:border-amber-400 hover:bg-slate-50"
                }`}
                id="single-client-chat-support-item"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative shrink-0">
                    <img
                      src={supportUser.avatar}
                      alt={supportUser.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 shadow-xs"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <h3 className="text-xs font-black text-slate-900 truncate">
                          Soporte al Cliente
                        </h3>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      </div>

                      {clientLastMessage && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(clientLastMessage.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-amber-700 font-bold truncate">
                      {SUPPORT_EMAIL}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-slate-500 truncate font-normal">
                        {clientLastMessage
                          ? clientLastMessage.text
                          : "¡Hola! ¿En qué podemos ayudarte hoy?"}
                      </p>

                      {clientUnreads > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] shrink-0">
                          {clientUnreads}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guía informativa de atención */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Beneficios de Soporte Directo</span>
                </h4>
                <ul className="text-[11px] text-slate-600 space-y-1.5 font-medium">
                  <li className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Respuestas directas del Administrador</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Garantía y seguimiento de tus pedidos</span>
                  </li>
                  <li className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Ayuda con publicaciones y ventas en tienda</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* CASO B: ADMINISTRADOR (cg0220037@gmail.com) */
            <div className="flex-1 overflow-y-auto p-3 flex flex-col space-y-3">
              {/* Buscador de clientes */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cliente por nombre o correo..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Filtro rápido de pestañas */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdminTabFilter("all")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    adminTabFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Todos ({adminClientList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTabFilter("unreads")}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    adminTabFilter === "unreads"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  No leídos
                </button>
              </div>

              {/* Lista de clientes para el admin */}
              {adminClientList.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-white my-auto">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">No hay consultas de clientes</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cuando los clientes escriban al chat oficial ({SUPPORT_EMAIL}), aparecerán aquí para que les respondas.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {adminClientList.map(({ user, lastMsg, unreads }) => {
                    const isSelected = activeChatUser?.id === user.id;
                    return (
                      <div
                        key={`admin-client-${user.id}`}
                        onClick={() => handleSelectClient(user)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/30"
                            : "bg-white border-slate-200/80 hover:border-amber-400 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <img
                              src={
                                user.avatar ||
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                              }
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            {user.isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {user.name}
                              </h4>
                              {lastMsg && (
                                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                                  {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-600 truncate mt-0.5 font-normal">
                              {lastMsg ? lastMsg.text : "Sin mensajes aún"}
                            </p>
                          </div>
                        </div>

                        {unreads > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] shrink-0">
                            {unreads}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>
  );
}
