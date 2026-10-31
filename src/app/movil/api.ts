import { sessionState } from "../../utils/sessionState";
import { User, Reel, Product, CartItem, Order, ChatMessage } from "../../types";
import { BACKEND_URL, CLOUD_RUN_BACKEND_URL, isExternalStaticHost } from "../../config";

/**
 * Single Android network layer.
 * Native Android always talks to the configured backend and never falls back
 * to a second/unknown origin.
 */
export { BACKEND_URL, CLOUD_RUN_BACKEND_URL };

export const isAndroidNative = (): boolean => {
  if (typeof window === "undefined") return false;
  const win = window as any;
  if (typeof win.Capacitor?.isNativePlatform === "function" && win.Capacitor.isNativePlatform()) return true;
  if (win.Capacitor?.getPlatform && (win.Capacitor.getPlatform() === "android" || win.Capacitor.getPlatform() === "ios")) return true;
  const proto = window.location?.protocol || "";
  return proto === "capacitor:" || proto === "file:" || proto === "ionic:" || proto === "app:";
};

export const getAndroidApiUrl = (endpoint: string): string => {
  let clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (clean.startsWith("/api/android/")) {
    // already canonical
  } else if (clean.startsWith("/api/")) {
    clean = clean.replace(/^\/api/, "/api/android");
  } else {
    clean = `/api/android${clean}`;
  }

  // When running in a standard web browser (preview, local dev) and NOT on an external static host:
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.protocol.startsWith("http") &&
    !isAndroidNative() &&
    !isExternalStaticHost()
  ) {
    return clean;
  }

  const base = (BACKEND_URL || CLOUD_RUN_BACKEND_URL || "").replace(/\/$/, "");
  if (!base) {
    return clean;
  }
  return `${base}${clean}`;
};

const readResponseBody = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`El backend respondió JSON inválido (HTTP ${response.status}).`);
    }
  }

  // Never let JSON.parse turn an HTML/proxy error into "Unexpected token '<'".
  const preview = text.replace(/\s+/g, " ").slice(0, 180);
  if (/^<!doctype html/i.test(text) || /<html[\s>]/i.test(text)) {
    throw new Error(
      `El backend respondió HTML en vez de JSON (HTTP ${response.status}). ` +
      `Verifica que el servicio API esté disponible.`
    );
  }

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${preview}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respuesta inesperada del backend (HTTP ${response.status}): ${preview}`);
  }
};

export const androidApiFetch = async (
  endpoint: string,
  init?: RequestInit,
  timeoutMs: number = 60000
): Promise<Response> => {
  const url = getAndroidApiUrl(endpoint);
  const headers = new Headers(init?.headers);

  headers.set("Accept", "application/json");
  headers.set("X-Platform", "android");
  headers.set("X-Client-Platform", "android");
  headers.set("X-Client-App", "MallSocial-Android");
  headers.set("X-Client-Version", "1.0.0-android");

  if (typeof window !== "undefined") {
    try {
      const loggedInUsername = sessionState.getUsername();
      const currentUserData = JSON.stringify(sessionState.getUser());
      if (loggedInUsername && loggedInUsername !== "invitado" && loggedInUsername !== "guest") {
        headers.set("x-user-username", loggedInUsername);
      }
      if (currentUserData) {
        const parsed = JSON.parse(currentUserData);
        if (parsed?.username && parsed.username !== "invitado") {
          if (!headers.has("x-user-username")) headers.set("x-user-username", parsed.username);
          if (parsed.originalId || parsed.id) headers.set("x-user-id", parsed.originalId || parsed.id);
        }
      }

      const storedGuestToken = localStorage.getItem("mall_guest_access_token");
      if (storedGuestToken && !headers.has("x-guest-token")) {
        headers.set("x-guest-token", storedGuestToken);
      }
    } catch {
      // Ignore malformed local session data; the server can treat the request as guest.
    }
  }

  const isUpload = endpoint.includes("upload") || (init?.body instanceof FormData);
  const effectiveTimeout = isUpload ? 300000 : timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  const signal = init?.signal || controller.signal;

  try {
    const res = await fetch(url, { ...init, headers, signal });
    // If the remote server returned a 5xx server error, and we are in a web browser, try local fallback
    if (!res.ok && res.status >= 500 && typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const localClean = cleanEndpoint.startsWith("/api/android") ? cleanEndpoint : `/api/android${cleanEndpoint}`;
      if (url !== localClean) {
        try {
          const localRes = await fetch(localClean, { ...init, headers, signal });
          if (localRes.ok) return localRes;
        } catch {}
      }
    }
    return res;
  } catch (err: any) {
    if (signal.aborted) {
      if (controller.signal.aborted) {
        throw new Error(`La solicitud tardó más de ${Math.round(effectiveTimeout / 1000)} segundos.`);
      }
      throw err;
    }
    // Fallback to relative URL if remote backend failed to connect and in browser
    if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const localClean = cleanEndpoint.startsWith("/api/android") ? cleanEndpoint : `/api/android${cleanEndpoint}`;
      if (url !== localClean) {
        try {
          return await fetch(localClean, { ...init, headers, signal });
        } catch {}
      }
    }
    throw new Error(`No se pudo conectar con el backend Android: ${err?.message || "error de red"}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const androidApi = {
  getHealth: async () => {
    const res = await androidApiFetch("/health");
    return readResponseBody(res);
  },

  getReels: async (): Promise<Reel[]> => {
    const res = await androidApiFetch("/reels");
    return readResponseBody(res);
  },

  likeReel: async (reelId: string, userId: string, username: string) => {
    const res = await androidApiFetch(`/reels/${reelId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, username }),
    });
    return readResponseBody(res);
  },

  commentReel: async (reelId: string, data: { userId: string; username: string; avatar: string; text: string }) => {
    const res = await androidApiFetch(`/reels/${reelId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return readResponseBody(res);
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await androidApiFetch("/products");
    return readResponseBody(res);
  },

  getUsers: async (): Promise<User[]> => {
    const res = await androidApiFetch("/users");
    return readResponseBody(res);
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const res = await androidApiFetch("/users/current_user");
    return readResponseBody(res);
  },

  switchUser: async (targetUsername: string, password?: string, isSessionRestore?: boolean) => {
    const res = await androidApiFetch("/users/current/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUsername, password, isSessionRestore }),
    });
    return readResponseBody(res);
  },

  loginUser: async (username: string, password: string) => {
    const res = await androidApiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return readResponseBody(res);
  },

  loginWithEmail: async (email: string) => {
    let res = await androidApiFetch("/auth/email-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok && res.status === 404) {
      res = await fetch("/api/android/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    }
    if (!res.ok && res.status === 404) {
      res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    }
    return readResponseBody(res);
  },

  registerUser: async (registerData: {
    name: string;
    email: string;
    password?: string;
    username?: string;
    avatar?: string;
    coverPhoto?: string;
    bio?: string;
    guestToken?: string;
    guestId?: string;
    guestUsername?: string;
    savedReelIds?: string[];
    cart?: CartItem[];
    address?: string;
    shippingAddress?: string;
    city?: string;
    country?: string;
    phone?: string;
  }) => {
    let res = await androidApiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });
    if (!res.ok && res.status === 404) {
      res = await fetch("/api/android/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
    }
    if (!res.ok && res.status === 404) {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
    }
    return readResponseBody(res);
  },

  logoutUser: async () => {
    const res = await androidApiFetch("/users/current/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return readResponseBody(res);
  },

  toggleSaveReel: async (reelId: string, userId: string, username: string) => {
    const res = await androidApiFetch("/users/current/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reelId, userId, username }),
    });
    return readResponseBody(res);
  },

  getCart: async (userId: string): Promise<{ items: CartItem[] }> => {
    const res = await androidApiFetch(`/cart/${encodeURIComponent(userId)}`);
    return readResponseBody(res);
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const res = await androidApiFetch(`/orders?userId=${encodeURIComponent(userId)}`);
    const data = await readResponseBody(res);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.purchases)) return data.purchases;
    throw new Error("El servidor devolvió un formato inesperado al cargar tus compras.");
  },

  saveCart: async (userId: string, items: CartItem[]) => {
    const res = await androidApiFetch(`/cart/${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    return readResponseBody(res);
  },

  createOrder: async (orderData: any): Promise<Order> => {
    const res = await androidApiFetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    return readResponseBody(res);
  },

  getPaypalConfig: async (): Promise<{
    configured: boolean;
    clientId: string;
    currency: string;
    mode: "sandbox" | "live";
    error?: string;
  }> => {
    try {
      const res = await androidApiFetch("/paypal/config");
      const data = await readResponseBody(res);
      if (!res.ok || data.error || !data.clientId) {
        return {
          configured: false,
          clientId: data?.clientId || "",
          currency: data?.currency || "USD",
          mode: data?.mode || "sandbox",
          error: data?.error || data?.message || "PayPal no está configurado en el servidor.",
        };
      }
      return {
        configured: Boolean(data.configured ?? true),
        clientId: data.clientId,
        currency: data.currency || "USD",
        mode: data.mode || "sandbox",
      };
    } catch (err: any) {
      return {
        configured: false,
        clientId: "",
        currency: "USD",
        mode: "sandbox",
        error: err?.message || "No se pudo consultar la configuración de PayPal.",
      };
    }
  },

  createPaypalOrder: async (items: CartItem[], shippingCost: number): Promise<{ id: string }> => {
    const res = await androidApiFetch("/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, shippingCost }),
    });
    const data = await readResponseBody(res);
    if (!res.ok || data.error || !data.id) {
      throw new Error(data.error || "PayPal no pudo iniciar el pago.");
    }
    return data;
  },

  getChatMessages: async (partnerId: string): Promise<ChatMessage[]> => {
    const res = await androidApiFetch(`/chats/${partnerId}`);
    return readResponseBody(res);
  },

  uploadFile: async (formData: FormData): Promise<any> => {
    const res = await androidApiFetch("/upload", {
      method: "POST",
      body: formData,
    });
    return readResponseBody(res);
  },

  syncGuestSession: async (deviceInfo?: string) => {
    const existingToken = typeof window !== "undefined" ? localStorage.getItem("mall_guest_access_token") : null;
    const res = await androidApiFetch("/auth/guest-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestToken: existingToken || undefined,
        platform: "android",
        deviceInfo
      }),
    });
    const data = await readResponseBody(res);
    if (data?.guestToken && typeof window !== "undefined") {
      try {
        localStorage.setItem("mall_guest_access_token", data.guestToken);
      } catch {}
    }
    return data;
  },
};
