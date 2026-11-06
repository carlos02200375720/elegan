/// <reference types="vite/client" />

export const SUPERADMIN_EMAIL: string =
  String((import.meta as any).env?.VITE_SUPERADMIN_EMAIL || "cg0220037@gmail.com").trim().toLowerCase();

export const isSuperAdmin = (user?: { email?: string; id?: string; role?: string; isAdmin?: boolean } | null): boolean => {
  if (!user) return false;
  const email = String(user.email || "").trim().toLowerCase();

  return Boolean(
    email === "cg0220037@gmail.com" ||
    (SUPERADMIN_EMAIL && email === SUPERADMIN_EMAIL)
  );
};


