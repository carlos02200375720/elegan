import React from "react";
import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { User } from "../tipos";
import { isSuperAdmin } from "../superAdmin";
import { UsuarioEliminar } from "./tipos";

interface Props {
  user: User;
  index: number;
  currentUserId: string;
  updatingPermissionId: string | null;
  onCreatorClick: (creatorId: string) => void;
  onToggleSellerPermission: (user: User) => void;
  onRequestDeleteUser?: (target: { type: "user"; id: string; name: string }) => void;
  onLocalDelete: (user: UsuarioEliminar) => void;
}

export default function FilaUsuario({
  user,
  index,
  currentUserId,
  updatingPermissionId,
  onCreatorClick,
  onToggleSellerPermission,
  onRequestDeleteUser,
  onLocalDelete,
}: Props) {
  const userIsSuperAdmin = isSuperAdmin(user);

  return (
    <tr
      key={`${user.id}-${index}`}
      className={`hover:bg-slate-50/80 transition-colors ${userIsSuperAdmin ? "bg-amber-500/5" : ""}`}
    >
      <td className="py-3.5 px-4">
        <div className="flex items-center space-x-3">
          <img
            src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
            alt={user.name}
            className={`w-9 h-9 rounded-full object-cover border shrink-0 ${userIsSuperAdmin ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-200"}`}
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-slate-900">{user.name}</p>
              {userIsSuperAdmin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Superadmin</span>
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-slate-400">{user.email || user.name}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 font-mono text-slate-600">{user.email || "No especificado"}</td>
      <td className="py-3.5 px-4 font-mono text-slate-700">{user.phone || "No especificado"}</td>
      <td className="py-3.5 px-4">
        <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isOnline ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span>{user.isOnline ? "En línea" : "Desconectado"}</span>
        </span>
      </td>
      <td className="py-3.5 px-4">
        {userIsSuperAdmin ? (
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[11px] shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Acceso Total</span>
            </span>
            <p className="mt-0.5 text-[9px] font-bold text-amber-700">Superadministrador</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onToggleSellerPermission(user)}
              disabled={updatingPermissionId === user.id}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${user.canSell ? "bg-emerald-500" : "bg-slate-300"}`}
              title={user.canSell ? "Permiso activo: publicar, productos y rendimiento" : "Activar permisos de vendedor"}
              aria-label={user.canSell ? "Desactivar permiso de vendedor" : "Activar permiso de vendedor"}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${user.canSell ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <p className={`mt-1 text-[9px] font-bold ${user.canSell ? "text-emerald-600" : "text-slate-400"}`}>
              {updatingPermissionId === user.id ? "Guardando..." : user.canSell ? "Vendedor" : "Normal"}
            </p>
          </>
        )}
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="inline-flex items-center space-x-2">
          <button
            onClick={() => onCreatorClick(user.id)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Ver perfil"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          {user.id !== currentUserId && !userIsSuperAdmin && (
            <button
              onClick={() => {
                if (onRequestDeleteUser) {
                  onRequestDeleteUser({ type: "user", id: user.id, name: user.name });
                } else {
                  onLocalDelete({ id: user.id, name: user.name });
                }
              }}
              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
              title="Eliminar usuario"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
