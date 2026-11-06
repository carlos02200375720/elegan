import React from "react";
import { User } from "../../../types";

export interface UsuariosAdminProps {
  currentUser: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onCreatorClick: (creatorId: string) => void;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
  onRequestDeleteUser?: (target: { type: "user"; id: string; name: string }) => void;
}

export interface UsuarioEliminar {
  id: string;
  name: string;
}

export interface EstadoUsuarios {
  userSearch: string;
  setUserSearch: (value: string) => void;
  filteredUsers: User[];
  updatingPermissionId: string | null;
  localDeletingUser: UsuarioEliminar | null;
  setLocalDeletingUser: (value: UsuarioEliminar | null) => void;
  isDeleting: boolean;
  handleToggleSellerPermission: (user: User) => Promise<void>;
  confirmLocalDeleteUser: () => Promise<void>;
}
