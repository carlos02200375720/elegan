import type { Product } from "../../tipos";
import type { ShippingOptionItem } from "./tipos";

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
      const key = cleanLabel.toLowerCase();
      seenLabels.add(key);
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
