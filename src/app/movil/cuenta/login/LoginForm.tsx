import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { CartItem } from "../../tipos";
import { AuthMode } from "./usePerfilLogin";

interface LoginFormProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  passwordConfirmation: string;
  setPasswordConfirmation: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean | ((current: boolean) => boolean)) => void;
  cart: CartItem[];
  savedReelIds: string[];
  error: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function LoginForm({
  mode, setMode, name, setName, email, setEmail, password, setPassword,
  passwordConfirmation, setPasswordConfirmation, showPassword, setShowPassword,
  cart, savedReelIds, error, onSubmit,
}: LoginFormProps) {
  return (
    <>
      <div className="mt-2 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
        {(["register", "login"] as const).map((authMode) => (
          <button
            key={authMode}
            type="button"
            onClick={() => setMode(authMode)}
            className={`rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              mode === authMode ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {authMode === "register" ? "Registrarme" : "Iniciar sesión"}
          </button>
        ))}
      </div>

      {mode === "register" && (cart.length > 0 || savedReelIds.length > 0) && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-950">
          <ShoppingBag className="h-5 w-5 shrink-0" />
          <span>
            Migramos {cart.length} producto(s) del carrito y {savedReelIds.length} elemento(s) guardado(s) a tu cuenta.
          </span>
        </div>
      )}

      <form id="perfil-login-form" onSubmit={onSubmit} className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {mode === "register" && (
          <label className="block text-xs font-bold text-slate-700">
            Nombre
            <input
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
              placeholder="Tu nombre"
            />
          </label>
        )}

        <label className="block text-xs font-bold text-slate-700">
          Correo electrónico
          <span className="relative mt-1.5 block">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm outline-none focus:border-amber-400 focus:bg-white"
              placeholder="tu@correo.com"
            />
          </span>
        </label>

        <label className="block text-xs font-bold text-slate-700">
          Contraseña
          <span className="relative mt-1.5 block">
            <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-amber-400 focus:bg-white"
              placeholder={mode === "register" ? "Mínimo 8 caracteres" : "Tu contraseña"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-3 text-slate-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>

        {mode === "register" && (
          <label className="block text-xs font-bold text-slate-700">
            Confirmar contraseña
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
              placeholder="Repite tu contraseña"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700">
            {error}
          </p>
        )}
      </form>
    </>
  );
}
