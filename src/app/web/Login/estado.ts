import { useEffect, useRef, useState } from "react";
import type { User } from "../../../types";
import { apiFetch } from "../../../config";
import { sessionState } from "../../../utils/sessionState";
import { navigateTo, parseRoute, getProfileConfigPath } from "../../../router";
import { AVATARES_PREDEFINIDOS, PORTADAS_PREDEFINIDAS } from "./constantes";
import type { EstadoFormularioAcceso, LoginViewProps, PestañaAcceso } from "./tipos";

export function useEstadoAcceso({
  onLoginSuccess,
  onRefreshUsers,
  currentUser,
  initialTab,
}: LoginViewProps): EstadoFormularioAcceso {
  const [pestaña, setPestaña] = useState<PestañaAcceso>(() => {
    if (initialTab) return initialTab;
    return currentUser?.isGuest ? "register" : "login";
  });
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [errorAcceso, setErrorAcceso] = useState("");
  const [cargandoAcceso, setCargandoAcceso] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correoRegistro, setCorreoRegistro] = useState("");
  const [contraseñaRegistro, setContraseñaRegistro] = useState("");
  const [errorRegistro, setErrorRegistro] = useState("");
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const registroEnCurso = useRef(false);

  useEffect(() => {
    onRefreshUsers();
  }, []);

  const redirigirDespuesDeAcceso = (usuario: User) => {
    const ruta = typeof window !== "undefined"
      ? parseRoute(window.location.pathname)
      : null;
    if (ruta?.type === "profile" && ruta.profileTab === "config") {
      navigateTo(getProfileConfigPath(usuario));
    } else {
      navigateTo("/tienda/catalogo");
    }
  };

  const iniciarSesion = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (cargandoAcceso) return;
    setErrorAcceso("");

    const correoLimpio = correo.trim().toLowerCase();
    if (!correoLimpio) return setErrorAcceso("Por favor ingresa tu correo electrónico.");
    if (!correoLimpio.includes("@")) return setErrorAcceso("Por favor ingresa un correo electrónico válido.");
    if (!contraseña.trim()) return setErrorAcceso("Por favor ingresa tu contraseña.");

    setCargandoAcceso(true);
    try {
      const respuesta = await apiFetch("/api/users/current/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correoLimpio, password: contraseña.trim() }),
      });
      const datos = await respuesta.json();
      if (respuesta.ok && datos.success) {
        sessionState.setUser(datos.user);
        sessionState.setAuthenticated(true);
        sessionState.setEmail(datos.user?.email || correoLimpio);
        onLoginSuccess(datos.user);
        redirigirDespuesDeAcceso(datos.user);
      } else {
        setErrorAcceso(datos.error || "El correo electrónico o la contraseña son incorrectos. Verifica tus datos.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorAcceso("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setCargandoAcceso(false);
    }
  };

  const registrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (cargandoRegistro || registroEnCurso.current) return;
    registroEnCurso.current = true;
    setErrorRegistro("");

    if (!nombre.trim()) {
      setErrorRegistro("El nombre completo es obligatorio.");
      registroEnCurso.current = false;
      return;
    }
    if (!correoRegistro.trim()) {
      setErrorRegistro("El correo electrónico es obligatorio.");
      registroEnCurso.current = false;
      return;
    }
    if (!contraseñaRegistro.trim()) {
      setErrorRegistro("La contraseña es obligatoria.");
      registroEnCurso.current = false;
      return;
    }

    setCargandoRegistro(true);
    try {
      const respuesta = await apiFetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nombre.trim(),
          email: correoRegistro.trim(),
          password: contraseñaRegistro.trim(),
          bio: "Miembro de la plataforma",
          avatar: AVATARES_PREDEFINIDOS[0],
          coverPhoto: PORTADAS_PREDEFINIDAS[0],
        }),
      });
      const datos = await respuesta.json();
      if (respuesta.ok && datos.success) {
        sessionState.setAuthenticated(true);
        sessionState.setEmail(datos.user?.email || correoRegistro.trim().toLowerCase());
        sessionState.setUser(datos.user);
        onRefreshUsers();
        onLoginSuccess(datos.user);
        redirigirDespuesDeAcceso(datos.user);
      } else {
        setErrorRegistro(datos.error || "Error al registrar el usuario.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorRegistro("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setCargandoRegistro(false);
      registroEnCurso.current = false;
    }
  };

  return {
    pestaña, setPestaña, correo, setCorreo, contraseña, setContraseña,
    errorAcceso, cargandoAcceso, nombre, setNombre, correoRegistro,
    setCorreoRegistro, contraseñaRegistro, setContraseñaRegistro,
    errorRegistro, cargandoRegistro, iniciarSesion, registrar,
  };
}
