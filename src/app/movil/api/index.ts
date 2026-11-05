import type { User, Reel, Product, CartItem, Order, ChatMessage } from "../../../types";
import { androidApiFetch, readResponseBody, syncGuestSession as sincronizarSesionInvitado } from "./transporte";

export {
  BACKEND_URL,
  CLOUD_RUN_BACKEND_URL,
  isAndroidNative,
  getAndroidApiUrl,
  androidApiFetch,
  readResponseBody,
} from "./transporte";

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

  switchUser: async (email: string, password?: string, isSessionRestore?: boolean) => {
    const res = await androidApiFetch("/users/current/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, isSessionRestore }),
    });
    return readResponseBody(res);
  },

  loginUser: async (email: string, password: string) => {
    const res = await androidApiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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

  syncGuestSession: async (_deviceInfo?: string) => {
    // Android visitors use the same local-only guest session as the web app.
    return sincronizarSesionInvitado();
  },
};
