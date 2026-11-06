import type { CSSProperties } from "react";
import type { Reel, Product } from "../tipos";
import type { PublicationFormat } from "./TiposInicio";

export const getPublicationFormatStyles = (format: PublicationFormat): CSSProperties => {
  switch (format) {
    case "1:1":
      return {
        aspectRatio: "1 / 1",
        width: "100%",
        maxWidth: "min(100%, calc(100dvh - 200px))",
        maxHeight: "calc(100dvh - 200px)",
      };
    case "3:4":
      return {
        aspectRatio: "3 / 4",
        height: "100%",
        maxHeight: "calc(100dvh - 160px)",
        maxWidth: "min(100%, calc((100dvh - 160px) * 3 / 4))",
        width: "auto",
      };
    case "4:3":
      return {
        aspectRatio: "4 / 3",
        width: "100%",
        maxWidth: "100%",
        maxHeight: "calc(100dvh - 220px)",
      };
  }
};

export const getMediaTokens = (url?: string): string[] => {
  if (!url || typeof url !== "string") return [];
  const clean = url.trim().split("?")[0];
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return [clean, last].filter(Boolean);
};

export const findProductForReel = (reel: Reel, productList: Product[]): Product | undefined => {
  if (!productList || productList.length === 0) return undefined;

  const directId =
    reel.productId ||
    (reel as any).taggedProductId ||
    (reel as any).product?.id ||
    (reel.id?.startsWith("reel_prod_") ? reel.id.slice("reel_prod_".length) : undefined);

  if (directId) {
    const matched = productList.find((product) => product.id === directId);
    if (matched) return matched;
  }

  const reelUrls = [
    reel.thumbnailUrl,
    reel.videoUrl,
    reel.hlsUrl,
    ...(Array.isArray(reel.images) ? reel.images : []),
    ...(Array.isArray(reel.media) ? reel.media.map((media) => media?.url) : []),
  ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  const reelTokens = new Set(reelUrls.flatMap(getMediaTokens));

  for (const product of productList) {
    const productUrls = [
      product.imageUrl,
      ...(Array.isArray(product.images) ? product.images : []),
      ...(Array.isArray(product.videos) ? product.videos : []),
      ...(Array.isArray(product.variantList) ? product.variantList.map((variant) => variant.imageUrl) : []),
    ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);

    if (productUrls.flatMap(getMediaTokens).some((token) => reelTokens.has(token))) {
      return product;
    }
  }

  return undefined;
};

export const isDefaultDescription = (description?: string | null): boolean => {
  if (!description) return true;
  const trimmed = description.trim();
  if (!trimmed) return true;
  if (/^uploaded via/i.test(trimmed)) return true;
  if (/^publicado v[ií]a/i.test(trimmed)) return true;
  if (/^publicaci[oó]n generada/i.test(trimmed)) return true;
  return false;
};

export const isFilenameTitle = (title?: string | null): boolean => {
  if (!title) return true;
  return /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$/i.test(title.trim());
};
