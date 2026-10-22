import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";
import { CartItem } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import { androidApi } from "../api";

interface PaypalSdk {
  Buttons: (options: {
    createOrder: (data?: any, actions?: any) => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: unknown) => void;
  }) => {
    render: (container: HTMLElement) => Promise<void>;
  };
}

declare global {
  interface Window {
    paypal?: PaypalSdk;
  }
}

export interface AndroidCheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city?: string;
  country: string;
  postalCode: string;
}

export interface AndroidVerificacionProps {
  onBackToCart: () => void;
  checkoutForm: AndroidCheckoutForm;
  setCheckoutForm: React.Dispatch<React.SetStateAction<AndroidCheckoutForm>>;
  effectiveCheckoutItems: CartItem[];
  cart: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  handleCheckout: (paypalOrderId: string) => Promise<boolean>;
  isCheckingOut: boolean;
}

export function VerificacionTiendaView({
  onBackToCart,
  checkoutForm,
  setCheckoutForm,
  effectiveCheckoutItems,
  cart,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
  handleCheckout,
  isCheckingOut,
}: AndroidVerificacionProps) {
  const fixedFooterRef = useRef<HTMLDivElement | null>(null);
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const checkoutDataRef = useRef({ checkoutForm, effectiveCheckoutItems, cartShippingTotal, handleCheckout });
  const [footerHeight, setFooterHeight] = useState<number>(76);
  const [paypalError, setPaypalError] = useState("");
  const [paypalCurrency, setPaypalCurrency] = useState("USD");
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [isPaypalConfigured, setIsPaypalConfigured] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  checkoutDataRef.current = { checkoutForm, effectiveCheckoutItems, cartShippingTotal, handleCheckout };

  const validateForm = (): boolean => {
    const { checkoutForm: form } = checkoutDataRef.current;
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.shippingAddress.trim() ||
      !form.city?.trim() ||
      !form.country.trim() ||
      !form.postalCode.trim()
    ) {
      setPaypalError("Completa todos tus datos de contacto y dirección antes de continuar.");
      return false;
    }
    setPaypalError("");
    return true;
  };

  const handleManualConfirm = async () => {
    if (!validateForm()) return;
    if (isCheckingOut) return;
    try {
      const orderId = `manual_${Date.now()}`;
      await checkoutDataRef.current.handleCheckout(orderId);
    } catch (err: any) {
      setPaypalError(err?.message || "No se pudo procesar el pedido. Inténtalo de nuevo.");
    }
  };

  useEffect(() => {
    if (!fixedFooterRef.current) return;
    const updateHeight = () => {
      if (fixedFooterRef.current) {
        setFooterHeight(fixedFooterRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(fixedFooterRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPaypalButtons = async () => {
      try {
        const config = await androidApi.getPaypalConfig();
        if (cancelled) return;

        // Check both backend config and build-time GitHub Action secrets
        const envClientId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID?.trim() || "";
        const envMode = ((import.meta as any).env?.VITE_PAYPAL_MODE?.trim() || "sandbox") as "sandbox" | "live";

        const effectiveClientId = config.clientId || envClientId;
        const effectiveCurrency = config.currency || "USD";
        const effectiveMode = (config.mode || envMode) as "sandbox" | "live";

        setPaypalCurrency(effectiveCurrency);
        setPaypalMode(effectiveMode);

        if (!effectiveClientId) {
          setIsPaypalConfigured(false);
          setIsLoadingConfig(false);
          return;
        }

        setIsPaypalConfigured(true);

        if (!window.paypal) {
          let script = document.getElementById("paypal-checkout-sdk") as HTMLScriptElement | null;
          if (!script) {
            script = document.createElement("script");
            script.id = "paypal-checkout-sdk";
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(effectiveClientId)}&currency=${encodeURIComponent(effectiveCurrency)}&intent=capture&components=buttons`;
            script.async = true;
            document.body.appendChild(script);
          }
          await new Promise<void>((resolve, reject) => {
            if (window.paypal) {
              resolve();
              return;
            }
            script?.addEventListener("load", () => resolve(), { once: true });
            script?.addEventListener("error", () => reject(new Error("No se pudo cargar el componente seguro de PayPal.")), { once: true });
          });
        }

        const paypalSdk = window.paypal;
        const buttonsContainer = paypalButtonsRef.current;
        if (cancelled || !paypalSdk || !buttonsContainer) {
          setIsLoadingConfig(false);
          return;
        }

        buttonsContainer.replaceChildren();

        const buttons = paypalSdk.Buttons({
          createOrder: async (_data: any, actions?: any) => {
            if (!validateForm()) {
              throw new Error("Completa tus datos de envío.");
            }
            const { effectiveCheckoutItems: items, cartShippingTotal: shipping, cartTotal: total } = checkoutDataRef.current;
            // 1. Intento por backend seguro
            try {
              const paypalOrder = await androidApi.createPaypalOrder(items, shipping);
              if (paypalOrder?.id) return paypalOrder.id;
            } catch (err: any) {
              console.warn("Backend PayPal order fallback:", err?.message);
            }
            // 2. Respaldo directo en cliente si el backend de Cloud Run aún no tiene PAYPAL_CLIENT_SECRET
            if (actions?.order?.create) {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: total.toFixed(2),
                    currency_code: effectiveCurrency,
                  },
                  description: `Compra MallSocial (${total.toFixed(2)} ${effectiveCurrency})`,
                }],
              });
            }
            throw new Error("No se pudo iniciar la transacción de PayPal.");
          },
          onApprove: async ({ orderID }) => {
            const succeeded = await checkoutDataRef.current.handleCheckout(orderID);
            if (!succeeded) {
              throw new Error("No se pudo confirmar el pago. Verifica la conexión e inténtalo de nuevo.");
            }
          },
          onCancel: () => setPaypalError("Pago cancelado. No se realizó ningún cobro."),
          onError: (error) => {
            console.error("Error al procesar PayPal:", error);
            setPaypalError("PayPal no pudo completar el pago. Puedes confirmar con pago contra entrega.");
          },
        });
        await buttons.render(buttonsContainer);
        setIsLoadingConfig(false);
      } catch (error) {
        if (cancelled) return;
        setIsPaypalConfigured(false);
        setIsLoadingConfig(false);
      }
    };

    void loadPaypalButtons();
    return () => {
      cancelled = true;
      paypalButtonsRef.current?.replaceChildren();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none">
      {/* Checkout Top Header */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 py-2 border-b border-slate-100 flex items-center justify-between"
        style={{ paddingTop: "max(8px, env(safe-area-inset-top, 0px))" }}
      >
        <button
          type="button"
          onClick={onBackToCart}
          className="p-1.5 rounded-full bg-slate-100 text-slate-900 active:scale-95 cursor-pointer hover:bg-slate-200 transition-colors"
          id="android-checkout-back-btn"
          title="Volver al carrito"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xs font-black text-slate-900 tracking-tight">Checkout</h1>
        </div>
        <div className="w-7" />
      </div>

      <div
        className="px-4 py-4 space-y-4"
        style={{
          paddingBottom: `${footerHeight + 3}px`,
        }}
      >
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Información de envío
            </span>
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-700">Nombre completo</label>
              <input
                value={checkoutForm.fullName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Correo</label>
              <input
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Número de celular</label>
              <input
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="+52 555 000 0000"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Dirección de entrega</label>
              <input
                value={checkoutForm.shippingAddress}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Calle, número, colonia"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700">Ciudad</label>
                <input
                  value={checkoutForm.city || ""}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700">País</label>
                <input
                  value={checkoutForm.country}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="País"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Código postal</label>
              <input
                value={checkoutForm.postalCode}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="00000"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              {isPaypalConfigured ? "Pago seguro con PayPal" : "Método de Pago y Entrega"}
            </span>
          </div>
          {isPaypalConfigured ? (
            <>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Los precios de la tienda y el pago se realizan directamente en {paypalCurrency}.
              </p>
              {paypalMode === "sandbox" && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                  Modo de prueba: los pagos no son cobros reales.
                </p>
              )}
            </>
          ) : (
            <div className="mt-2 text-xs leading-5 text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Pago contra entrega / Acordar con el vendedor</p>
              <p className="text-[11px] text-slate-500">
                Tu pedido quedará registrado de inmediato y la tienda coordinará contigo la entrega y el pago.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Resumen de compra
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              {effectiveCheckoutItems.length} de {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {effectiveCheckoutItems.length === 0 ? (
              <div className="text-center text-[11px] text-slate-500 py-3">
                No hay productos seleccionados para pagar.
              </div>
            ) : (
              effectiveCheckoutItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] font-black text-amber-600">
                        {formatPrice(item.product.price * (item.quantity || 1))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">Cantidad: {item.quantity || 1}</span>
                      <span className="text-[10px] text-slate-500">{formatPrice(item.product.price)} c/u</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 font-semibold">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-semibold">
              <span>Costo de Envío</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                {cartShippingTotal === 0 ? "GRATIS" : formatPrice(cartShippingTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total</span>
              <span className="text-amber-600 font-mono">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>

        {/* Fixed Checkout Footer */}
        <div
          ref={fixedFooterRef}
          id="android-checkout-footer-action"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-4 py-3"
          style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))" }}
        >
          <div className="max-w-md mx-auto w-full">
            {paypalError && (
              <p role="alert" className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                {paypalError}
              </p>
            )}
            <p className="mb-2 text-center text-sm font-black text-slate-900">
              Total a pagar:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: paypalCurrency,
              }).format(cartTotal)}
            </p>

            {isPaypalConfigured && (
              <div ref={paypalButtonsRef} aria-label={`Pagar ${formatPrice(cartTotal)} con PayPal`} className="mb-2" />
            )}

            {(!isPaypalConfigured || paypalError) && (
              <button
                type="button"
                id="android-checkout-confirm-direct-btn"
                disabled={isCheckingOut || effectiveCheckoutItems.length === 0}
                onClick={handleManualConfirm}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                {isCheckingOut ? "Confirmando pedido..." : `Confirmar Pedido (${formatPrice(cartTotal)})`}
              </button>
            )}

            {isCheckingOut && (
              <p className="mt-2 text-center text-xs font-semibold text-slate-500">Confirmando el pedido...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificacionTiendaView;
