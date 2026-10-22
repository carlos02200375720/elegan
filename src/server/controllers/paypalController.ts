import { Request, Response } from "express";
import { products } from "../services/state";

const PAYPAL_CURRENCY = "USD";

interface PaypalCartItem {
  product?: { id?: string };
  productId?: string;
  quantity?: number;
  selectedShippingCost?: number;
}

interface PaypalApiError extends Error {
  status?: number;
}

let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function getPaypalSettings() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("PayPal no está configurado en el servidor.");
  }

  const mode = process.env.PAYPAL_MODE?.trim().toLowerCase() || "sandbox";
  if (mode !== "sandbox" && mode !== "live") {
    throw new Error("PAYPAL_MODE debe ser sandbox o live.");
  }

  return {
    clientId,
    clientSecret,
    apiBase: mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
    mode,
  };
}

async function getAccessToken(): Promise<string> {
  const settings = getPaypalSettings();
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.value;
  }

  const response = await fetch(`${settings.apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !payload.access_token) {
    cachedAccessToken = null;
    throw new Error("PayPal no pudo autenticar las credenciales configuradas.");
  }

  cachedAccessToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in) || 300) * 1000,
  };
  return cachedAccessToken.value;
}

async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const settings = getPaypalSettings();
  const accessToken = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${settings.apiBase}${path}`, {
    ...init,
    headers,
  });
  const payload = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) {
    const error = new Error(payload.message || "PayPal rechazó la solicitud.") as PaypalApiError;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePaypalAmount(items: PaypalCartItem[], requestedShippingCost: number) {
  getPaypalSettings();
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No hay productos seleccionados para pagar.");
  }

  let subtotalUsd = 0;
  let calculatedShippingUsd = 0;
  const quantitiesByProduct = new Map<string, number>();
  for (const item of items) {
    const productId = item.productId || item.product?.id;
    const product = products.find((entry) => entry.id === productId);
    const quantity = Number(item.quantity);
    if (!product) throw new Error("Uno de los productos ya no está disponible.");
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("La cantidad de un producto no es válida.");
    const productPrice = Number(product.price);
    if (!Number.isFinite(productPrice) || productPrice < 0) {
      throw new Error(`El precio de ${product.name} no es válido.`);
    }
    quantitiesByProduct.set(product.id, (quantitiesByProduct.get(product.id) || 0) + quantity);

    const optionShippingCosts = (product.shippingOptions || [])
      .map((option) => Number(option.price))
      .filter(Number.isFinite);
    const allowedShippingCosts = [
      Number(product.shippingCost || 0),
      Number(product.shippingCapital || 0),
      Number(product.shippingProvince || 0),
      ...(product.freeShipping ? [0] : []),
      ...optionShippingCosts,
    ].map(roundMoney);
    const itemShippingCost = item.selectedShippingCost === undefined
      ? roundMoney(Number(product.shippingCost || 0))
      : roundMoney(Number(item.selectedShippingCost));
    if (!Number.isFinite(itemShippingCost) || !allowedShippingCosts.includes(itemShippingCost)) {
      throw new Error(`El costo de envío de ${product.name} ya no es válido. Actualiza el carrito.`);
    }

    subtotalUsd += productPrice * quantity;
    calculatedShippingUsd += itemShippingCost * quantity;
  }

  for (const [productId, quantity] of quantitiesByProduct) {
    const product = products.find((entry) => entry.id === productId);
    if (!product || !Number.isFinite(Number(product.stock)) || Number(product.stock) < quantity) {
      throw new Error(`No hay existencias suficientes de ${product?.name || "un producto"}.`);
    }
  }

  const shippingCost = Number(requestedShippingCost);
  if (!Number.isFinite(shippingCost) || roundMoney(shippingCost) !== roundMoney(calculatedShippingUsd)) {
    throw new Error("El costo de envío cambió. Actualiza el carrito antes de pagar.");
  }

  const totalUsd = roundMoney(subtotalUsd + calculatedShippingUsd);
  if (totalUsd <= 0) throw new Error("El total del pago debe ser mayor que cero.");

  return { totalUsd };
}

export function getPaypalConfig(_req: Request, res: Response): void {
  try {
    const settings = getPaypalSettings();
    res.json({
      clientId: settings.clientId,
      currency: PAYPAL_CURRENCY,
      mode: settings.mode,
    });
  } catch (error) {
    res.status(503).json({
      error: error instanceof Error ? error.message : "PayPal no está disponible.",
    });
  }
}

export async function createPaypalOrder(req: Request, res: Response): Promise<void> {
  try {
    const { totalUsd } = calculatePaypalAmount(req.body.items, req.body.shippingCost);
    const order = await paypalRequest<{ id?: string }>("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: totalUsd.toFixed(2),
          },
          description: `Compra MallSocial (${totalUsd.toFixed(2)} USD)`,
        }],
        application_context: {
          brand_name: "MallSocial",
          user_action: "PAY_NOW",
        },
      }),
    });
    if (!order.id) throw new Error("PayPal no devolvió el identificador del pedido.");
    res.json({ id: order.id, currency: PAYPAL_CURRENCY, totalUsd });
  } catch (error) {
    const status = (error as PaypalApiError).status;
    res.status(status && status < 500 ? 400 : 502).json({
      error: error instanceof Error ? error.message : "No se pudo iniciar el pago con PayPal.",
    });
  }
}

export async function capturePaypalOrder(
  paypalOrderId: string,
  items: PaypalCartItem[],
  shippingCost: number
): Promise<void> {
  const { totalUsd } = calculatePaypalAmount(items, shippingCost);
  const safeOrderId = encodeURIComponent(paypalOrderId);
  let order = await paypalRequest<any>(`/v2/checkout/orders/${safeOrderId}`);

  if (order.status !== "COMPLETED") {
    order = await paypalRequest<any>(`/v2/checkout/orders/${safeOrderId}/capture`, {
      method: "POST",
      headers: { "PayPal-Request-Id": `capture-${paypalOrderId}` },
      body: JSON.stringify({}),
    });
  }

  const capture = order.purchase_units?.[0]?.payments?.captures?.find(
    (entry: any) => entry.status === "COMPLETED"
  );
  const amount = capture?.amount;
  if (
    order.status !== "COMPLETED" ||
    !amount ||
    amount.currency_code !== PAYPAL_CURRENCY ||
    roundMoney(Number(amount.value)) !== totalUsd
  ) {
    throw new Error("PayPal no confirmó el pago por el importe correcto.");
  }
}
