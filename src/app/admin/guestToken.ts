export function getLocalGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("mall_guest_access_token"); } catch { return null; }
}
export function getOrCreateGuestToken(): string {
  const current = getLocalGuestToken();
  if (current) return current;
  const token = `guest_tok_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  try { if (typeof window !== "undefined") localStorage.setItem("mall_guest_access_token", token); } catch {}
  return token;
}
