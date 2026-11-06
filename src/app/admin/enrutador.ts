import { useState, useEffect } from "react";
import type { AdminTab } from "./tipos";

export interface AdminRoute {
  tab: AdminTab;
}

const VALID_TABS: AdminTab[] = [
  "resumen",
  "usuarios",
  "reels",
  "productos",
  "publicar",
  "pedidos",
  "metrica",
  "fotos_defecto",
  "sistema",
];

export function parseAdminRoute(pathname: string): AdminRoute {
  const normalized = pathname.trim().replace(/\/+$/, "") || "/admin";
  const match = normalized.match(/^\/admin(?:\/([^/]+))?$/i);
  if (match && match[1]) {
    const rawTab = decodeURIComponent(match[1]).toLowerCase() as AdminTab;
    if (VALID_TABS.includes(rawTab)) {
      return { tab: rawTab };
    }
  }
  return { tab: "resumen" };
}

export function getAdminPath(tab: AdminTab = "resumen"): string {
  return `/admin/${encodeURIComponent(tab)}`;
}

export function navigateToAdmin(tab: AdminTab, options?: { replace?: boolean }) {
  if (typeof window === "undefined") return;
  const path = getAdminPath(tab);
  if (window.location.pathname === path) return;

  if (options?.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new CustomEvent("admin-route-change", { detail: { tab, path } }));
}

export function useAdminRoute(): AdminRoute {
  const [route, setRoute] = useState<AdminRoute>(() => {
    if (typeof window === "undefined") return { tab: "resumen" };
    return parseAdminRoute(window.location.pathname);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLocationChange = () => {
      setRoute(parseAdminRoute(window.location.pathname));
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("admin-route-change", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("admin-route-change", handleLocationChange);
    };
  }, []);

  return route;
}
