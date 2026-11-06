import { useCallback, useState } from "react";
import type { Product, Reel, User } from "../tipos";
import { apiFetch } from "../config";
import { INITIAL_PRODUCTS, INITIAL_REELS, INITIAL_USERS } from "../datosIniciales";

const deduplicateById = <T extends { id?: string; _id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || item._id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function useDatosMovil() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const loadData = useCallback(async () => {
    try {
      const [usersResponse, productsResponse, reelsResponse] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/products"),
        apiFetch("/api/reels"),
      ]);
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        if (Array.isArray(data)) setUsers(deduplicateById(data));
      }
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        if (Array.isArray(data)) setProducts(deduplicateById(data));
      }
      if (reelsResponse.ok) {
        const data = await reelsResponse.json();
        if (Array.isArray(data)) setReels(deduplicateById(data));
      }
    } catch {}
  }, []);

  return { users, setUsers, reels, setReels, products, setProducts, loadData };
}
