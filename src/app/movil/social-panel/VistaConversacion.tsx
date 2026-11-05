import React, { useEffect, useRef, useState } from "react";
import { Headphones, MessageSquare, Send, ShieldCheck } from "lucide-react";
import type { ConversationProps } from "./TiposSocialPanel";
import { SUPPORT_EMAIL } from "../../../utils/supportChat";
import EncabezadoSocialPanel from "./EncabezadoSocialPanel";

export default function VistaConversacion({
  currentUser,
  activeChatUser,
  isAdmin,
  supportUser,
  messages,
  onBack,
  onClose,
  onSend,
}: ConversationProps) {
  const [chatInput, setChatInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeChatUser]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    onSend(message);
    setChatInput("");
  };

  const myId = currentUser.originalId || currentUser.id;
  const chatName = isAdmin ? activeChatUser.name : "Soporte al Cliente";

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-slate-900 min-h-screen">
      <EncabezadoSocialPanel
        isAdmin={isAdmin}
        isConversation
        chatName={chatName}
        avatar={isAdmin ? activeChatUser.avatar : supportUser.avatar}
        onBack={onBack}
        onClose={onClose}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-center max-w-sm mx-auto my-2 shadow-2xs">
          <Headphones className="w-6 h-6 text-amber-600 mx-auto mb-1" />
          <p className="text-xs font-black text-amber-900">{isAdmin ? `Atención Oficial (${SUPPORT_EMAIL})` : "Canal Oficial de Soporte"}</p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            {isAdmin ? "Respondiendo a este cliente en tiempo real." : `Escribe aquí tu consulta y el administrador (${SUPPORT_EMAIL}) te responderá directamente.`}
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-amber-500" />
            <p className="text-xs font-medium text-slate-600">No hay mensajes previos.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Envía un mensaje para comenzar la conversación.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.senderId === myId || message.senderId === currentUser.id || message.senderId === "current_user";
            return (
              <div key={`${message.id || "msg"}-${index}`} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs ${isMe ? "bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-xs" : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200/80 shadow-2xs"}`}>
                  {!isMe && (
                    <p className="text-[10px] font-bold text-amber-700 mb-0.5 flex items-center gap-1">
                      <span>{isAdmin ? activeChatUser.name : "Soporte Oficial"}</span>
                      {!isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
                    </p>
                  )}
                  <p className="break-words leading-relaxed">{message.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]" style={{ backgroundColor: "#ffffff", paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
        <input
          type="text"
          placeholder={isAdmin ? "Responder al cliente..." : "Escribe a Soporte al Cliente..."}
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-900 px-4 py-2.5 rounded-2xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder:text-slate-400 transition-colors"
        />
        <button type="submit" disabled={!chatInput.trim()} className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-2xl active:scale-95 transition-all shadow-xs cursor-pointer" aria-label="Enviar mensaje">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
