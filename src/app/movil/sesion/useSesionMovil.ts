import { useCallback, useState } from "react";
import type { User } from "../tipos";
import { sesionMovil } from "../sesion";
import { getLocalGuestToken } from "../guestToken";

function crearUsuarioInvitado(): User {
  return {
    id: "guest_" + (getLocalGuestToken() || "anonymous"),
    name: "Invitado",
    email: "guest@elegan.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    bio: "Visitante",
    followers: 0,
    following: 0,
    isGuest: true,
  };
}

function obtenerUsuarioInicial(): User {
  if (typeof window !== "undefined") {
    const usuarioGuardado = sesionMovil.getUser();
    if (usuarioGuardado?.id) return usuarioGuardado;
  }
  return crearUsuarioInvitado();
}

export function useSesionAplicacionMovil() {
  const [usuarioActual, establecerUsuarioActual] = useState<User>(obtenerUsuarioInicial);
  const [sesionIniciada, establecerSesionIniciada] = useState<boolean>(() => !usuarioActual.isGuest);

  const cerrarSesion = useCallback(() => {
    sesionMovil.clear();
    establecerSesionIniciada(false);
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  const iniciarSesion = useCallback((usuario: User) => {
    sesionMovil.setUser(usuario);
    sesionMovil.setAuthenticated(true);
    sesionMovil.setEmail(usuario.email || "");
    establecerUsuarioActual(usuario);
    establecerSesionIniciada(true);
  }, []);

  return {
    usuarioActual,
    establecerUsuarioActual,
    sesionIniciada,
    establecerSesionIniciada,
    cerrarSesion,
    iniciarSesion,
  };
}

