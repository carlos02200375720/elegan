import React, { useMemo, useState } from "react";
import { User } from "../tipos";
import { apiFetch } from "../config";
import { isSuperAdmin } from "../superAdmin";
import { EstadoUsuarios, UsuarioEliminar } from "./tipos";

interface Props {
  currentUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
}

export function useEstadoUsuarios({
  currentUser,
  users,
  setUsers,
  onStatusMessage,
}: Props): EstadoUsuarios {
  const [userSearch, setUserSearch] = useState("");
  const [updatingPermissionId, setUpdatingPermissionId] = useState<string | null>(null);
  const [localDeletingUser, setLocalDeletingUser] = useState<UsuarioEliminar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const notify = (msg: { type: "success" | "error" | "info"; text: string }) => {
    if (onStatusMessage) {
      onStatusMessage(msg);
      setTimeout(() => onStatusMessage(null), 4000);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        user.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const handleToggleSellerPermission = async (user: User) => {
    if (user.id === currentUser.id || updatingPermissionId) return;
    const nextCanSell = user.canSell !== true;
    setUpdatingPermissionId(user.id);
    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(user.id)}/permission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canSell: nextCanSell }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) {
        throw new Error(data.error || "No se pudo actualizar el permiso.");
      }
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, canSell: data.canSell === true } : item
        )
      );
      notify({
        type: "success",
        text: nextCanSell
          ? `${user.name} ahora tiene permisos de vendedor.`
          : `Se retiraron los permisos de vendedor de ${user.name}.`,
      });
    } catch (err: any) {
      console.error("Error updating seller permission:", err);
      notify({
        type: "error",
        text: err.message || "Error al actualizar el permiso.",
      });
    } finally {
      setUpdatingPermissionId(null);
    }
  };

  const confirmLocalDeleteUser = async () => {
    if (!localDeletingUser) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/users/${localDeletingUser.id}`, { method: "DELETE" });
      if (res) {
        setUsers((prev) => prev.filter((user) => user.id !== localDeletingUser.id));
        notify({
          type: "success",
          text: `Usuario @${localDeletingUser.name} eliminado de la base de datos.`,
        });
      }
    } catch (err: any) {
      console.error("Error deleting user in admin:", err);
      notify({
        type: "error",
        text: err.message || "Error al procesar la eliminación",
      });
    } finally {
      setIsDeleting(false);
      setLocalDeletingUser(null);
    }
  };

  return {
    userSearch,
    setUserSearch,
    filteredUsers,
    updatingPermissionId,
    localDeletingUser,
    setLocalDeletingUser,
    isDeleting,
    handleToggleSellerPermission,
    confirmLocalDeleteUser,
  };
}
