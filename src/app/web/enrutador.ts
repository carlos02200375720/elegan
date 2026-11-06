import { useState, useEffect } from "react";
import type { User, Product, Reel } from "./tipos";
import { isGuestUser } from "./tipos";

export type WebRoute =
  | { type: "shop" }
  | { type: "product"; productId: string; productSlug?: string }
  | { type: "store"; sellerId: string }
  | { type: "cart" }
  | { type: "checkout" }
  | { type: "thankyou"; orderId?: string }
  | { type: "inicio"; reelId?: string; reelSlug?: string }
  | { type: "reels"; reelId?: string; reelSlug?: string }
  | { type: "messages" }
  | { type: "login" }
  | { type: "profile"; userId?: string; profileTab?: string };

export function slugify(name?: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export function getThankYouPath(orderOrId?: string | { id?: string; _id?: string } | null): string {
  if (!orderOrId) return "/tienda/gracia";
  const id = typeof orderOrId === "object" ? orderOrId.id || (orderOrId as any)._id : orderOrId;
  const cleanId = (id || "").trim();
  if (!cleanId) return "/tienda/gracia";
  return `/tienda/gracia/${encodeURIComponent(cleanId)}`;
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

export function getProfileSavedPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/guardado`;
}

export function getProfileCompraPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/compra`;
}

export function getProfileConfigPath(userOrId?: any): string {
  return `${getProfilePath(userOrId).replace(/\/+$/, "")}/config`;
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

export { parseWebRoute as parseRoute };

export function parseWebRoute(pathname: string): WebRoute {
  const normalized = pathname.trim().replace(/\/+$/, "") || "/";

  if (normalized === "/" || normalized === "" || /^\/(?:tienda(?:\/catalogo)?|shop(?:\/catalogo)?|catalogo)$/i.test(normalized)) {
    return { type: "shop" };
  }

  if (/^\/(?:tienda\/|shop\/)?(?:carrito|cart)$/i.test(normalized)) {
    return { type: "cart" };
  }

  if (/^\/(?:tienda\/|shop\/)?(?:verificacion|verificasion|checkout)$/i.test(normalized)) {
    return { type: "checkout" };
  }

  const thanksMatch = normalized.match(/^\/(?:tienda\/|shop\/)?(?:gracia|gracias|grasia|thankyou)\/([^/]+)$/i);
  if (thanksMatch) {
    return { type: "thankyou", orderId: decodeURIComponent(thanksMatch[1]).trim() };
  }
  if (/^\/(?:tienda\/|shop\/)?(?:gracia|gracias|grasia|thankyou)$/i.test(normalized)) {
    return { type: "thankyou" };
  }

  if (/^\/(?:perfil\/login|login)$/i.test(normalized)) {
    return { type: "login" };
  }

  const shopProductMatch = normalized.match(/^\/(?:tienda|shop)\/([^/]+)$/i);
  if (shopProductMatch) {
    const rawSegment = decodeURIComponent(shopProductMatch[1]);
    return {
      type: "product",
      productSlug: rawSegment,
      productId: extractProductId(rawSegment),
    };
  }

  const shopTwoSegmentMatch = normalized.match(/^\/(?:tienda|shop)\/([^/]+)\/([^/]+)$/i);
  if (shopTwoSegmentMatch) {
    return {
      type: "product",
      productSlug: decodeURIComponent(shopTwoSegmentMatch[1]),
      productId: extractProductId(shopTwoSegmentMatch[2]),
    };
  }

  if (/^\/(?:inicio|reels)$/i.test(normalized)) {
    return { type: "inicio" };
  }

  const inicioMatch = normalized.match(/^\/(?:inicio|reel|reels)\/([^/]+)$/i);
  if (inicioMatch) {
    const rawSegment = decodeURIComponent(inicioMatch[1]);
    return {
      type: "inicio",
      reelSlug: rawSegment,
      reelId: extractReelId(rawSegment),
    };
  }

  if (normalized === "/messages") {
    return { type: "messages" };
  }

  const profileTabMatch = normalized.match(/^\/perfil(?:\/([^/]+))?\/(guardado|compra|config|producto|venta|publicaciones|publicar|rendimiento)$/i);
  if (profileTabMatch) {
    const rawUser = profileTabMatch[1] ? decodeURIComponent(profileTabMatch[1]) : undefined;
    return {
      type: "profile",
      userId: rawUser && !["usuario", "invitado", "guest", "current_user"].includes(rawUser) ? rawUser : undefined,
      profileTab: profileTabMatch[2].toLowerCase(),
    };
  }

  const profileMatch = normalized.match(/^\/perfil(?:\/([^/]+))?$/i);
  if (profileMatch) {
    const rawUser = profileMatch[1] ? decodeURIComponent(profileMatch[1]) : undefined;
    return {
      type: "profile",
      userId: rawUser && !["usuario", "invitado", "guest", "current_user"].includes(rawUser) ? rawUser : undefined,
    };
  }

  return { type: "shop" };
}

export function navigateTo(path: string, options?: { replace?: boolean }) {
  if (typeof window === "undefined") return;
  const current = window.location.pathname + window.location.search;
  if (current === path) return;

  if (options?.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new CustomEvent("web-route-change", { detail: { path } }));
}

export function useCurrentRoute(): WebRoute {
  const [route, setRoute] = useState<WebRoute>(() => {
    if (typeof window === "undefined") return { type: "shop" };
    return parseWebRoute(window.location.pathname);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      setRoute(parseWebRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("web-route-change", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("web-route-change", handleLocationChange);
    };
  }, []);

  return route;
}
