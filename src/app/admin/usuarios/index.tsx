import React from "react";
import { Search } from "lucide-react";
import TablaUsuarios from "./tabla_usuarios";
import ModalEliminacionUsuario from "./modal_eliminacion";
import { useEstadoUsuarios } from "./estado";
import { UsuariosAdminProps } from "./tipos";

export type { UsuariosAdminProps } from "./tipos";

export default function UsuariosAdminView({
  currentUser,
  users,
  setUsers,
  onCreatorClick,
  onStatusMessage,
  onRequestDeleteUser,
}: UsuariosAdminProps) {
  const {
    userSearch,
    setUserSearch,
    filteredUsers,
    updatingPermissionId,
    localDeletingUser,
    setLocalDeletingUser,
    isDeleting,
    handleToggleSellerPermission,
    confirmLocalDeleteUser,
  } = useEstadoUsuarios({ currentUser, users, setUsers, onStatusMessage });

  return (
    <div
      className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5"
      id="admin-tab-content-users"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Gestión de Usuarios</h2>
          <p className="text-xs text-slate-500">
            Directorio oficial de cuentas registradas en la base de datos.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <TablaUsuarios
        users={filteredUsers}
        currentUserId={currentUser.id}
        updatingPermissionId={updatingPermissionId}
        onCreatorClick={onCreatorClick}
        onToggleSellerPermission={handleToggleSellerPermission}
        onRequestDeleteUser={onRequestDeleteUser}
        onLocalDelete={setLocalDeletingUser}
      />

      <ModalEliminacionUsuario
        usuario={localDeletingUser}
        isDeleting={isDeleting}
        onCancel={() => setLocalDeletingUser(null)}
        onConfirm={confirmLocalDeleteUser}
      />
    </div>
  );
}
