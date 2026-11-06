import React from "react";
import { User } from "../../../types";
import FilaUsuario from "./fila_usuario";
import { UsuarioEliminar } from "./tipos";

interface Props {
  users: User[];
  currentUserId: string;
  updatingPermissionId: string | null;
  onCreatorClick: (creatorId: string) => void;
  onToggleSellerPermission: (user: User) => void;
  onRequestDeleteUser?: (target: { type: "user"; id: string; name: string }) => void;
  onLocalDelete: (user: UsuarioEliminar) => void;
}

export default function TablaUsuarios({
  users,
  currentUserId,
  updatingPermissionId,
  onCreatorClick,
  onToggleSellerPermission,
  onRequestDeleteUser,
  onLocalDelete,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] tracking-wider border-y border-slate-100">
          <tr>
            <th className="py-3 px-4">Cliente</th>
            <th className="py-3 px-4">Correo Electrónico</th>
            <th className="py-3 px-4">Teléfono</th>
            <th className="py-3 px-4">Estado</th>
            <th className="py-3 px-4">Permiso</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-10 text-center text-slate-400">
                No se encontraron usuarios que coincidan con la búsqueda.
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <FilaUsuario
                key={`${user.id}-${index}`}
                user={user}
                index={index}
                currentUserId={currentUserId}
                updatingPermissionId={updatingPermissionId}
                onCreatorClick={onCreatorClick}
                onToggleSellerPermission={onToggleSellerPermission}
                onRequestDeleteUser={onRequestDeleteUser}
                onLocalDelete={onLocalDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
