import { useCallback, useState } from "react";
import type { ChatMessage, User } from "../tipos";
import { apiFetch } from "../config";

export function useMensajeriaMovil(usuarioActual: User) {
  const [usuarioChatActivo, establecerUsuarioChatActivo] = useState<User | null>(null);
  const [mensajesPrivados, establecerMensajesPrivados] = useState<ChatMessage[]>([]);
  const [conteoMensajesSinLeer, establecerConteoMensajesSinLeer] = useState<Record<string, number>>({});

  const enviarMensajePrivado = useCallback((texto: string) => {
    if (!texto.trim()) return;
    const nuevoMensaje: ChatMessage = {
      id: "msg_" + Date.now(),
      senderId: usuarioActual.id,
      receiverId: usuarioChatActivo?.id || "support",
      text: texto.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    establecerMensajesPrivados((anteriores) => [...anteriores, nuevoMensaje]);
    apiFetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoMensaje),
    }).catch(() => {});
  }, [usuarioActual.id, usuarioChatActivo?.id]);

  const limpiarMensajesSinLeer = useCallback((idUsuario: string) => {
    establecerConteoMensajesSinLeer((anteriores) => ({ ...anteriores, [idUsuario]: 0 }));
  }, []);

  const totalMensajesSinLeer = Object.values(conteoMensajesSinLeer)
    .reduce((total, cantidad) => total + cantidad, 0);

  return {
    usuarioChatActivo,
    establecerUsuarioChatActivo,
    mensajesPrivados,
    conteoMensajesSinLeer,
    totalMensajesSinLeer,
    enviarMensajePrivado,
    limpiarMensajesSinLeer,
  };
}
