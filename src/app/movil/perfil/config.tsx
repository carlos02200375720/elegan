import React, { useState } from "react";
import { User } from "../../../types";
import { X, Camera, Check, Sparkles, User as UserIcon, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { androidApiFetch } from "../api";
import { isSuperAdmin } from "../../../superAdmin";

export interface ConfigPerfilProps {
  activeUser: User;
  currentUser: User;
  onProfileUpdate?: (updatedUser: User) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function ConfigPerfilView({
  activeUser,
  currentUser,
  onProfileUpdate,
  onUpdateUser,
  onClose,
  isOpen = true,
}: ConfigPerfilProps) {
  const [editName, setEditName] = useState(activeUser.name || "");
  const [editAvatar, setEditAvatar] = useState(activeUser.avatar || "");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const targetUserId = activeUser.originalId || activeUser.id || currentUser.originalId || currentUser.id;

    try {
      let res = await androidApiFetch("/users/current/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          name: editName.trim(),
          avatar: editAvatar.trim(),
        }),
      });

      if (!res.ok) {
        res = await fetch("/api/android/users/current/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: targetUserId,
            name: editName.trim(),
            avatar: editAvatar.trim(),
          }),
        });
      }

      if (!res.ok) {
        res = await fetch("/api/users/current/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: targetUserId,
            name: editName.trim(),
            avatar: editAvatar.trim(),
          }),
        });
      }

      if (res.ok) {
        const updated = {
          ...activeUser,
          name: editName.trim(),
          avatar: editAvatar.trim(),
        };
        if (onProfileUpdate) onProfileUpdate(updated);
        if (onUpdateUser) onUpdateUser(updated);
        setStatusMessage({ type: "success", text: "¡Perfil actualizado con éxito!" });
        setTimeout(() => {
          if (onClose) onClose();
        }, 600);
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: data.error || "No se pudo actualizar el perfil" });
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs" id="android-profile-config-modal">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="w-full max-h-[90vh] bg-white border-t border-slate-200 rounded-t-3xl p-5 text-slate-900 shadow-2xl flex flex-col overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Editar Perfil de Android</span>
              {isSuperAdmin(activeUser) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-black">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>SUPERADMIN</span>
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

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="py-4 space-y-4">
            {/* Avatar Preview & URL */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={editAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-md bg-white"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
                  }}
                />
                <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-sm">
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">@{activeUser.username}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Foto de Perfil</label>
              <input
                type="url"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
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

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 shadow-sm cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Actualizar Perfil</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export { ConfigPerfilView as Config };
export default ConfigPerfilView;
