export const CLOUD_RUN_BACKEND_URL = "https://elegan-backend-587849039182.us-east1.run.app";

export const BACKEND_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL || CLOUD_RUN_BACKEND_URL;

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
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
    if (targetUrl !== cleanPath && typeof window !== "undefined") {
      try {
        const localRes = await fetch(cleanPath, { ...init, headers, signal });
        if (localRes.ok || localRes.status < 500) return localRes;
      } catch {}
    }
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
