import type { User } from "./tipos";
import { sesionWeb } from "./sesion";

export const GUEST_TOKEN_KEY = "mall_guest_access_token";
const GUEST_TOKEN_COOKIE = "mall_guest_access_token";
const GUEST_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;
let inMemoryGuestToken: string | null = null;

function readGuestTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const entry = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(`${GUEST_TOKEN_COOKIE}=`));
    return entry ? decodeURIComponent(entry.slice(GUEST_TOKEN_COOKIE.length + 1)) || null : null;
  } catch { return null; }
}
function writeGuestTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${GUEST_TOKEN_COOKIE}=${encodeURIComponent(token)}; Max-Age=${GUEST_TOKEN_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch {}
}
export function getLocalGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(GUEST_TOKEN_KEY);
    if (stored) { inMemoryGuestToken = stored; return stored; }
  } catch (err) { console.warn("No se pudo leer el token de invitado:", err); }
  const cookie = readGuestTokenCookie();
  if (cookie) {
    inMemoryGuestToken = cookie;
    try { localStorage.setItem(GUEST_TOKEN_KEY, cookie); } catch {}
    return cookie;
  }
  return inMemoryGuestToken;
}
export function setLocalGuestToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  const normalized = token.trim();
  inMemoryGuestToken = normalized;
  try { localStorage.setItem(GUEST_TOKEN_KEY, normalized); } catch (err) { console.warn("No se pudo guardar el token de invitado:", err); }
  writeGuestTokenCookie(normalized);
}
export function getOrCreateGuestToken(): string {
  const existing = getLocalGuestToken();
  if (existing) return existing;
  if (typeof window === "undefined") return "guest_server_token";
  try {
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const token = `guest_tok_${randomHex}_${Date.now().toString(36)}`;
    setLocalGuestToken(token);
    return token;
  } catch { return `guest_tok_${Date.now().toString(36)}`; }
}
export function removeLocalGuestToken(): void {
  if (typeof window === "undefined") return;
  inMemoryGuestToken = null;
  try { localStorage.removeItem(GUEST_TOKEN_KEY); } catch {}
  try { document.cookie = `${GUEST_TOKEN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`; } catch {}
}
export interface GuestSessionResult { success: boolean; isNew: boolean; guestToken: string; user: User; }
export async function syncGuestSession(_platform: "web" | "android" = "web"): Promise<GuestSessionResult | null> {
  const token = getLocalGuestToken() || getOrCreateGuestToken();
  const user: User = {
    id: "current_user", originalId: token, guestToken: token, name: "Invitado",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    bio: "Explorando la plataforma", isOnline: false, followers: 0, following: 0,
    followingUserIds: [], savedReelIds: [],
    coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    isGuest: true, canSell: false, isAdmin: false,
  };
  if (!sesionWeb.isAuthenticated()) sesionWeb.setUser(user);
  return { success: true, isNew: false, guestToken: token, user };
}
