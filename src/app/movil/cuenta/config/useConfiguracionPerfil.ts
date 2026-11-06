import React, { useState } from "react";
import { User } from "../../tipos";
import { androidApiFetch } from "../../api";
import { sesionMovil } from "../../sesion";

type MensajeEstado = { type: "success" | "error"; text: string } | null;

interface Props {
  activeUser: User;
  currentUser: User;
  onProfileUpdate?: (updatedUser: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onClose?: () => void;
}

function obtenerUsuarioGuardado() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("mall_user") || "{}");
  } catch {
    return null;
  }
}

export default function useConfiguracionPerfil({
  activeUser, currentUser, onProfileUpdate, onUpdateUser, onClose,
}: Props) {
  const usuarioSesion = sesionMovil.getUser();
  const usuarioCache = obtenerUsuarioGuardado();

  const [editName, setEditName] = useState(activeUser.name || currentUser.name || usuarioSesion?.name || usuarioCache?.name || "");
  const [editEmail, setEditEmail] = useState(activeUser.email || currentUser.email || usuarioSesion?.email || usuarioCache?.email || "");
  const [editAddress, setEditAddress] = useState(
    (activeUser as any).shippingAddress || (activeUser as any).address ||
    (currentUser as any).shippingAddress || (currentUser as any).address ||
    usuarioSesion?.shippingAddress || usuarioSesion?.address ||
    usuarioCache?.shippingAddress || usuarioCache?.address || ""
  );
  const [editCity, setEditCity] = useState((activeUser as any).city || (currentUser as any).city || usuarioSesion?.city || usuarioCache?.city || "");
  const [editCountry, setEditCountry] = useState((activeUser as any).country || (currentUser as any).country || usuarioSesion?.country || usuarioCache?.country || "República Dominicana");
  const [editPhone, setEditPhone] = useState((activeUser as any).phone || (currentUser as any).phone || usuarioSesion?.phone || usuarioCache?.phone || "");
  const [editPostalCode, setEditPostalCode] = useState((activeUser as any).postalCode || (currentUser as any).postalCode || usuarioSesion?.postalCode || usuarioCache?.postalCode || "");
  const [editAvatar, setEditAvatar] = useState(activeUser.avatar || currentUser.avatar || usuarioSesion?.avatar || usuarioCache?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<MensajeEstado>(null);

  React.useEffect(() => {
    const storedUser = sesionMovil.getUser() || obtenerUsuarioGuardado();
    const sources = [activeUser, currentUser, storedUser].filter(Boolean);
    const getValue = (key: "name" | "email" | "shippingAddress" | "address" | "city" | "country" | "phone" | "postalCode" | "avatar") =>
      sources.map((source) => source[key]).find((value) => typeof value === "string" && value.trim()) || "";

    setEditName(getValue("name"));
    setEditEmail(getValue("email"));
    setEditAddress(getValue("shippingAddress") || getValue("address"));
    setEditCity(getValue("city"));
    setEditCountry(getValue("country") || "República Dominicana");
    setEditPhone(getValue("phone"));
    setEditPostalCode(getValue("postalCode"));
    setEditAvatar(getValue("avatar"));
  }, [activeUser, currentUser]);

  const seleccionarFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Por favor selecciona un archivo de imagen válido." });
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      if (typeof lector.result === "string") {
        setEditAvatar(lector.result);
        setStatusMessage({ type: "success", text: "Foto elegida de la galería lista para guardar." });
      }
    };
    lector.onerror = () => setStatusMessage({ type: "error", text: "Error al leer la imagen seleccionada." });
    lector.readAsDataURL(archivo);
  };

  const guardarPerfil = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    const targetUserId = activeUser.originalId || activeUser.id || currentUser.originalId || currentUser.id;
    const payload = {
      userId: targetUserId,
      name: editName.trim(),
      avatar: editAvatar.trim(),
      email: editEmail.trim(),
      address: editAddress.trim(),
      shippingAddress: editAddress.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
      phone: editPhone.trim(),
      postalCode: editPostalCode.trim(),
    };

    try {
      const response = await androidApiFetch("/users/current/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let datosRespuesta: any;
      try {
        datosRespuesta = await response.json();
      } catch {
        throw new Error("El servidor devolvió una respuesta inválida al guardar el perfil.");
      }
      if (!response.ok || datosRespuesta?.success !== true || !datosRespuesta.user) {
        throw new Error(datosRespuesta?.error || "No se pudo guardar el perfil en la base de datos.");
      }

      const usuarioServidor = datosRespuesta.user;
      if (editAvatar.startsWith("data:") && (!usuarioServidor.avatar || usuarioServidor.avatar.startsWith("data:"))) {
        throw new Error("No se pudo procesar la foto de perfil en la nube. Intenta de nuevo.");
      }
      const usuarioActualizado: User = { ...activeUser, ...usuarioServidor };
      sesionMovil.setUser(usuarioActualizado);
      try {
        localStorage.setItem("mall_user", JSON.stringify(usuarioActualizado));
      } catch {}
      window.dispatchEvent(new CustomEvent("mall_user_changed", { detail: usuarioActualizado }));
      onProfileUpdate?.(usuarioActualizado);
      onUpdateUser?.(usuarioActualizado);

      setStatusMessage({
        type: "success",
        text: activeUser.isGuest || currentUser.isGuest
          ? "Datos guardados. Los perfiles de invitado se eliminan automáticamente después de 60 días."
          : "¡Datos guardados con éxito en MongoDB Atlas!",
      });
      if (!activeUser.isGuest && !currentUser.isGuest) {
        setTimeout(() => onClose?.(), 800);
      }
    } catch (error: any) {
      console.error("Failed to update profile on Android:", error);
      setStatusMessage({ type: "error", text: error.message || "Error al conectar con el servidor" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    editName, setEditName, editEmail, setEditEmail, editAddress, setEditAddress,
    editCity, setEditCity, editCountry, setEditCountry, editPhone, setEditPhone,
    editPostalCode, setEditPostalCode, editAvatar, setEditAvatar, isSaving,
    statusMessage, setStatusMessage, seleccionarFoto, guardarPerfil,
  };
}
