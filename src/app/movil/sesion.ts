import type { User } from "./tipos";
import { isGuestUser } from "./tipos";

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mall_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && !isGuestUser(parsed)) return parsed;
  } catch {}
  return null;
}

function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const user = getStoredUser();
    if (user?.email && !isGuestUser(user)) return user.email;
    const email = localStorage.getItem("mall_email");
    return email?.includes("@") ? email.toLowerCase() : null;
  } catch { return null; }
}

let sessionUser: User | null = getStoredUser();
let sessionEmail: string | null = getStoredEmail();
let authenticated = !!sessionUser && !isGuestUser(sessionUser);

export const sesionMovil = {
  getUser: (): User | null => {
    if (!sessionUser) sessionUser = getStoredUser();
    return sessionUser;
  },
  getUserId: (): string | null => sessionUser?.originalId || sessionUser?.id || sessionEmail || null,
  setUser: (user: User | null): void => {
    sessionUser = user;
    const guest = !user || isGuestUser(user);
    sessionEmail = guest ? null : (user.email || null);
    authenticated = !!user && !guest;
    if (typeof window !== "undefined") {
      try {
        if (user && !guest) {
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
    if (sessionUser && isGuestUser(sessionUser)) return null;
    if (!sessionEmail) sessionEmail = getStoredEmail();
    return sessionEmail;
  },
  setEmail: (email: string | null): void => {
    sessionEmail = email && email.includes("@") ? email.trim().toLowerCase() : null;
    if (typeof window !== "undefined") {
      try {
        if (sessionEmail) localStorage.setItem("mall_email", sessionEmail);
        else localStorage.removeItem("mall_email");
      } catch {}
    }
  },
  isAuthenticated: (): boolean => {
    if (!authenticated) authenticated = !!getStoredUser() && !isGuestUser(getStoredUser());
    return authenticated;
  },
  setAuthenticated: (value: boolean): void => {
    authenticated = value;
    if (typeof window !== "undefined") {
      try {
        if (value) localStorage.setItem("mall_authenticated", "true");
        else localStorage.removeItem("mall_authenticated");
      } catch {}
    }
  },
  clear: (): void => {
    sessionUser = null;
    sessionEmail = null;
    authenticated = false;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("mall_user");
        localStorage.removeItem("mall_email");
        localStorage.removeItem("mall_authenticated");
      } catch {}
    }
  },
};
