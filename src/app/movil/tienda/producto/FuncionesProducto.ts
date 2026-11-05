import { Product, User } from "../../../../types";
import { getMediaUrl } from "../../../../config";
import { ShippingOptionItem, VariantGroup, VariantSwatch } from "./TiposProducto";

export function getManualShippingOptions(prod: Product | null): ShippingOptionItem[] {
  if (!prod) {
    return [{ carrier: "Envío Gratis", aging: "1-5 días hábiles", shippingCost: 0 }];
  }

  const opts: ShippingOptionItem[] = [];
  const seenLabels = new Set<string>();

  if (Array.isArray(prod.shippingOptions) && prod.shippingOptions.length > 0) {
    prod.shippingOptions.forEach((opt) => {
      if (!opt || !opt.label || !String(opt.label).trim()) return;
      const cleanLabel = String(opt.label).trim();
      seenLabels.add(cleanLabel.toLowerCase());
      opts.push({
        carrier: cleanLabel,
        aging: String(opt.deliveryTime || "3-7 días hábiles").trim(),
        shippingCost: Math.max(0, Number(opt.price ?? 0) || 0),
      });
    });
  }

  const capCost = Math.max(0, Number(prod.shippingCapital ?? 0) || 0);
  const provCost = Math.max(0, Number(prod.shippingProvince ?? 0) || 0);
  const baseCost = Math.max(0, Number(prod.shippingCost ?? 0) || 0);

  if (capCost > 0 && !seenLabels.has("envío a la capital")) {
    opts.push({
      carrier: "Envío a la Capital",
      aging: "1-3 días hábiles",
      shippingCost: capCost,
    });
  }
  if (provCost > 0 && !seenLabels.has("envío a provincia")) {
    opts.push({
      carrier: "Envío a Provincia",
      aging: "3-5 días hábiles",
      shippingCost: provCost,
    });
  }
  if (prod.freeShipping && !opts.some((o) => o.shippingCost === 0)) {
    opts.push({
      carrier: "Envío Gratis",
      aging: "1-5 días hábiles",
      shippingCost: 0,
    });
  }

  if (opts.length === 0) {
    if (baseCost > 0) {
      opts.push({
        carrier: "Envío a la Capital",
        aging: "1-3 días hábiles",
        shippingCost: baseCost,
      });
    } else {
      opts.push({
        carrier: "Envío Gratis",
        aging: "1-5 días hábiles",
        shippingCost: 0,
      });
    }
  }

  return opts;
}

export function checkIsVideo(url: string, product?: Product | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    Boolean(
      product?.videos &&
        product.videos.some((v) => v === url || lower.includes(v.toLowerCase()))
    ) ||
    lower.includes(".m3u8") ||
    lower.includes("video") ||
    lower.startsWith("data:video") ||
    lower.startsWith("blob:")
  );
}

export function normalizeVariantGroups(product: Product | null): VariantGroup[] {
  if (!product) return [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const groups = new Map<string, Set<string>>();
  for (const item of Array.isArray(product.variantList) ? product.variantList : []) {
    const color = typeof item.color === "string" ? item.color.trim() : "";
    const size = typeof item.size === "string" ? item.size.trim() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (color) {
      if (!groups.has("Color")) groups.set("Color", new Set());
      groups.get("Color")!.add(color);
    }
    if (size) {
      if (!groups.has("Talla")) groups.set("Talla", new Set());
      groups.get("Talla")!.add(size);
    }
    if (!color && !size && name) {
      if (!groups.has("Opción")) groups.set("Opción", new Set());
      groups.get("Opción")!.add(name);
    }
  }
  return Array.from(groups.entries()).map(([name, options]) => ({
    name,
    options: Array.from(options),
  }));
}

export function extractVariantSwatches(product: Product | null): VariantSwatch[] {
  if (!product || !product.variantList) return [];
  const swatchesMap = new Map<string, VariantSwatch>();
  product.variantList.forEach((vItem) => {
    if (!vItem.imageUrl) return;
    const key = (vItem.color || vItem.name || vItem.imageUrl).trim().toLowerCase();
    if (!swatchesMap.has(key)) {
      swatchesMap.set(key, {
        name: vItem.color || vItem.name || "Color",
        color: vItem.color,
        imageUrl: getMediaUrl(vItem.imageUrl),
      });
    }
  });
  return Array.from(swatchesMap.values());
}

export function getMissingOptions(
  product: Product | null,
  selected: { [key: string]: string },
  selectedShippingOption: ShippingOptionItem | null
): string[] {
  if (!product) return [];
  const missing: string[] = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v) => {
      if (!selected[v.name] || !selected[v.name].trim()) {
        missing.push(v.name);
      }
    });
  } else if (product.variantList && product.variantList.length > 0) {
    const hasSwatches = product.variantList.some((item) => item.imageUrl || item.color || item.name);
    if (hasSwatches && !selected["Color"] && !selected["Opción"]) {
      missing.push("Color");
    }
  }
  if (!selectedShippingOption) {
    missing.push("Envío");
  }
  return missing;
}

export function getAvailableStock(product: Product | null): number {
  if (!product) return 0;
  return Math.max(
    0,
    typeof product.stock === "number"
      ? product.stock
      : parseInt(String(product.stock ?? 0), 10) || 0
  );
}

export function getSellerInfo(users: User[], sellerId?: string) {
  if (!sellerId) return { name: "Vendedor Oficial", avatar: "" };
  return users.find((u) => u.id === sellerId) || { name: "Vendedor Oficial", avatar: "" };
}
