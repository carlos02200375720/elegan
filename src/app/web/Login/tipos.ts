import type { User } from "../../../types";

export interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onRefreshUsers: () => void;
  users: User[];
  currentUser?: User | null;
  initialTab?: "login" | "register";
  restrictionNotice?: string;
}

export type PestañaAcceso = "login" | "register";

export interface EstadoFormularioAcceso {
  pestaña: PestañaAcceso;
  setPestaña: (pestaña: PestañaAcceso) => void;
  correo: string;
  setCorreo: (valor: string) => void;
  contraseña: string;
  setContraseña: (valor: string) => void;
  errorAcceso: string;
  cargandoAcceso: boolean;
  nombre: string;
  setNombre: (valor: string) => void;
  correoRegistro: string;
  setCorreoRegistro: (valor: string) => void;
  contraseñaRegistro: string;
  setContraseñaRegistro: (valor: string) => void;
  errorRegistro: string;
  cargandoRegistro: boolean;
  iniciarSesion: (evento: React.FormEvent) => Promise<void>;
  registrar: (evento: React.FormEvent) => Promise<void>;
}
