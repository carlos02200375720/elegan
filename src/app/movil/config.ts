import { sesionMovil } from "./sesion";

export const CLOUD_RUN_BACKEND_URL = "https://elegan-backend-587849039182.us-east1.run.app";

export const BACKEND_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL || CLOUD_RUN_BACKEND_URL;

export const isExternalStaticHost = (): boolean => {
  if (typeof window === "undefined" || !window.location) return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.includes("pages.dev") ||
    host.includes("github.io") ||
    host.includes("surge.sh") ||
    host.includes("vercel.app") ||
    host.includes("netlify.app")
  );
};

export const isNativeMobileWrapper = (): boolean => {
  if (typeof window === "undefined" || !window.location) return false;
  const win = window as any;
  if (typeof win.Capacitor?.isNativePlatform === "function" && win.Capacitor.isNativePlatform()) return true;
  if (win.Capacitor?.getPlatform && (win.Capacitor.getPlatform() === "android" || win.Capacitor.getPlatform() === "ios")) return true;
  const proto = window.location.protocol;
  if (proto === "capacitor:" || proto === "file:" || proto === "ionic:" || proto === "app:") return true;
  return false;
};

export const getWebSocketUrl = (): string => {
  if (typeof window !== "undefined" && window.location && !isNativeMobileWrapper() && !isExternalStaticHost()) {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}`;
  }

  if (BACKEND_URL) {
    try {
      const parsed = new URL(BACKEND_URL);
      const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${parsed.host}`;
    } catch (e) {
      console.warn("Could not parse BACKEND_URL as URL, falling back:", e);
    }
  }

  return "wss://elegan-backend-587849039182.us-east1.run.app";
};

export const getMediaUrl = (path: string | undefined | null): string => {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (isNativeMobileWrapper() || isExternalStaticHost()) {
    const trimmedBackend = (BACKEND_URL || CLOUD_RUN_BACKEND_URL).replace(/\/$/, "");
    return `${trimmedBackend}${cleanPath}`;
  }
  return cleanPath;
};

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http") && !isNativeMobileWrapper() && !isExternalStaticHost()) {
    return cleanPath;
  }
  const trimmedBackend = (BACKEND_URL || CLOUD_RUN_BACKEND_URL).replace(/\/$/, "");
  return `${trimmedBackend}${cleanPath}`;
};

export const apiFetch = async (
  input: string,
  init?: RequestInit,
  customTimeoutMs?: number
): Promise<Response> => {
  const cleanPath = input.startsWith("/") ? input : `/${input}`;
  const targetUrl = getApiUrl(cleanPath);
  const headers = new Headers(init?.headers);

  if (typeof window !== "undefined") {
    try {
      const currentUser = sesionMovil.getUser();
      if (currentUser?.originalId || currentUser?.id) {
        headers.set("x-user-id", currentUser.originalId || currentUser.id);
      }
      const storedGuestToken = localStorage.getItem("mall_guest_access_token");
      if (storedGuestToken && !headers.has("x-guest-token")) {
        headers.set("x-guest-token", storedGuestToken);
      }
    } catch {}
  }

  if (isNativeMobileWrapper()) {
    if (!headers.has("X-Platform")) headers.set("X-Platform", "android");
    if (!headers.has("X-Client-Platform")) headers.set("X-Client-Platform", "android");
    if (!headers.has("X-Client-App")) headers.set("X-Client-App", "MallSocial-Android");
  }

  const effectiveTimeout = customTimeoutMs || 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
  const signal = init?.signal || controller.signal;

  try {
    const res = await fetch(targetUrl, { ...init, headers, signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    if (targetUrl !== cleanPath && typeof window !== "undefined") {
      try {
        const localRes = await fetch(cleanPath, { ...init, headers, signal });
        if (localRes.ok || localRes.status < 500) return localRes;
      } catch {}
    }
    throw err;
  }
};
