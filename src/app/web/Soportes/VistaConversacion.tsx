import { Send, X, ShieldCheck, ArrowLeft, Search, MessageSquare, Headphones, CheckCheck, Sparkles, AlertCircle, Check } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_USER_ID, isSupportAlias } from "../../../utils/supportChat";

export default function VistaConversacion({ props }: { props: any }) {
  const { isAdmin, activeChatUser, supportUser, SUPPORT_EMAIL, currentUser, currentConversationMessages, scrollRef, isGuest, handleSubmit, chatInput, setChatInput } = props;
  return (
        <main
          className={`flex-1 flex flex-col bg-slate-50 min-w-0 ${
            !activeChatUser ? "hidden md:flex" : "flex"
          }`}
          id="chat-conversation-pane"
        >
          {activeChatUser ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
              {/* Cabecera del chat activo */}
              <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        isAdmin
                          ? activeChatUser.avatar ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                          : supportUser.avatar
                      }
                      alt={isAdmin ? activeChatUser.name : "Soporte Oficial"}
                      className="w-10 h-10 rounded-2xl object-cover border border-amber-500/40"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-slate-900 truncate">
                        {isAdmin ? activeChatUser.name : "Soporte al Cliente"}
                      </h3>
                      {!isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      {isAdmin && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({activeChatUser.name})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {isAdmin
                        ? `ID Cliente: ${activeChatUser.id}`
                        : `${SUPPORT_EMAIL} • Tiempo medio de respuesta: Inmediato`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    En Línea
                  </span>
                </div>
              </div>

              {/* Mensajes Scroll Area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* Tarjeta de bienvenida oficial */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center max-w-md mx-auto my-2 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center mx-auto mb-2">
                    <Headphones className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    {isAdmin
                      ? `Atención Oficial (${SUPPORT_EMAIL})`
                      : "Canal Oficial de Soporte al Cliente"}
                  </h4>
                  <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                    {isAdmin
                      ? `Estás respondiendo a este cliente como el usuario oficial de soporte (${SUPPORT_EMAIL}). Todas tus respuestas se entregarán en tiempo real.`
                      : `Bienvenido a Soporte al Cliente. Escribe tu duda o consulta sobre pedidos, envíos, productos o publicaciones, y el administrador responderá directamente a tu chat.`}
                  </p>
                </div>

                {currentConversationMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.8]" />
                    <p className="text-xs font-semibold text-slate-600">
                      Aún no hay mensajes en esta conversación.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isAdmin
                        ? "Escribe un mensaje para responder al cliente."
                        : "Escribe tu consulta abajo para comenzar a chatear con soporte."}
                    </p>
                  </div>
                ) : (
                  currentConversationMessages.map((msg, index) => {
                    const myId = currentUser.originalId || currentUser.id;
                    const isMe =
                      msg.senderId === myId ||
                      msg.senderId === currentUser.id ||
                      msg.senderId === "current_user";

                    return (
                      <div
                        key={`msg-${msg.id || index}`}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed border shadow-xs ${
                            isMe
                              ? "bg-amber-500 text-slate-950 border-amber-400 rounded-br-xs font-medium"
                              : "bg-white text-slate-900 border-slate-200/90 rounded-bl-xs"
                          }`}
                        >
                          {!isMe && (
                            <div className="flex items-center space-x-1.5 mb-1 pb-1 border-b border-slate-100">
                              <span className="text-[10px] font-black text-amber-700">
                                {isAdmin ? activeChatUser?.name || "Cliente" : "Soporte Oficial"}
                              </span>
                              {!isAdmin && <ShieldCheck className="w-3 h-3 text-amber-600 inline" />}
                            </div>
                          )}
                          <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[9px] font-mono ${
                              isMe ? "text-slate-950/70" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formulario de Entrada de Mensaje */}
              <div className="border-t border-slate-200 bg-white">
                {isGuest && !isAdmin ? (
                  <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-amber-900 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Para enviar consultas a Soporte, inicia sesión o regístrate.</span>
                    </div>
                  </div>
                ) : null}

                <form
                  onSubmit={handleSubmit}
                  className="p-3 flex items-center space-x-2 shrink-0"
                  style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
                >
                  <input
                    type="text"
                    placeholder={
                      isAdmin
                        ? `Responder a ${activeChatUser?.name || "este cliente"} como Soporte...`
                        : "Escribe tu consulta para Soporte al Cliente..."
                    }
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    autoFocus
                    className="flex-1 bg-slate-100 border border-slate-200 text-xs text-slate-900 px-4 py-2.5 rounded-full focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-95 text-slate-950 font-black rounded-full transition-all cursor-pointer shadow-xs"
                    title="Enviar mensaje"
                  >
                    <Send className="w-4 h-4 translate-x-0.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Estado vacío en desktop cuando admin no tiene chat seleccionado */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                <Headphones className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                Bandeja de Soporte al Cliente
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Selecciona un cliente de la lista de la izquierda para ver su conversación y responder a sus consultas como soporte oficial ({SUPPORT_EMAIL}).
              </p>
            </div>
          )}
        </main>
  );
}
