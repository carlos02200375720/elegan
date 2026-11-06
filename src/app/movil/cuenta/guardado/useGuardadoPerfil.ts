import { useMemo, useState } from "react";
import { Product, Reel } from "../../tipos";

export type GuardadoSubTab = "all" | "products" | "reels";

export function useGuardadoPerfil({
  savedProducts: propSavedProducts,
  savedReels: propSavedReels,
  products = [],
  reels = [],
  savedReelIds = [],
}: {
  savedProducts?: Product[];
  savedReels?: Reel[];
  products?: Product[];
  reels?: Reel[];
  savedReelIds?: string[];
}) {
  const [savedSubTab, setSavedSubTab] = useState<GuardadoSubTab>("all");

  const resolvedSavedReels = useMemo(() => {
    if (propSavedReels) return propSavedReels;
    const result: Reel[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    reels.forEach((reel) => {
      if (!reel?.id || !savedReelIds.includes(reel.id) || seenIds.has(reel.id)) return;
      const url = (reel.videoUrl || reel.hlsUrl || "").split("?")[0].trim().toLowerCase();
      if (url && seenUrls.has(url)) return;
      seenIds.add(reel.id);
      if (url) seenUrls.add(url);
      result.push(reel);
    });
    return result;
  }, [propSavedReels, reels, savedReelIds]);

  const resolvedSavedProducts = useMemo(() => {
    if (propSavedProducts) return propSavedProducts;
    const seen = new Set<string>();
    return products.filter((product) => {
      if (!savedReelIds.includes(product.id) || seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [propSavedProducts, products, savedReelIds]);

  const unifiedSavedItems = useMemo(() => {
    type Item = { kind: "product"; data: Product; id: string } | { kind: "reel"; data: Reel; id: string };
    const items: Item[] = [];
    const maxLength = Math.max(resolvedSavedProducts.length, resolvedSavedReels.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < resolvedSavedReels.length) {
        const reel = resolvedSavedReels[i];
        items.push({ kind: "reel", data: reel, id: reel.id });
      }
      if (i < resolvedSavedProducts.length) {
        const product = resolvedSavedProducts[i];
        items.push({ kind: "product", data: product, id: product.id });
      }
    }
    return items;
  }, [resolvedSavedProducts, resolvedSavedReels]);

  return { savedSubTab, setSavedSubTab, resolvedSavedReels, resolvedSavedProducts, unifiedSavedItems,
    totalSavedCount: resolvedSavedReels.length + resolvedSavedProducts.length };
}
