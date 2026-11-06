import { useState } from "react";
import { CartItem, Order, User } from "../../tipos";
import { androidApi } from "../../api";
import { getLocalGuestToken } from "../../guestToken";
import { sesionMovil } from "../../sesion";
import { mergeCartItems } from "./mergeCartItems";

export type AuthMode = "register" | "login";

interface UsePerfilLoginProps {
  currentUser: User;
  cart: CartItem[];
  savedReelIds: string[];
  onSuccess: (user: User, restoredCart?: CartItem[]) => void;
}

export function usePerfilLogin({
  currentUser,
  cart,
  savedReelIds,
  onSuccess,
}: UsePerfilLoginProps) {
  const [mode, setMode] = useState<AuthMode>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "login"
      ? "login"
      : "register"
  );
  const [name, setName] = useState("");
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
    sesionMovil.setUser(user);
    sesionMovil.setAuthenticated(true);
    sesionMovil.setEmail(user.email || "");

    const savedIds = restoredSavedReels || user.savedReelIds || [];
    try {
      localStorage.setItem("mall_user", JSON.stringify(user));
      localStorage.setItem("mall_authenticated", "true");
      localStorage.setItem("mall_username", user.email || "");
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
    onSuccess(user, restoredCart);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (mode === "register") {
      if (!name.trim() || !cleanEmail) {
        setError("Completa tu nombre y correo electrónico.");
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
          email: cleanEmail,
          password,
          guestToken,
          guestId: currentUser.originalId || currentUser.id,
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
      const guestToken = getLocalGuestToken() || currentUser.guestToken;
      const [cartResponse, ordersResponse, guestCartResponse] = await Promise.all([
        androidApi.getCart(userId),
        androidApi.getUserOrders(userId),
        guestToken && guestToken !== userId
          ? androidApi.getCart(guestToken).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ]);
      const restoredCart = mergeCartItems([
        Array.isArray(cartResponse?.items) ? cartResponse.items : [],
        Array.isArray(guestCartResponse?.items) ? guestCartResponse.items : [],
        cart,
      ]);
      if (restoredCart.length > 0) {
        try {
          await androidApi.saveCart(userId, restoredCart);
        } catch (cartError) {
          console.warn("No se pudo sincronizar el carrito recuperado con la cuenta:", cartError);
        }
      }
      finishAuthentication(
        response.user,
        ordersResponse,
        restoredCart,
        response.user.savedReelIds
      );
    } catch (authError) {
      console.error("Error en el acceso al perfil móvil:", authError);
      setError(authError instanceof Error ? authError.message : "No se pudo completar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mode, setMode, name, setName, email, setEmail, password, setPassword,
    passwordConfirmation, setPasswordConfirmation, showPassword, setShowPassword,
    isLoading, error, setError, handleSubmit,
  };
}
