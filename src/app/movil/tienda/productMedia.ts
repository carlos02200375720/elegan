import { Product } from "../../../types";
import { getMediaUrl } from "../../../config";

const cleanMedia = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export function getProductImageCandidates(product?: Product | null): string[] {
  if (!product) return [];
  const candidates = [
    product.imageUrl,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.variantList) ? product.variantList.map((variant) => variant?.imageUrl) : []),
  ];
  return Array.from(
    new Set(
      candidates
        .map(cleanMedia)
        .filter(Boolean)
        .map((url) => getMediaUrl(url))
        .filter(Boolean)
    )
  );
}

export function getProductImageUrl(product?: Product | null): string {
  return getProductImageCandidates(product)[0] || "";
}

export function getProductGalleryMedia(product?: Product | null): string[] {
  if (!product) return [];
  const candidates = [
    product.imageUrl,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.videos) ? product.videos : []),
    ...(Array.isArray(product.variantList) ? product.variantList.map((variant) => variant?.imageUrl) : []),
  ];
  return Array.from(
    new Set(
      candidates
        .map(cleanMedia)
        .filter(Boolean)
        .map((url) => getMediaUrl(url))
        .filter(Boolean)
    )
  );
}
