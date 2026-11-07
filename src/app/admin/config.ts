export const CLOUD_RUN_BACKEND_URL = "https://elegan-backend-587849039182.us-east1.run.app";

export const BACKEND_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL || CLOUD_RUN_BACKEND_URL;

export const getApiUrl = (path: string): string => {
  const rawPath = path.startsWith("/") ? path : `/${path}`;
  if (rawPath === "/api/android" || rawPath.startsWith("/api/android/")) {
    throw new Error("La ruta /api/android está obsoleta; utiliza /api/admin.");
  }
  if (rawPath === "/api/movil" || rawPath.startsWith("/api/movil/")) {
    throw new Error("El cliente admin no puede utilizar endpoints de movil.");
  }
  if (rawPath === "/api/web" || rawPath.startsWith("/api/web/")) {
    throw new Error("El cliente admin no puede utilizar endpoints de web.");
  }
  const cleanPath =
    rawPath === "/api/admin" || rawPath.startsWith("/api/admin/")
      ? rawPath
      : rawPath.startsWith("/api/")
        ? `/api/admin/${rawPath.slice("/api/".length)}`
        : rawPath;
  if (typeof window !== "undefined" && window.location && window.location.protocol.startsWith("http")) {
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
    throw err;
  }
};

export const getMediaUrl = (url?: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  return getApiUrl(url);
};
