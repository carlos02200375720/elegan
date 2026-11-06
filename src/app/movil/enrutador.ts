import { useState, useEffect } from "react";
import type { User, Product, Reel, NavigationTab } from "./tipos";

export type MovilRoute =
  | { type: "tab"; tab: NavigationTab }
  | { type: "product"; productId: string; productSlug?: string }
  | { type: "cart" }
  | { type: "checkout" }
  | { type: "thankyou"; orderId?: string }
  | { type: "inicio"; reelId?: string }
  | { type: "login" }
  | { type: "profile"; userId?: string; profileTab?: string };

export function extractProductId(rawParam: string): string {
  let decoded = rawParam.trim();
  try {
    decoded = decodeURIComponent(decoded).trim();
  } catch {}
  const prodMatch = decoded.match(/(?:^|-)(prod_[a-zA-Z0-9_-]+)$/i);
  if (prodMatch) return prodMatch[1];
  const oidMatch = decoded.match(/(?:^|-)([a-f0-9]{24})$/i);
  if (oidMatch) return oidMatch[1];
  return decoded;
}

export function extractReelId(rawParam: string): string {
  let decoded = rawParam.trim();
  try {
    decoded = decodeURIComponent(decoded).trim();
  } catch {}
  const reelMatch = decoded.match(/(?:^|-)((?:reel|pub)_[a-zA-Z0-9_-]+)$/i);
  if (reelMatch) return reelMatch[1];
  const oidMatch = decoded.match(/(?:^|-)([a-f0-9]{24})$/i);
  if (oidMatch) return oidMatch[1];
  return decoded;
}

export function getProductPath(productOrId?: string | { id?: string; _id?: string } | null): string {
  if (!productOrId) return "/tienda/catalogo";
  const id = typeof productOrId === "object" ? productOrId.id || (productOrId as any)._id : productOrId;
  const cleanId = (id || "").trim();
  if (!cleanId) return "/tienda/catalogo";
  return `/tienda/${encodeURIComponent(cleanId)}`;
}

export function getInicioPath(reelOrId?: string | { id?: string; _id?: string } | null): string {
  if (!reelOrId) return "/inicio";
  const id = typeof reelOrId === "object" ? reelOrId.id || (reelOrId as any)._id : reelOrId;
  const cleanId = (id || "").trim();
  if (!cleanId) return "/inicio";
  return `/inicio/${encodeURIComponent(cleanId)}`;
}

export function getProfilePath(userOrId?: string | { id?: string; originalId?: string } | null): string {
  if (!userOrId) return "/perfil";
  const rawId = typeof userOrId === "object" ? userOrId.originalId || userOrId.id : userOrId;
  const clean = (rawId || "").trim().replace(/^@/, "");
  if (!clean || clean === "usuario" || clean === "invitado" || clean === "guest" || clean === "current_user") {
    return "/perfil";
  }
  return `/perfil/${encodeURIComponent(clean)}`;
}

export function getProfileCompraPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/compra`;
}

export function getProfileConfigPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/config`;
}

export function getProfileSavedPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/guardado`;
}

export function getProfileProductoPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/producto`;
}

export function getProfileVentaPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/venta`;
}

export function getProfilePublicacionesPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/publicaciones`;
}

export function getProfilePublicarPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/publicar`;
}

export function getProfileRendimientoPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/rendimiento`;
}

export function getInicioShareUrl(reelOrId: any): string {
  const path = getInicioPath(reelOrId);
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function findReelByInicioParam<T extends { id?: string; _id?: string }>(reels: T[], rawParam?: string | null): T | undefined {
  if (!rawParam || !Array.isArray(reels) || reels.length === 0) return undefined;
  const cleanParam = rawParam.trim();
  if (!cleanParam) return undefined;
  const extractedId = extractReelId(cleanParam);
  return reels.find((r) => r && (r.id === cleanParam || (r as any)._id === cleanParam || r.id === extractedId || (r as any)._id === extractedId));
}

export function parseMovilRoute(pathname: string): MovilRoute {
  const normalized = pathname.trim().replace(/\/+$/, "") || "/movil";

  if (
    normalized === "/movil" ||
    normalized === "/app/movil" ||
    normalized === "/inicio" ||
    normalized === "/"
  ) {
    return { type: "tab", tab: "inicio" };
  }

  if (/^\/(?:movil\/|app\/movil\/)?(?:tienda\/|shop\/)?(?:carrito|cart)$/i.test(normalized)) {
    return { type: "cart" };
  }

  if (/^\/(?:movil\/|app\/movil\/)?(?:tienda\/|shop\/)?(?:verificacion|verificasion|checkout)$/i.test(normalized)) {
    return { type: "checkout" };
  }

  const thanksMatch = normalized.match(/^\/(?:movil\/|app\/movil\/)?(?:tienda\/|shop\/)?(?:gracia|gracias|grasia|thankyou)\/([^/]+)$/i);
  if (thanksMatch) {
    return { type: "thankyou", orderId: decodeURIComponent(thanksMatch[1]).trim() };
  }
  if (/^\/(?:movil\/|app\/movil\/)?(?:tienda\/|shop\/)?(?:gracia|gracias|grasia|thankyou)$/i.test(normalized)) {
    return { type: "thankyou" };
  }

  if (/^\/(?:movil\/|app\/movil\/)?(?:perfil\/login|login)$/i.test(normalized)) {
    return { type: "login" };
  }

  const prodMatch = normalized.match(/^\/(?:movil\/|app\/movil\/)?(?:tienda|shop|product)\/([^/]+)$/i);
  if (prodMatch) {
    const rawSegment = decodeURIComponent(prodMatch[1]);
    return {
      type: "product",
      productSlug: rawSegment,
      productId: extractProductId(rawSegment),
    };
  }

  const reelMatch = normalized.match(/^\/(?:movil\/|app\/movil\/)?(?:inicio|reel|reels)\/([^/]+)$/i);
  if (reelMatch) {
    const rawSegment = decodeURIComponent(reelMatch[1]);
    return {
      type: "inicio",
      reelId: extractReelId(rawSegment),
    };
  }

  const profileTabMatch = normalized.match(/^\/(?:movil\/|app\/movil\/)?perfil(?:\/([^/]+))?\/(guardado|compra|config|producto|venta|publicaciones|publicar|rendimiento)$/i);
  if (profileTabMatch) {
    const rawUser = profileTabMatch[1] ? decodeURIComponent(profileTabMatch[1]) : undefined;
    return {
      type: "profile",
      userId: rawUser && !["usuario", "invitado", "guest", "current_user"].includes(rawUser) ? rawUser : undefined,
      profileTab: profileTabMatch[2].toLowerCase(),
    };
  }

  const profileMatch = normalized.match(/^\/(?:movil\/|app\/movil\/)?perfil(?:\/([^/]+))?$/i);
  if (profileMatch) {
    const rawUser = profileMatch[1] ? decodeURIComponent(profileMatch[1]) : undefined;
    return {
      type: "profile",
      userId: rawUser && !["usuario", "invitado", "guest", "current_user"].includes(rawUser) ? rawUser : undefined,
    };
  }

  if (/^\/(?:movil\/|app\/movil\/)?(?:shop|tienda|catalogo)$/i.test(normalized)) {
    return { type: "tab", tab: "shop" };
  }

  if (/^\/(?:movil\/|app\/movil\/)?(?:messages|mensajes)$/i.test(normalized)) {
    return { type: "tab", tab: "messages" };
  }

  if (/^\/(?:movil\/|app\/movil\/)?reels$/i.test(normalized)) {
    return { type: "tab", tab: "reels" };
  }

  return { type: "tab", tab: "inicio" };
}

export function navigateToMovil(path: string, options?: { replace?: boolean }) {
  if (typeof window === "undefined") return;
  const current = window.location.pathname + window.location.search;
  if (current === path) return;

  if (options?.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new CustomEvent("movil-route-change", { detail: { path } }));
}

export function useMovilRoute(): MovilRoute {
  const [route, setRoute] = useState<MovilRoute>(() => {
    if (typeof window === "undefined") return { type: "tab", tab: "inicio" };
    return parseMovilRoute(window.location.pathname);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      setRoute(parseMovilRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("movil-route-change", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("movil-route-change", handleLocationChange);
    };
  }, []);

  return route;
}

export { parseMovilRoute as parseRoute, navigateToMovil as navigateTo, useMovilRoute as useCurrentRoute };
