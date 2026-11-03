import { apiFetch } from "../config";
import { User } from "../types";
import { sessionState } from "./sessionState";

export const GUEST_TOKEN_KEY = "mall_guest_access_token";
const GUEST_TOKEN_COOKIE = "mall_guest_access_token";
const GUEST_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;
let inMemoryGuestToken: string | null = null;

function readGuestTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${GUEST_TOKEN_COOKIE}=`));
    return entry ? decodeURIComponent(entry.slice(GUEST_TOKEN_COOKIE.length + 1)) || null : null;
  } catch {
    return null;
  }
}

function writeGuestTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${GUEST_TOKEN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${GUEST_TOKEN_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {}
}

/**
 * Retrieves the stable visitor token from localStorage, then its persistent cookie fallback.
 */
export function getLocalGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storedToken = localStorage.getItem(GUEST_TOKEN_KEY);
    if (storedToken) {
      inMemoryGuestToken = storedToken;
      return storedToken;
    }
    const cookieToken = readGuestTokenCookie();
    if (cookieToken) {
      inMemoryGuestToken = cookieToken;
      try { localStorage.setItem(GUEST_TOKEN_KEY, cookieToken); } catch {}
      return cookieToken;
    }
    return inMemoryGuestToken;
  } catch (err) {
    console.warn("⚠️ No se pudo leer el token de invitado de localStorage:", err);
    return null;
  }
}

/**
 * Stores the stable visitor token in localStorage and a first-party cookie fallback.
 */
export function setLocalGuestToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  const normalizedToken = token.trim();
  inMemoryGuestToken = normalizedToken;
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, normalizedToken);
  } catch (err) {
    console.warn("⚠️ No se pudo guardar el token de invitado en localStorage:", err);
  }
  // Cookie is a persistence fallback if browser storage is unavailable or cleared independently.
  writeGuestTokenCookie(normalizedToken);
}

/**
 * Reuses the same installation token across reloads and authentication changes; only creates one when no persisted token exists.
 * Ensures the user has a stable unique identifier from their first millisecond in the app.
 */
export function getOrCreateGuestToken(): string {
  const existing = getLocalGuestToken();
  if (existing) return existing;

  if (typeof window === "undefined") {
    return "guest_server_token";
  }

  try {
    const randomHex =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);
    const newToken = `guest_tok_${randomHex}_${Date.now().toString(36)}`;
    setLocalGuestToken(newToken);
    return newToken;
  } catch {
    return `guest_tok_${Date.now().toString(36)}`;
  }
}

/**
 * Explicitly clears the visitor identity from localStorage, cookie, and memory.
 */
export function removeLocalGuestToken(): void {
  if (typeof window === "undefined") return;
  inMemoryGuestToken = null;
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch {}
  try {
    document.cookie = `${GUEST_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  } catch {}
}

export interface GuestSessionResult {
  success: boolean;
  isNew: boolean;
  guestToken: string;
  user: User;
}

/**
 * Keeps anonymous visitors local to their device on both Web and Android.
 * A visitor is never inserted into MongoDB; only registerUser creates a User document.
 */
export async function syncGuestSession(
  platform: "web" | "android" = "web"
): Promise<GuestSessionResult | null> {
  // Keep the platform argument for existing callers; guest identity is local on both platforms.
  void platform;
  const existingToken = getLocalGuestToken() || getOrCreateGuestToken();

  const user: User = {
    id: "current_user",
    originalId: existingToken,
    guestToken: existingToken,
    username: "invitado",
    name: "Invitado",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    bio: "Explorando la plataforma",
    isOnline: false,
    followers: 0,
    following: 0,
    followingUserIds: [],
    savedReelIds: [],
    coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    isGuest: true,
    canSell: false,
    isAdmin: false,
  };

  if (!sessionState.isAuthenticated()) {
    sessionState.setUser(user);
  }

  return {
    success: true,
    isNew: false,
    guestToken: existingToken,
    user,
  };
}
