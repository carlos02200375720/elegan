import type { User } from "./tipos";
import { isGuestUser } from "./tipos";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mall_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && !isGuestUser(parsed)) {
      return parsed;
    }
  } catch {}
  return null;
}

let sessionUser: User | null = getStoredUser();
let platformTarget: "android" | "web" | null = null;

export const sesionAdmin = {
  getUser: (): User | null => {
    if (!sessionUser) {
      sessionUser = getStoredUser();
    }
    return sessionUser;
  },
  getUserId: (): string | null => sessionUser?.originalId || sessionUser?.id || null,
  setUser: (user: User | null): void => {
    sessionUser = user;
    const isGuest = !user || isGuestUser(user);
    if (typeof window !== "undefined") {
      try {
        if (user && !isGuest) {
          localStorage.setItem("mall_user", JSON.stringify(user));
          localStorage.setItem("mall_authenticated", "true");
        } else {
          localStorage.removeItem("mall_user");
          localStorage.removeItem("mall_authenticated");
        }
      } catch {}
    }
  },
  getPlatform: (): "android" | "web" | null => {
    if (!platformTarget && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mall_last_active_platform");
        if (stored === "android" || stored === "web") platformTarget = stored;
      } catch {}
    }
    return platformTarget;
  },
  setPlatform: (value: "android" | "web" | null): void => {
    platformTarget = value;
    if (typeof window !== "undefined" && value) {
      try { localStorage.setItem("mall_last_active_platform", value); } catch {}
    }
  },
  isAuthenticated: (): boolean => {
    const user = sesionAdmin.getUser();
    return !!user && !isGuestUser(user);
  },
  isAdmin: (): boolean => {
    const user = sesionAdmin.getUser();
    return !!user && (user.isAdmin === true || user.role === "admin");
  },
  clear: (): void => {
    sessionUser = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("mall_user");
        localStorage.removeItem("mall_authenticated");
      } catch {}
    }
  },
};
