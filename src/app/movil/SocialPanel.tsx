import React, { useState, useEffect, useRef, useMemo } from "react";
import { Users, Send, X, MessageSquare, ArrowLeft, Headphones, ShieldCheck, CheckCheck } from "lucide-react";
import { User, ChatMessage } from "../../types";
import { resolveSupportUser, isSupportAdmin, isSupportAlias, SUPPORT_EMAIL, SUPPORT_USER_ID } from "../../utils/supportChat";

export interface AndroidSocialPanelProps {
  users: User[];
  currentUser: User;
  messages: ChatMessage[];
  activeChatUser: User | null;
  onSelectChatUser: (user: User | null) => void;
  onSendPrivateMessage: (text: string) => void;
  unreadCounts: Record<string, number>;
  clearUnreads: (userId: string) => void;
  onClose: () => void;
}

/**
 * Android Native Social & Messaging Panel
 * Adheres strictly to the single customer support chat rule for clients, and inbox for admin.
 */
export default function AndroidSocialPanel({
  users,
  currentUser,
  messages,
  activeChatUser,
  onSelectChatUser,
  onSendPrivateMessage,
  unreadCounts,
  clearUnreads,
  onClose,
}: AndroidSocialPanelProps) {
  const isAdmin = isSupportAdmin(currentUser);
  const supportUser = useMemo(() => resolveSupportUser(users), [users]);

  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChatUser]);

  // Configurar la barra de estado de Android con fondo blanco y estilo limpio
  useEffect(() => {
    const applySocialStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && (window as any).Capacitor?.isPluginAvailable?.("StatusBar")) {
          const { StatusBar, Style } = await import("@capacitor/status-bar");
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
        }
      } catch (e) {
        // En entorno web o si el plugin no está disponible
      }

      document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
        tag.setAttribute("content", "#ffffff");
      });
    };

    applySocialStatusBar();
  }, [activeChatUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendPrivateMessage(chatInput.trim());
    setChatInput("");
  };

  // Filter messages for current active chat
  const conversationMessages = useMemo(() => {
    if (!activeChatUser) return [];

    const myId = currentUser.originalId || currentUser.id;
    const partnerId = activeChatUser.originalId || activeChatUser.id;

    if (!isAdmin) {
      return messages.filter((msg) => {
        const isFromMe = msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
        const isToMe = msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";
        const isFromSupport = isSupportAlias(msg.senderId) || msg.senderId === partnerId || msg.senderId === supportUser.id;
        const isToSupport = isSupportAlias(msg.receiverId) || msg.receiverId === partnerId || msg.receiverId === supportUser.id;
        return (isFromMe && isToSupport) || (isFromSupport && isToMe);
      });
    } else {
      return messages.filter((msg) => {
        const isFromPartner = msg.senderId === partnerId || msg.senderId === activeChatUser.id;
        const isToPartner = msg.receiverId === partnerId || msg.receiverId === activeChatUser.id;
        const isFromSupport = isSupportAlias(msg.senderId) || msg.senderId === myId || msg.senderId === currentUser.id || msg.senderId === "current_user";
        const isToSupport = isSupportAlias(msg.receiverId) || msg.receiverId === myId || msg.receiverId === currentUser.id || msg.receiverId === "current_user";
        return (isFromSupport && isToPartner) || (isFromPartner && isToSupport);
      });
    }
  }, [messages, activeChatUser, currentUser, isAdmin, supportUser]);

  // Clients list for Admin
  const adminClientList = useMemo(() => {
    if (!isAdmin) return [];
    const clientMap = new Map<string, { user: User; lastMsg?: ChatMessage; unreads: number }>();

    messages.forEach((msg) => {
      let otherId = "";
      if (isSupportAlias(msg.senderId)) otherId = msg.receiverId;
      else if (isSupportAlias(msg.receiverId)) otherId = msg.senderId;

      if (otherId && !isSupportAlias(otherId) && otherId !== "current_user") {
        const found = users.find((u) => u.id === otherId || u.originalId === otherId);
        clientMap.set(otherId, {
          user: found || {
            id: otherId,
            name: otherId.startsWith("guest_") ? "Cliente Invitado" : "Cliente",
            username: otherId,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
            bio: "Cliente de Mall Social",
            isOnline: false,
            followers: 0,
            following: 0,
          },
          lastMsg: msg,
          unreads: unreadCounts[otherId] || 0,
        });
      }
    });

    users.forEach((u) => {
      if (u.id !== currentUser.id && u.email?.toLowerCase() !== SUPPORT_EMAIL && u.username !== "invitado" && !clientMap.has(u.id)) {
        clientMap.set(u.id, { user: u, unreads: unreadCounts[u.id] || 0 });
      }
    });

    let clients = Array.from(clientMap.values());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      clients = clients.filter((c) => c.user.name.toLowerCase().includes(q) || c.user.username.toLowerCase().includes(q));
    }
    return clients;
  }, [isAdmin, messages, users, currentUser, unreadCounts, searchQuery]);

  const clientUnreads = unreadCounts[supportUser.id] || unreadCounts[SUPPORT_USER_ID] || unreadCounts[SUPPORT_EMAIL] || 0;

  return (
    <div
      className="w-full h-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none"
      id="android-social-panel"
      style={{ backgroundColor: "#ffffff" }}
    >
      {activeChatUser ? (
        /* --- Android 1-on-1 Chat Thread View --- */
        <div className="flex-1 flex flex-col h-full bg-white text-slate-900 min-h-screen">
          {/* Header fijo con fondo blanco que respeta la barra de estado de Android */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between px-4 pb-3 bg-white border-b border-slate-100 shadow-2xs shrink-0"
            style={{
              backgroundColor: "#ffffff",
              paddingTop: "calc(max(24px, env(safe-area-inset-top, 24px)) + 8px)",
            }}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <button
                onClick={() => onSelectChatUser(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 cursor-pointer"
                title="Volver"
                aria-label="Volver a mensajes"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative shrink-0">
                <img
                  src={isAdmin ? activeChatUser.avatar : supportUser.avatar}
                  alt={isAdmin ? activeChatUser.name : "Soporte Oficial"}
                  className="w-9 h-9 rounded-full object-cover border border-amber-500/40 bg-white"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <span>{isAdmin ? activeChatUser.name : "Soporte al Cliente"}</span>
                  {!isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </p>
                <p className="text-[10px] text-amber-600 font-mono font-medium truncate">
                  {isAdmin ? `@${activeChatUser.username}` : SUPPORT_EMAIL}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Cerrar"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Area - Fondo Blanco */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {/* Tarjeta de bienvenida */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-center max-w-sm mx-auto my-2 shadow-2xs">
              <Headphones className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-xs font-black text-amber-900">
                {isAdmin ? `Atención Oficial (${SUPPORT_EMAIL})` : "Canal Oficial de Soporte"}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {isAdmin
                  ? "Respondiendo a este cliente en tiempo real."
                  : `Escribe aquí tu consulta y el administrador (${SUPPORT_EMAIL}) te responderá directamente.`}
              </p>
            </div>

            {conversationMessages.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-amber-500" />
                <p className="text-xs font-medium text-slate-600">No hay mensajes previos.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Envía un mensaje para comenzar la conversación.</p>
              </div>
            ) : (
              conversationMessages.map((m, mIdx) => {
                const myId = currentUser.originalId || currentUser.id;
                const isMe = m.senderId === myId || m.senderId === currentUser.id || m.senderId === "current_user";
                return (
                  <div
                    key={`${m.id || 'msg'}-${mIdx}`}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs ${
                        isMe
                          ? "bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-xs"
                          : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/80 shadow-2xs"
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[10px] font-bold text-amber-700 mb-0.5 flex items-center gap-1">
                          <span>{isAdmin ? activeChatUser.name : "Soporte Oficial"}</span>
                          {!isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                        </p>
                      )}
                      <p className="break-words leading-relaxed">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar fijo en el pie con fondo blanco */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
            style={{
              backgroundColor: "#ffffff",
              paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
            }}
          >
            <input
              type="text"
              placeholder={isAdmin ? "Responder al cliente..." : "Escribe a Soporte al Cliente..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-900 px-4 py-2.5 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder:text-slate-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* --- Android Chats & User List View --- */
        <div className="flex-1 flex flex-col h-full bg-white text-slate-900 min-h-screen">
          {/* Header fijo con fondo blanco que dice "Mensajes y Soporte" */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between px-4 pb-3 bg-white border-b border-slate-100 shadow-2xs shrink-0"
            style={{
              backgroundColor: "#ffffff",
              paddingTop: "calc(max(24px, env(safe-area-inset-top, 24px)) + 8px)",
            }}
          >
            <div className="flex items-center space-x-2">
              <Headphones className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                {isAdmin ? "Bandeja de Clientes" : "Mensajes y Soporte"}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                {isAdmin ? "Admin" : "Oficial"}
              </span>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Cuerpo de la página con fondo blanco */}
          <div className="flex-1 overflow-y-auto px-4 pb-24 bg-white">
            {!isAdmin ? (
              /* PARA CLIENTE: UN SOLO CHAT DISPONIBLE */
              <div className="my-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start space-x-2.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-950 leading-relaxed">
                    Todas las consultas de compras, pedidos y publicaciones se atienden en el chat de <strong className="text-slate-900 font-black">Soporte Oficial</strong> ({SUPPORT_EMAIL}).
                  </p>
                </div>

                {/* Único chat disponible */}
                <div
                  onClick={() => {
                    onSelectChatUser(supportUser);
                    clearUnreads(supportUser.id);
                    clearUnreads(SUPPORT_USER_ID);
                  }}
                  className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-amber-400/80 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
                  id="android-single-support-chat-item"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={supportUser.avatar}
                        alt={supportUser.name}
                        className="w-12 h-12 rounded-full object-cover border border-amber-500 shadow-2xs bg-white"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Soporte al Cliente</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                      </p>
                      <p className="text-[11px] text-amber-600 font-mono font-medium">{SUPPORT_EMAIL}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Canal oficial de atención directa</p>
                    </div>
                  </div>

                  {clientUnreads > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold shadow-xs">
                      {clientUnreads}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* PARA ADMIN: LISTA DE CLIENTES */
              <div className="flex-1 flex flex-col my-3 space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar clientes..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />

                <div className="flex-1 overflow-y-auto space-y-2">
                  {adminClientList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No hay clientes con consultas pendientes.
                    </div>
                  ) : (
                    adminClientList.map(({ user, lastMsg, unreads }) => (
                      <div
                        key={`android-client-${user.id}`}
                        onClick={() => {
                          onSelectChatUser(user);
                          clearUnreads(user.id);
                        }}
                        className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer active:scale-[0.99] transition-all shadow-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                              alt={user.name}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-white"
                            />
                            {user.isOnline && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                            <p className="text-[11px] text-amber-600 truncate font-mono font-medium">@{user.username}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {lastMsg ? lastMsg.text : "Sin mensajes aún"}
                            </p>
                          </div>
                        </div>

                        {unreads > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold shadow-xs">
                            {unreads}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
