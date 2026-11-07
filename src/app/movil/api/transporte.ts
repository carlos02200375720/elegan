import { sesionMovil } from "../sesion";
import { syncGuestSession as syncLocalGuestSession } from "../guestToken";
import { BACKEND_URL, CLOUD_RUN_BACKEND_URL, isExternalStaticHost } from "../config";

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
  const rawPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (rawPath === "/api/android" || rawPath.startsWith("/api/android/")) {
    throw new Error("La ruta /api/android está obsoleta; utiliza /api/movil.");
  }
  if (
    rawPath === "/api/web" || rawPath.startsWith("/api/web/") ||
    rawPath === "/api/admin" || rawPath.startsWith("/api/admin/")
  ) {
    throw new Error("La aplicación móvil no puede utilizar endpoints de otros clientes.");
  }
  const clean = rawPath === "/api/movil" || rawPath.startsWith("/api/movil/")
    ? rawPath
    : rawPath.startsWith("/api/")
      ? `/api/movil/${rawPath.slice("/api/".length)}`
      : `/api/movil${rawPath}`;
  if (typeof window !== "undefined" && window.location &&
      window.location.protocol.startsWith("http") && !isAndroidNative() && !isExternalStaticHost()) {
    return clean;
  }
  const base = (BACKEND_URL || CLOUD_RUN_BACKEND_URL || "").replace(/\/$/, "");
  return base ? `${base}${clean}` : clean;
};

export const readResponseBody = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();
  if (!bodyText.trim()) return {};
  if (contentType.includes("application/json")) {
    try { return JSON.parse(bodyText); }
    catch { throw new Error(`El backend respondió JSON inválido (HTTP ${response.status}).`); }
  }
  const preview = bodyText.replace(/\s+/g, " ").slice(0, 180);
  if (/^<!doctype html/i.test(bodyText) || /<html[\s>]/i.test(bodyText)) {
    throw new Error(`El backend respondió HTML en vez de JSON (HTTP ${response.status}). Verifica que el servicio API esté disponible.`);
  }
  if (!response.ok) throw new Error(`Error HTTP ${response.status}: ${preview}`);
  try { return JSON.parse(bodyText); }
  catch { throw new Error(`Respuesta inesperada del backend (HTTP ${response.status}): ${preview}`); }
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
      const currentUser = sesionMovil.getUser();
      if (currentUser?.originalId || currentUser?.id) headers.set("x-user-id", currentUser.originalId || currentUser.id);
      const storedGuestToken = localStorage.getItem("mall_guest_access_token");
      if (storedGuestToken && !headers.has("x-guest-token")) headers.set("x-guest-token", storedGuestToken);
    } catch {
      // La sesión local puede estar incompleta; el servidor puede tratar la petición como invitado.
    }
  }

  const isUpload = endpoint.includes("upload") || (init?.body instanceof FormData);
  const effectiveTimeout = isUpload ? 300000 : timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  const signal = init?.signal || controller.signal;

  try {
    const response = await fetch(url, { ...init, headers, signal });
    if (!response.ok && response.status >= 500 && typeof window !== "undefined" &&
        window.location?.protocol?.startsWith("http")) {
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const localUrl = cleanEndpoint.startsWith("/api/movil") ? cleanEndpoint : `/api/movil${cleanEndpoint}`;
      if (url !== localUrl) {
        try {
          const localResponse = await fetch(localUrl, { ...init, headers, signal });
          if (localResponse.ok) return localResponse;
        } catch {}
      }
    }
    return response;
  } catch (error: any) {
    if (signal.aborted) {
      if (controller.signal.aborted) throw new Error(`La solicitud tardó más de ${Math.round(effectiveTimeout / 1000)} segundos.`);
      throw error;
    }
    if (typeof window !== "undefined" && window.location?.protocol?.startsWith("http")) {
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
      const localUrl = cleanEndpoint.startsWith("/api/movil") ? cleanEndpoint : `/api/movil${cleanEndpoint}`;
      if (url !== localUrl) {
        try { return await fetch(localUrl, { ...init, headers, signal }); } catch {}
      }
    }
    throw new Error(`No se pudo conectar con el backend Android: ${error?.message || "error de red"}`);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const syncGuestSession = async (_deviceInfo?: string) => syncLocalGuestSession("android");
