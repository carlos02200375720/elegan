import React, { useState } from "react";
import { X, Mail, Check, AlertCircle, ShoppingBag, Bookmark, MapPin, Sparkles, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Order, CartItem } from "../../../types";
import { androidApi } from "../api";
import { sessionState } from "../../../utils/sessionState";

export interface AndroidEmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (data: {
    user: User;
    orders?: Order[];
    cart?: CartItem[];
    savedReelIds?: string[];
  }) => void;
}

export function AndroidEmailLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: AndroidEmailLoginModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage("Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await androidApi.loginWithEmail(emailInput.trim());

      if (data && data.success && data.user) {
        const loggedUser: User = data.user;
        const userOrders: Order[] = data.orders || [];
        const userCart: CartItem[] = data.cart || [];
        const userSavedReels: string[] = data.savedReelIds || loggedUser.savedReelIds || [];

        // 1. Persistir sesión globalmente
        sessionState.setUser(loggedUser);
        sessionState.setAuthenticated(true);
        sessionState.setUsername(loggedUser.username);

        try {
          localStorage.setItem("mall_user", JSON.stringify(loggedUser));
          localStorage.setItem("mall_authenticated", "true");
          localStorage.setItem("mall_username", loggedUser.username);

          // 2. Guardar historial de compras para que se restaure inmediatamente
          const uId = loggedUser.originalId || loggedUser.id;
          localStorage.setItem(`mall_user_orders_${uId}`, JSON.stringify(userOrders));
          localStorage.setItem(`mall_user_orders_${loggedUser.id}`, JSON.stringify(userOrders));

          // 3. Restaurar carrito guardado
          if (userCart.length > 0) {
            localStorage.setItem("android_mall_cart", JSON.stringify(userCart));
            localStorage.setItem("mall_cart", JSON.stringify(userCart));
          }

          // 4. Restaurar reels y productos guardados
          if (userSavedReels.length > 0) {
            localStorage.setItem("mall_saved_reels", JSON.stringify(userSavedReels));
          }
        } catch (e) {
          console.warn("Error caching restored user data:", e);
        }

        // 5. Emitir eventos del navegador para actualizar vistas en vivo
        window.dispatchEvent(new CustomEvent("mall_user_changed", { detail: loggedUser }));
        window.dispatchEvent(new CustomEvent("mall_order_created", { detail: userOrders[0] }));
        if (userCart.length > 0) {
          window.dispatchEvent(new CustomEvent("mall_cart_updated", { detail: userCart }));
        }

        setSuccessMessage(
          data.message || `¡Bienvenido/a de nuevo, ${loggedUser.name}! Tu perfil ha sido restaurado.`
        );

        // Notificar al componente padre
        onLoginSuccess({
          user: loggedUser,
          orders: userOrders,
          cart: userCart,
          savedReelIds: userSavedReels,
        });

        setTimeout(() => {
          onClose();
          setEmailInput("");
          setSuccessMessage(null);
        }, 1200);
      } else {
        setErrorMessage(
          data?.error ||
            "No encontramos ninguna cuenta con este correo. Verifica que esté bien escrito o regístralo primero en tu perfil."
        );
      }
    } catch (err: any) {
      console.error("Error al iniciar sesión con correo en Android:", err);
      setErrorMessage(err.message || "Error al conectar con la base de datos.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4" id="android-email-login-modal">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-3xl p-6 text-slate-900 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">Iniciar Sesión con Correo</h2>
                <p className="text-[10px] text-slate-500 font-medium">Recupera tu perfil y todos tus datos</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer rounded-full active:scale-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Información de lo que se recuperará */}
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              ¿Cambiaste de celular o perdiste tu dispositivo? Solo escribe tu correo para restaurar automáticamente:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Foto y Nombre</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Historial de Compras</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Tus Guardados</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Dirección y Ciudad</span>
              </span>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Correo Electrónico Registrado
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3.5 py-3 bg-slate-50 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white border border-slate-200 font-medium transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Debe coincidir con el correo que guardaste en tu perfil o al realizar compras.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl text-xs font-bold flex items-start gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl text-xs font-bold flex items-start gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-tight">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs active:scale-95 shadow-md cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Consultando base de datos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Iniciar Sesión y Recuperar Datos</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AndroidEmailLoginModal;
