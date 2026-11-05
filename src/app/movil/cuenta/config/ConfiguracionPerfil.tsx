import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";
import { User } from "../../../../types";
import { isSuperAdmin } from "../../../../superAdmin";
import { navigateTo } from "../../../../router";
import EncabezadoConfiguracion from "./EncabezadoConfiguracion";
import FotoPerfil from "./FotoPerfil";
import DatosPersonales from "./DatosPersonales";
import DireccionEntrega from "./DireccionEntrega";
import EstadoConfiguracion from "./EstadoConfiguracion";
import PieConfiguracion from "./PieConfiguracion";
import useConfiguracionPerfil from "./useConfiguracionPerfil";

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
  const configuracion = useConfiguracionPerfil({
    activeUser,
    currentUser,
    onProfileUpdate,
    onUpdateUser,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs" id="android-profile-config-modal">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 220 }} className="w-full max-h-[90vh] bg-white border-t border-slate-200 rounded-t-3xl text-slate-900 shadow-2xl flex flex-col overflow-hidden">
        <EncabezadoConfiguracion
          verificado={isSuperAdmin(activeUser)}
          onClose={onClose}
        />
        <form onSubmit={configuracion.guardarPerfil} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <FotoPerfil
              avatar={configuracion.editAvatar}
              correo={activeUser.email}
              onSelect={configuracion.seleccionarFoto}
            />
            <DatosPersonales
              nombre={configuracion.editName}
              correo={configuracion.editEmail}
              telefono={configuracion.editPhone}
              onNombreChange={configuracion.setEditName}
              onCorreoChange={configuracion.setEditEmail}
              onTelefonoChange={configuracion.setEditPhone}
            />
            <DireccionEntrega
              direccion={configuracion.editAddress}
              ciudad={configuracion.editCity}
              pais={configuracion.editCountry}
              codigoPostal={configuracion.editPostalCode}
              onDireccionChange={configuracion.setEditAddress}
              onCiudadChange={configuracion.setEditCity}
              onPaisChange={configuracion.setEditCountry}
              onCodigoPostalChange={configuracion.setEditPostalCode}
            />
            <EstadoConfiguracion mensaje={configuracion.statusMessage} />
            {onLogout && (
              <div className="pt-4 pb-2 border-t border-slate-100 flex flex-col items-center">
                <button
                  type="button"
                  id="mobile-profile-logout-btn"
                  onClick={() => {
                    onClose?.();
                    onLogout();
                    navigateTo("/perfil/login?mode=login");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/80 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 font-bold text-xs group"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <><LogOut className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" /><span className="text-rose-700">Cerrar sesión</span></>
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Cerrarás la sesión en este dispositivo móvil de forma segura.
                </p>
              </div>
            )}
          </div>
          <PieConfiguracion guardando={configuracion.isSaving} />
        </form>
      </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ConfigPerfilView;
