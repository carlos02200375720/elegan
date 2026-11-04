import type { User } from "../types";
import { isGuestUser } from "../types";

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

function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const rawUser = getStoredUser();
    if (rawUser?.email && !isGuestUser(rawUser)) {
      return rawUser.email;
    }
    const email = localStorage.getItem("mall_email");
    if (email?.includes("@")) {
      return email.toLowerCase();
    }
  } catch {}
  return null;
}

function getStoredAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const auth = localStorage.getItem("mall_authenticated");
    if (auth === "true") {
      const user = getStoredUser();
      return !!user && !isGuestUser(user);
    }
    const user = getStoredUser();
    return !!user && !isGuestUser(user);
  } catch {}
  return false;
}

let sessionUser: User | null = getStoredUser();
let sessionEmail: string | null = getStoredEmail();
let authenticated: boolean = getStoredAuthenticated();
let platformTarget: "android" | "web" | null = null;

export const sessionState = {
  getUser: (): User | null => {
    if (!sessionUser) {
      sessionUser = getStoredUser();
    }
    return sessionUser;
  },
  getUserId: (): string | null => sessionUser?.originalId || sessionUser?.id || sessionEmail || null,
  setUser: (user: User | null): void => {
    sessionUser = user;
    const isGuest = !user || isGuestUser(user);
    sessionEmail = (user && !isGuest) ? (user.email || null) : null;
    authenticated = !!user && !isGuest;
    if (typeof window !== "undefined") {
      try {
        if (user && !isGuest) {
          localStorage.setItem("mall_user", JSON.stringify(user));
          localStorage.setItem("mall_email", user.email || "");
          localStorage.setItem("mall_authenticated", "true");
        } else {
          localStorage.removeItem("mall_user");
          localStorage.removeItem("mall_email");
          localStorage.removeItem("mall_authenticated");
        }
      } catch {}
    }
  },
  getEmail: (): string | null => {
    if (sessionUser && isGuestUser(sessionUser)) {
      return null;
    }
    if (!sessionEmail) {
      sessionEmail = getStoredEmail();
    }
    return sessionEmail;
  },
  setEmail: (email: string | null): void => {
    sessionEmail = email && email.includes("@") ? email.trim().toLowerCase() : null;
    if (typeof window !== "undefined") {
      try {
        if (sessionEmail) {
          localStorage.setItem("mall_email", sessionEmail);
        } else {
          localStorage.removeItem("mall_email");
        }
      } catch {}
    }
  },
  isAuthenticated: (): boolean => {
    if (!authenticated) {
      authenticated = getStoredAuthenticated();
    }
    return authenticated;
  },
  setAuthenticated: (value: boolean): void => {
    authenticated = value;
    if (typeof window !== "undefined") {
      try {
        if (value) {
          localStorage.setItem("mall_authenticated", "true");
        } else {
          localStorage.removeItem("mall_authenticated");
        }
      } catch {}
    }
  },
  getPlatform: (): "android" | "web" | null => {
    if (!platformTarget && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mall_last_active_platform") as "android" | "web" | null;
        if (stored === "android" || stored === "web") {
          platformTarget = stored;
        }
      } catch {}
    }
    return platformTarget;
  },
  setPlatform: (value: "android" | "web" | null): void => {
    platformTarget = value;
    if (typeof window !== "undefined" && value) {
      try {
        localStorage.setItem("mall_last_active_platform", value);
      } catch {}
    }
  },
  clear: (): void => {
    sessionUser = null;
    sessionEmail = null;
    authenticated = false;
    platformTarget = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("mall_user");
        localStorage.removeItem("mall_email");
        localStorage.removeItem("mall_authenticated");
      } catch {}
    }
  },
};

