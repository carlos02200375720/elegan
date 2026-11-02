import { apiFetch } from "../config";
import { User } from "../types";
import { sessionState } from "./sessionState";

export const GUEST_TOKEN_KEY = "mall_guest_access_token";

/**
 * Retrieves the guest access token saved locally on the user's device.
 */
export function getLocalGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY) || null;
  } catch (err) {
    console.warn("⚠️ No se pudo leer el token de invitado de localStorage:", err);
    return null;
  }
}

/**
 * Stores the unique guest access token locally on the user's device.
 */
export function setLocalGuestToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, token.trim());
  } catch (err) {
    console.warn("⚠️ No se pudo guardar el token de invitado en localStorage:", err);
  }
}

/**
 * Retrieves existing guest access token or immediately generates and persists a new one.
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
 * Clears the local guest access token from the device.
 */
export function removeLocalGuestToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
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
