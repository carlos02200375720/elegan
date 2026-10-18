import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShoppingBag, UserRound } from "lucide-react";
import { CartItem, Order, User } from "../../../types";
import { androidApi } from "../api";
import { getLocalGuestToken, removeLocalGuestToken } from "../../../utils/guestToken";
import { sessionState } from "../../../utils/sessionState";

type AuthMode = "register" | "login";

interface PerfilLoginProps {
  currentUser: User;
  cart: CartItem[];
  savedReelIds: string[];
  onBack: () => void;
  onSuccess: (user: User) => void;
}

export default function PerfilLogin({
  currentUser,
  cart,
  savedReelIds,
  onBack,
  onSuccess,
}: PerfilLoginProps) {
  const [mode, setMode] = useState<AuthMode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "login"
      ? "login"
      : "register"
  );
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const finishAuthentication = (
    user: User,
    orders: Order[],
    restoredCart?: CartItem[],
    restoredSavedReels?: string[]
  ) => {
    sessionState.setUser(user);
    sessionState.setAuthenticated(true);
    sessionState.setUsername(user.username);
    removeLocalGuestToken();

    const savedIds = restoredSavedReels || user.savedReelIds || [];
    try {
      localStorage.setItem("mall_user", JSON.stringify(user));
      localStorage.setItem("mall_authenticated", "true");
      localStorage.setItem("mall_username", user.username);
      const userId = user.originalId || user.id;
      localStorage.setItem(`mall_user_orders_${userId}`, JSON.stringify(orders));
      localStorage.setItem(`mall_user_orders_${user.id}`, JSON.stringify(orders));
      localStorage.setItem("mall_saved_reels", JSON.stringify(savedIds));
    } catch (storageError) {
      console.warn("No se pudieron guardar los datos de sesión en este dispositivo:", storageError);
    }

    window.dispatchEvent(new CustomEvent("mall_user_changed", { detail: user }));
    if (restoredCart) {
      window.dispatchEvent(new CustomEvent("mall_cart_updated", { detail: restoredCart }));
    }
    onSuccess(user);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (mode === "register") {
      if (!name.trim() || !username.trim() || !cleanEmail) {
        setError("Completa tu nombre, usuario y correo electrónico.");
        return;
      }
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (password !== passwordConfirmation) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    } else if (!cleanEmail || !password) {
      setError("Escribe el correo y la contraseña de tu cuenta.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "register") {
        const guestToken = getLocalGuestToken() || currentUser.guestToken;
        const response = await androidApi.registerUser({
          name: name.trim(),
          username: username.trim().replace(/^@/, ""),
          email: cleanEmail,
          password,
          guestToken,
          guestId: currentUser.originalId || currentUser.id,
          guestUsername: currentUser.username,
          savedReelIds,
          cart,
        });

        if (!response?.success || !response.user) {
          throw new Error(response?.error || "No se pudo crear tu cuenta.");
        }

        finishAuthentication(
          response.user,
          Array.isArray(response.orders) ? response.orders : [],
          Array.isArray(response.cart) ? response.cart : [],
          response.savedReelIds
        );
        return;
      }

      const response = await androidApi.loginUser(cleanEmail, password);
      if (!response?.success || !response.user) {
        throw new Error(response?.error || "No se pudo iniciar sesión.");
      }

      const userId = response.user.originalId || response.user.id;
      const [cartResponse, ordersResponse] = await Promise.all([
        androidApi.getCart(userId),
        androidApi.getUserOrders(userId),
      ]);
      finishAuthentication(
        response.user,
        ordersResponse,
        Array.isArray(cartResponse?.items) ? cartResponse.items : [],
        response.user.savedReelIds
      );
    } catch (authError) {
      console.error("Error en el acceso al perfil móvil:", authError);
      setError(authError instanceof Error ? authError.message : "No se pudo completar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-5 pb-28 pt-[max(32px,env(safe-area-inset-top,32px))] text-slate-900">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 flex w-fit items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-sm">
          <UserRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          {mode === "register" ? "Crea tu cuenta" : "Inicia sesión"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {mode === "register"
            ? "Al registrarte conservaremos tus compras, productos del carrito y elementos guardados como invitado."
            : "Accede a tu cuenta para recuperar tus compras, carrito y datos de perfil."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
          {(["register", "login"] as const).map((authMode) => (
            <button
              key={authMode}
              type="button"
              onClick={() => {
                setMode(authMode);
                setError("");
              }}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {mode === "register" && (
            <>
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
              <label className="block text-xs font-bold text-slate-700">
                Nombre de usuario
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
                  placeholder="tunombre"
                />
              </label>
            </>
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

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-3.5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Procesando..."
              : mode === "register"
                ? "Crear cuenta y guardar mis datos"
                : "Iniciar sesión y recuperar mis datos"}
          </button>
        </form>
      </div>
    </main>
  );
}
