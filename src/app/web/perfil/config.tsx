import React, { useState, useEffect, useRef } from "react";
import { Settings, ShieldCheck, Camera, Users } from "lucide-react";
import { motion } from "motion/react";
import { User, isGuestUser as checkIsGuest } from "../../../types";
import { apiFetch, getMediaUrl } from "../../../config";
import { sessionState } from "../../../utils/sessionState";

export interface ConfigPerfilProps {
  currentUser: User;
  profileUser?: User | null;
  users?: User[];
  onProfileSaved?: (updatedUser: User) => void;
  onRefreshUsers?: () => void;
  onBackToSelf?: () => void;
  onCancel?: () => void;
}

export function ConfigPerfilView({
  currentUser,
  profileUser,
  users = [],
  onProfileSaved,
  onRefreshUsers,
  onBackToSelf,
  onCancel,
}: ConfigPerfilProps) {
  // Profile edit states
  const [editName, setEditName] = useState(currentUser.name || "");
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || "");
  const [editAddress, setEditAddress] = useState(currentUser.shippingAddress || currentUser.address || "");
  const [editCity, setEditCity] = useState(currentUser.city || "");
  const [editCountry, setEditCountry] = useState(currentUser.country || "República Dominicana");
  const [editPhone, setEditPhone] = useState(currentUser.phone || "");
  const [editPostalCode, setEditPostalCode] = useState(currentUser.postalCode || "");
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Register user states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regAvatar, setRegAvatar] = useState("");
  const [regCoverPhoto, setRegCoverPhoto] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const profileRegisteringRef = useRef(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Switch user states
  const [switchingUser, setSwitchingUser] = useState<User | null>(null);
  const [switchPassword, setSwitchPassword] = useState("");
  const [switchError, setSwitchError] = useState("");

  // Synchronize form values whenever currentUser or profileUser changes
  useEffect(() => {
    if (currentUser && !checkIsGuest(currentUser)) {
      setEditName(currentUser.name || "");
      setEditAvatar(currentUser.avatar || "");
      setEditAddress(currentUser.shippingAddress || currentUser.address || "");
      setEditCity(currentUser.city || "");
      setEditCountry(currentUser.country || "República Dominicana");
      setEditPhone(currentUser.phone || "");
      setEditPostalCode(currentUser.postalCode || "");
    }
  }, [currentUser, profileUser]);

  useEffect(() => {
    if (
      currentUser &&
      !checkIsGuest(currentUser)
    ) {
      setEditName(currentUser.name || "");
      setEditAvatar(currentUser.avatar || "");
      setEditAddress(currentUser.shippingAddress || currentUser.address || "");
      setEditCity(currentUser.city || "");
      setEditCountry(currentUser.country || "República Dominicana");
      setEditPhone(currentUser.phone || "");
      setEditPostalCode(currentUser.postalCode || "");
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const response = await apiFetch("/api/users/current/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.originalId || currentUser.id,
          name: editName,
          avatar: editAvatar,
          password: editPassword,
          address: editAddress.trim(),
          shippingAddress: editAddress.trim(),
          city: editCity.trim(),
          country: editCountry.trim(),
          phone: editPhone.trim(),
          postalCode: editPostalCode.trim(),
        }),
      });
      let data: any = null;
      try {
        data = await response.json();
      } catch {
        // Response was not JSON
      }
      if (!response.ok || !data?.success) {
        setSaveError(data?.error || "Error al actualizar el perfil en el servidor.");
        return;
      }
      if (data.success && data.user) {
        onProfileSaved?.(data.user);
        onRefreshUsers?.();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setSaveError(err?.message || "Error al conectar con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchUser = async (targetEmail: string, password?: string) => {
    try {
      setSwitchError("");
      const response = await apiFetch("/api/users/current/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setSwitchError(data.error || "Contraseña incorrecta o usuario no encontrado.");
        return;
      }
      if (response.ok && data.success) {
        sessionState.setAuthenticated(true);
        sessionState.setUsername(data.user?.email || targetEmail);
        sessionState.setUser(data.user);

        onProfileSaved?.(data.user);
        onRefreshUsers?.();
        setSwitchingUser(null);
        setSwitchPassword("");
        onBackToSelf?.();
      }
    } catch (err) {
      console.error("Error switching account:", err);
      setSwitchError("Error de conexión al cambiar de cuenta.");
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering || profileRegisteringRef.current) return;
    profileRegisteringRef.current = true;
    setIsRegistering(true);
    setRegisterError("");
    setRegisterSuccess(false);

    try {
      const cleanEmail = regEmail.trim().toLowerCase();
      if (!regName.trim() || !cleanEmail || !cleanEmail.includes("@") || !regPassword.trim()) {
        setRegisterError("Completa el nombre, correo electrónico y contraseña.");
        return;
      }
      const response = await apiFetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: cleanEmail,
          avatar:
            regAvatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          password: regPassword.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || "Error al registrar el usuario");
        return;
      }
      if (data.success) {
        setRegisterSuccess(true);
        const registeredEmail = cleanEmail;
        const registeredPassword = regPassword;
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegAvatar("");
        onRefreshUsers?.();
        setTimeout(() => setRegisterSuccess(false), 3000);

        if (profileUser?.isGuest || checkIsGuest(profileUser)) {
          await handleSwitchUser(registeredEmail, registeredPassword);
        }
      }
    } catch (err) {
      console.error("Error registering user:", err);
      setRegisterError("Error de conexión con el servidor.");
    } finally {
      setIsRegistering(false);
      profileRegisteringRef.current = false;
    }
  };

  return (
    <motion.div
      key="admin-edit"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="space-y-6"
      id="profile-config-view"
    >
      <div>
        <h3 className="font-display font-extrabold text-sm text-slate-900 mb-4 flex items-center space-x-2">
          <Settings className="w-4 h-4 text-amber-500" />
          <span>Configuración y Edición de Perfil</span>
        </h3>

        <form
          onSubmit={handleSaveProfile}
          className="space-y-6 bg-slate-50 border border-slate-100 p-6 rounded-2xl"
          id="edit-profile-form"
        >
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2 animate-pulse">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ¡Perfil guardado y sincronizado con éxito! Todos los cambios están activos.
              </span>
            </div>
          )}

          {saveError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Nombre Completo
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                placeholder="Tu Nombre"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Contraseña de Perfil (Para Blindaje)
              </label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800 font-mono"
                placeholder="Ingresa una contraseña segura"
                required
              />
            </div>

            

            {/* Saved delivery address */}
            <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">Dirección de entrega</h4>
                <p className="mt-1 text-[11px] text-slate-500">Guarda estos datos para completar automáticamente la información de entrega en tus próximos pedidos.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Calle y número</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Calle, número, sector, edificio o apartamento"
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ciudad</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="Santo Domingo"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">País</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    placeholder="República Dominicana"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 809 000 0000"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Código postal</label>
                  <input
                    type="text"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    placeholder="Código postal"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>

            

            {/* Avatar Image URL Input & Presets */}
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Imagen de Perfil
                </label>
                <div className="flex items-center space-x-4 bg-white p-3 border border-slate-200 rounded-xl">
                  <img
                    src={
                      getMediaUrl(editAvatar) ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    }
                    alt="Previsualización"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      id="avatar-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setEditAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="avatar-file-input"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Subir Foto de Galería</span>
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Sube un archivo PNG, JPG o GIF
                    </p>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                  O bien, elige un estilo rápido:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      name: "Hombre Tech",
                      url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
                    },
                    {
                      name: "Mujer Fit",
                      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                    },
                    {
                      name: "Cyber Maker",
                      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                    },
                    {
                      name: "Elegante",
                      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                    },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(preset.url)}
                      className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-all flex items-center space-x-1 cursor-pointer ${
                        editAvatar === preset.url
                          ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt=""
                        className="w-3.5 h-3.5 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            
          </div>

          {/* Submit Actions Button */}
          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {false && (
        <div className="space-y-6 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
          <div>
            <h3 className="font-display font-extrabold text-sm text-slate-900 mb-1 flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Registrar Nuevo Creador (MongoDB Atlas)</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Crea una cuenta para un nuevo creador de contenido. Se registrará en tiempo real en MongoDB Atlas.
            </p>
          </div>

          {registerSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                ¡Nuevo creador registrado con éxito en MongoDB Atlas! Ya puedes cambiar de cuenta para usarlo.
              </span>
            </div>
          )}

          {registerError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
              <span>{registerError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterUser} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nombre del Creador
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800"
                  placeholder="Ej: Carlos Gómez"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Correo electrónico</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800" placeholder="correo@ejemplo.com" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800 font-mono"
                  placeholder="Crea una contraseña"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Biografía / Presentación
                </label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800 resize-none"
                  placeholder="Escribe algo sobre este nuevo creador..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Imagen de Perfil
                </label>
                <div className="flex items-center space-x-3 bg-white p-2.5 border border-slate-200 rounded-xl">
                  <img
                    src={
                      regAvatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                    }
                    alt="Preview avatar"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      id="reg-avatar-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setRegAvatar(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="reg-avatar-file-input"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
                    >
                      <Camera className="w-3 h-3 text-slate-500" />
                      <span>Elegir Foto</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Foto de Portada
                </label>
                <div className="flex items-center space-x-3 bg-white p-2.5 border border-slate-200 rounded-xl">
                  <div className="w-12 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img
                      src={
                        regCoverPhoto ||
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                      }
                      alt="Preview cover"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="reg-cover-file-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === "string") {
                              setRegCoverPhoto(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="reg-cover-file-input"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
                    >
                      <Camera className="w-3 h-3 text-slate-500" />
                      <span>Elegir Banner</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-end space-x-3">
              <button
                type="submit"
                disabled={isRegistering}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Registrando en MongoDB...</span>
                  </>
                ) : (
                  <span>Registrar Creador</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {false && (
        <div className="space-y-6 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
          <div>
            <h3 className="font-display font-extrabold text-sm text-slate-900 mb-1 flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Cambiar de Cuenta / Sesión Activa</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Inicia sesión o cámbiate al perfil de cualquiera de los siguientes creadores de la plataforma. El perfil seleccionado se convertirá en la sesión activa y guardará sus datos a través de la API.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users
              .filter((u) => u.id !== "current_user" && !checkIsGuest(u))
              .map((u, index) => {
                const isTargetSelected = switchingUser?.id === u.id;
                return (
                  <div
                    key={`${u.id}-${index}`}
                    className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-500/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            u.avatar ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                          }
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-150 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{u.name}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            {u.name}
                          </p>
                        </div>
                      </div>

                      {!isTargetSelected && (
                        <button
                          type="button"
                          onClick={() => {
                            setSwitchingUser(u);
                            setSwitchPassword("");
                            setSwitchError("");
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          Entrar
                        </button>
                      )}
                    </div>

                    {isTargetSelected && (
                      <div className="mt-3 pt-3 border-t border-slate-100 w-full">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase mb-1">
                          Contraseña de {u.name}:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="password"
                            value={switchPassword}
                            onChange={(e) => setSwitchPassword(e.target.value)}
                            placeholder="Contraseña"
                            className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSwitchUser(u.email || "", switchPassword);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSwitchUser(u.email || "", switchPassword)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSwitchingUser(null);
                              setSwitchPassword("");
                              setSwitchError("");
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer shrink-0"
                          >
                            X
                          </button>
                        </div>
                        {switchError && (
                          <p className="text-[10px] text-rose-500 mt-1 font-semibold font-mono">
                            ⚠️ {switchError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default ConfigPerfilView;
