import React, { useState, useRef } from "react";
import { User } from "../../../types";
import {
  X,
  Camera,
  Check,
  ShieldCheck,
  Image as ImageIcon,
  MapPin,
  Mail,
  Phone,
  User as UserIcon,
  Building2,
  Globe,
  LogOut,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { androidApiFetch } from "../api";
import { isSuperAdmin } from "../../../superAdmin";
import { sessionState } from "../../../utils/sessionState";
import { navigateTo } from "../../../router";

export interface ConfigPerfilProps {
  activeUser: User;
  currentUser: User;
  onProfileUpdate?: (updatedUser: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onClose?: () => void;
  isOpen?: boolean;
  onLogout?: () => void;
}

export function ConfigPerfilView({
  activeUser,
  currentUser,
  onProfileUpdate,
  onUpdateUser,
  onClose,
  isOpen = true,
  onLogout,
}: ConfigPerfilProps) {
  const getCachedUserData = () => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("mall_user") || "{}");
    } catch {
      return null;
    }
  };

  const cached = getCachedUserData();
  const sessionU = sessionState.getUser();

  const [editName, setEditName] = useState(
    activeUser.name || currentUser.name || sessionU?.name || cached?.name || ""
  );
  const [editEmail, setEditEmail] = useState(
    activeUser.email || currentUser.email || sessionU?.email || cached?.email || ""
  );
  const [editAddress, setEditAddress] = useState(
    (activeUser as any).shippingAddress ||
      (activeUser as any).address ||
      (currentUser as any).shippingAddress ||
      (currentUser as any).address ||
      sessionU?.shippingAddress ||
      sessionU?.address ||
      cached?.shippingAddress ||
      cached?.address ||
      ""
  );
  const [editCity, setEditCity] = useState(
    (activeUser as any).city || (currentUser as any).city || sessionU?.city || cached?.city || ""
  );
  const [editCountry, setEditCountry] = useState(
    (activeUser as any).country ||
      (currentUser as any).country ||
      sessionU?.country ||
      cached?.country ||
      "República Dominicana"
  );
  const [editPhone, setEditPhone] = useState(
    (activeUser as any).phone || (currentUser as any).phone || sessionU?.phone || cached?.phone || ""
  );
  const [editPostalCode, setEditPostalCode] = useState(
    (activeUser as any).postalCode || (currentUser as any).postalCode || sessionU?.postalCode || cached?.postalCode || ""
  );
  const [editAvatar, setEditAvatar] = useState(
    activeUser.avatar || currentUser.avatar || sessionU?.avatar || cached?.avatar || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mantener el formulario sincronizado cuando el perfil actualizado llega desde el servidor.
  React.useEffect(() => {
    const storedUser = sessionState.getUser() || getCachedUserData();
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

  // Manejar selección de foto desde la galería local del celular o navegador
  const handleSelectFromGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Por favor selecciona un archivo de imagen válido." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditAvatar(reader.result);
        setStatusMessage({ type: "success", text: "Foto elegida de la galería lista para guardar." });
      }
    };
    reader.onerror = () => {
      setStatusMessage({ type: "error", text: "Error al leer la imagen seleccionada." });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const targetUserId = activeUser.originalId || activeUser.id || currentUser.originalId || currentUser.id;
    const currentUsername = activeUser.username || currentUser.username || sessionState.getUsername();

    const payload = {
      userId: targetUserId,
      currentUsername,
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
      const res = await androidApiFetch("/users/current/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let resData: any;
      try {
        resData = await res.json();
      } catch {
        throw new Error("El servidor devolvió una respuesta inválida al guardar el perfil.");
      }

      if (!res.ok || resData?.success !== true || !resData.user) {
        throw new Error(resData?.error || "No se pudo guardar el perfil en la base de datos.");
      }

      const serverUser = resData.user;
      if (
        editAvatar.startsWith("data:") &&
        (!serverUser.avatar || !serverUser.avatar.startsWith("https://storage.googleapis.com/"))
      ) {
        throw new Error("La foto no se guardó en Google Cloud Storage. Intenta de nuevo.");
      }
      const updated: User = {
        ...activeUser,
        ...serverUser,
      };

      sessionState.setUser(updated);
      try {
        localStorage.setItem("mall_user", JSON.stringify(updated));
      } catch {}

      window.dispatchEvent(new CustomEvent("mall_user_changed", { detail: updated }));

      if (onProfileUpdate) onProfileUpdate(updated);
      if (onUpdateUser) onUpdateUser(updated);

      setStatusMessage({
        type: "success",
        text: activeUser.isGuest || currentUser.isGuest
          ? "Datos guardados. Los perfiles de invitado se eliminan automáticamente después de 60 días."
          : "¡Datos guardados con éxito en MongoDB Atlas!",
      });
      if (!activeUser.isGuest && !currentUser.isGuest) {
        setTimeout(() => {
          if (onClose) onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error("Failed to update profile on Android:", err);
      setStatusMessage({ type: "error", text: err.message || "Error al conectar con el servidor" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs" id="android-profile-config-modal">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-full max-h-[90vh] bg-white border-t border-slate-200 rounded-t-3xl text-slate-900 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Configuración de Perfil</span>
                {isSuperAdmin(activeUser) && (
                  <span className="inline-flex items-center justify-center shrink-0" title="Verificado">
                    <BadgeCheck className="w-4 h-4 text-white fill-blue-500 shrink-0 drop-shadow-2xs" />
                  </span>
                )}
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-full active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Formulario con área de scroll y pie fijo */}
            <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Foto de perfil elegida directamente desde la Galería */}
              <div className="flex flex-col items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectFromGallery}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative mb-2 cursor-pointer group active:scale-95 transition-transform"
                  title="Toca para cambiar foto desde la galería"
                >
                  <img
                    src={editAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-md bg-white group-hover:opacity-90"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                    }}
                  />
                  <span className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 text-slate-950 shadow-md group-hover:bg-amber-400 transition-colors">
                    <Camera className="w-4 h-4" />
                  </span>
                </div>

                {/* Botón explícito para elegir de la galería */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>Elegir foto de la galería</span>
                </button>
                {activeUser.email && (
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">{activeUser.email}</p>
                )}
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nombre Completo</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Se usará para enviar confirmaciones, recuperar tu cuenta e iniciar sesión en otros celulares.
                </span>
              </div>

              {/* Dirección de Entrega */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dirección de Entrega (Calle y Número)</span>
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Calle, número, sector o colonia"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                />
              </div>

              {/* Ciudad y País */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ciudad</span>
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Ej. Santo Domingo"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>País</span>
                  </label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="Ej. República Dominicana"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                  />
                </div>
              </div>

              {/* Código Postal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={editPostalCode}
                  onChange={(e) => setEditPostalCode(e.target.value)}
                  placeholder="Código postal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                />
              </div>

              {/* Teléfono de Contacto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>Número de Celular / Teléfono</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 809 000 0000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {statusMessage.type === "success" && <Check className="w-4 h-4 text-emerald-600" />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

                {/* Sección de Cerrar Sesión */}
                {onLogout && (
                  <div className="pt-4 pb-2 border-t border-slate-100 flex flex-col items-center">
                    <button
                      type="button"
                      id="mobile-profile-logout-btn"
                      onClick={() => {
                        if (onClose) onClose();
                        onLogout();
                        navigateTo("/perfil/login?mode=login");
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/80 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 font-bold text-xs group"
                      title="Cerrar sesión"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                      <span className="text-rose-700">Cerrar sesión</span>
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      Cerrarás la sesión en este dispositivo móvil de forma segura.
                    </p>
                  </div>
                )}
              </div>

              {/* Pie fijo con el botón de guardar y actualizar información */}
              <div
                className="p-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
              >
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Guardando en la base de datos...</span>
                    </>
                  ) : (
                    <span>Guardar y Actualizar Información</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

    </>
  );
}

export { ConfigPerfilView as Config };
export default ConfigPerfilView;
