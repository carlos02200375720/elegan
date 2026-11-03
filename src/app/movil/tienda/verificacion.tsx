import React, { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Building2,
  CreditCard,
  Truck,
  Copy,
  Check,
  Upload,
  X,
  AlertCircle,
  FileCheck,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CartItem } from "../../../types";
import { formatPrice } from "../../../utils/currency";
import { androidApi } from "../api";
import { getProductImageUrl } from "./productMedia";

interface PaypalSdk {
  Buttons: (options: {
    style?: {
      layout?: "vertical" | "horizontal";
      color?: "gold" | "blue" | "silver" | "white" | "black";
      shape?: "rect" | "pill";
      label?: "paypal" | "checkout" | "buynow" | "pay";
      tagline?: boolean;
      borderRadius?: number;
    };
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

export interface PaymentExtraDetails {
  paymentMethod?: PaymentMethodType;
  paymentReceiptUrl?: string | null;
  receiptFileName?: string;
  bankName?: string;
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
  handleCheckout: (paypalOrderId: string, extraDetails?: PaymentExtraDetails) => Promise<boolean>;
  isCheckingOut: boolean;
}

export type PaymentMethodType = "transferencia" | "tarjeta" | "contra_entrega";

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
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const checkoutDataRef = useRef({ checkoutForm, effectiveCheckoutItems, cartShippingTotal, cartTotal, handleCheckout });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("tarjeta");
  const [activeModal, setActiveModal] = useState<PaymentMethodType | null>(null);

  // Transferencia states
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [paypalError, setPaypalError] = useState("");
  const [paypalCurrency, setPaypalCurrency] = useState("USD");
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [isPaypalConfigured, setIsPaypalConfigured] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  checkoutDataRef.current = { checkoutForm, effectiveCheckoutItems, cartShippingTotal, cartTotal, handleCheckout };

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

  const handleCopyText = (text: string, bankId: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      setCopiedBank(bankId);
      setTimeout(() => setCopiedBank(null), 2500);
    } catch {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPaypalError("Por favor selecciona una imagen válida del comprobante de pago.");
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const rawDataUrl = reader.result;
        // Optimization: scale down large images to maximum 1200px
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL("image/jpeg", 0.85);
              setReceiptImage(compressed);
              setPaypalError("");
              return;
            }
          }
          setReceiptImage(rawDataUrl);
          setPaypalError("");
        };
        img.onerror = () => {
          setReceiptImage(rawDataUrl);
          setPaypalError("");
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Main fixed action button click handler
  const handleMainConfirmClick = () => {
    if (!validateForm()) return;
    if (effectiveCheckoutItems.length === 0 || isCheckingOut) return;

    // Open corresponding bottom-sheet panel based on user selection
    setActiveModal(selectedPaymentMethod);
  };

  // Confirm cash on delivery order
  const handleConfirmCashOnDelivery = async () => {
    if (!validateForm() || isCheckingOut) return;
    try {
      const orderId = `contra_entrega_${Date.now()}`;
      await checkoutDataRef.current.handleCheckout(orderId, {
        paymentMethod: "contra_entrega",
      });
      setActiveModal(null);
    } catch (err: any) {
      setPaypalError(err?.message || "No se pudo confirmar el pedido contra entrega.");
    }
  };

  // Confirm bank transfer order (only enabled after receipt upload)
  const handleConfirmBankTransfer = async () => {
    if (!validateForm() || isCheckingOut || !receiptImage) return;
    try {
      const orderId = `transferencia_${Date.now()}`;
      await checkoutDataRef.current.handleCheckout(orderId, {
        paymentMethod: "transferencia",
        paymentReceiptUrl: receiptImage,
        receiptFileName: receiptFileName || "comprobante_transferencia.jpg",
      });
      setActiveModal(null);
    } catch (err: any) {
      setPaypalError(err?.message || "No se pudo registrar la transferencia. Inténtalo de nuevo.");
    }
  };

  // Initialize official PayPal buttons
  useEffect(() => {
    let cancelled = false;

    const loadPaypalButtons = async () => {
      try {
        const config = await androidApi.getPaypalConfig();
        if (cancelled) return;

        const envClientId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID?.trim() || "";
        const envMode = ((import.meta as any).env?.VITE_PAYPAL_MODE?.trim() || "sandbox") as "sandbox" | "live";

        const effectiveClientId = config.clientId || envClientId || "sb";
        const effectiveCurrency = config.currency || "USD";
        const effectiveMode = (config.mode || envMode || "sandbox") as "sandbox" | "live";

        setPaypalCurrency(effectiveCurrency);
        setPaypalMode(effectiveMode);
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
        if (cancelled || !paypalSdk) {
          setIsLoadingConfig(false);
          return;
        }

        if (activeModal === "tarjeta") {
          let buttonsContainer = paypalButtonsRef.current;
          if (!buttonsContainer) {
            await new Promise((resolve) => setTimeout(resolve, 80));
            buttonsContainer = paypalButtonsRef.current;
          }
          if (cancelled || !buttonsContainer) {
            setIsLoadingConfig(false);
            return;
          }

          buttonsContainer.replaceChildren();

        const buttons = paypalSdk.Buttons({
          style: {
            layout: "vertical",
            shape: "rect",
            borderRadius: 14,
          },
          createOrder: async (_data: any, actions?: any) => {
            if (!validateForm()) {
              throw new Error("Completa tus datos de envío.");
            }
            const { effectiveCheckoutItems: items, cartShippingTotal: shipping, cartTotal: total } = checkoutDataRef.current;
            try {
              const paypalOrder = await androidApi.createPaypalOrder(items, shipping);
              if (paypalOrder?.id) return paypalOrder.id;
            } catch (err: any) {
              console.warn("Backend PayPal order fallback:", err?.message);
            }
            if (actions?.order?.create) {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: total.toFixed(2),
                    currency_code: effectiveCurrency,
                  },
                  description: `Compra Elegán (${total.toFixed(2)} ${effectiveCurrency})`,
                }],
              });
            }
            throw new Error("No se pudo iniciar la transacción de PayPal.");
          },
          onApprove: async ({ orderID }) => {
            const succeeded = await checkoutDataRef.current.handleCheckout(orderID, {
              paymentMethod: "tarjeta",
            });
            if (!succeeded) {
              throw new Error("No se pudo confirmar el pago. Inténtalo de nuevo.");
            }
            setActiveModal(null);
          },
          onCancel: () => {
            setPaypalError("Pago cancelado en PayPal.");
          },
          onError: (error) => {
            console.error("Error PayPal:", error);
            setPaypalError("No se pudo completar el pago con PayPal.");
          },
        });
        await buttons.render(buttonsContainer);
      }
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
  }, [activeModal]);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none pb-28">
      {/* Checkout Top Header */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-3 py-2.5 border-b border-slate-200 flex items-center justify-between"
        style={{ paddingTop: "max(10px, env(safe-area-inset-top, 0px))" }}
      >
        <button
          type="button"
          onClick={onBackToCart}
          className="p-2 rounded-full bg-slate-100 text-slate-900 active:scale-95 cursor-pointer hover:bg-slate-200 transition-colors"
          id="android-checkout-back-btn"
          title="Volver al carrito"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Verificación de Pago</h1>
        </div>
        <div className="w-8" />
      </div>

      <div className="w-full">
        {/* Error alert if any */}
        {paypalError && (
          <div className="px-3 pt-2 pb-1">
            <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1">{paypalError}</span>
            </div>
          </div>
        )}

        {/* 1. Información de envío */}
        <div className="w-full bg-white rounded-none shadow-none p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Datos de entrega
            </span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>

          <div className="mt-3.5 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-700">Nombre completo *</label>
              <input
                value={checkoutForm.fullName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Correo electrónico *</label>
              <input
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Teléfono / WhatsApp *</label>
              <input
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="809-000-0000"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Dirección de entrega *</label>
              <input
                value={checkoutForm.shippingAddress}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Calle, número, sector o edificio"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700">Ciudad *</label>
                <input
                  value={checkoutForm.city || ""}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Santo Domingo"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700">País *</label>
                <input
                  value={checkoutForm.country}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="República Dominicana"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Código postal *</label>
              <input
                value={checkoutForm.postalCode}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="10101"
              />
            </div>
          </div>
        </div>

        {/* Separador gris de 5px entre contenedor 1 y contenedor 2 */}
        <div className="w-full h-[5px] bg-slate-200" />

        {/* 2. CONTENEDOR DE OPCIONES DE PAGO (3 METODOS SOLICITADOS) */}
        <div className="w-full bg-white rounded-none shadow-none p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Método de pago
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Metodo 1: Transferencia bancaria */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod("transferencia")}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                selectedPaymentMethod === "transferencia"
                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPaymentMethod === "transferencia"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      Transferencia bancaria
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      Popular / Banreservas / BHD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Transfiere a nuestras cuentas y sube tu comprobante
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedPaymentMethod === "transferencia"
                    ? "border-amber-500 bg-amber-500 text-slate-950"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedPaymentMethod === "transferencia" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* Metodo 2: Tarjeta de debito o credito */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod("tarjeta")}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                selectedPaymentMethod === "tarjeta"
                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPaymentMethod === "tarjeta"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      Tarjeta de débito o crédito
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PayPal / Tarjeta
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pago inmediato y protegido con Visa, Mastercard o PayPal
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedPaymentMethod === "tarjeta"
                    ? "border-amber-500 bg-amber-500 text-slate-950"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedPaymentMethod === "tarjeta" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* Metodo 3: Pago contra entrega */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod("contra_entrega")}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                selectedPaymentMethod === "contra_entrega"
                  ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPaymentMethod === "contra_entrega"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">
                      Pago contra entrega
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      Santo Domingo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Paga en efectivo al recibir tu pedido en la puerta
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedPaymentMethod === "contra_entrega"
                    ? "border-amber-500 bg-amber-500 text-slate-950"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedPaymentMethod === "contra_entrega" && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Separador gris de 5px entre contenedor 2 y contenedor 3 */}
        <div className="w-full h-[5px] bg-slate-200" />

        {/* 3. Resumen de compra */}
        <div className="w-full bg-white rounded-none shadow-none p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Resumen de compra
            </span>
            <span className="text-[11px] font-bold text-amber-600">
              {effectiveCheckoutItems.length} {effectiveCheckoutItems.length === 1 ? "artículo" : "artículos"}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {effectiveCheckoutItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
              >
                <img
                  src={getProductImageUrl(item.product)}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-slate-900 truncate">
                      {item.product.name}
                    </span>
                    <span className="text-[11px] font-black text-amber-600 font-mono shrink-0">
                      {formatPrice(item.product.price * (item.quantity || 1))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span>Cantidad: {item.quantity || 1}</span>
                    <span>{formatPrice(item.product.price)} c/u</span>
                  </div>
                </div>
              </div>
            ))}
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
            <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total a pagar</span>
              <span className="text-amber-600 font-mono text-base">{formatPrice(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PIE DE PÁGINA FIJO CON BOTÓN "CONFIRMAR EL PAGO" */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 h-[60px] min-h-[60px] max-h-[60px] bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 shadow-lg box-border"
        style={{ height: "60px", minHeight: "60px", maxHeight: "60px", paddingBottom: "6px" }}
      >
        <div className="max-w-md mx-auto flex h-full items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Total a pagar
            </span>
            <span className="text-base font-black text-slate-900 font-mono leading-none">
              {formatPrice(cartTotal)}
            </span>
          </div>

          <button
            type="button"
            id="android-checkout-fixed-confirm-btn"
            disabled={isCheckingOut || effectiveCheckoutItems.length === 0}
            onClick={handleMainConfirmClick}
            className="flex-1 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isCheckingOut ? "Procesando pedido..." : "Confirmar el pago"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. MODALES / PANELES INFERIORES (BOTTOM SHEETS) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCheckingOut) setActiveModal(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Panel Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl z-10"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
            >
              {/* Handle indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

              {/* MODAL 1: TRANSFERENCIA BANCARIA */}
              {activeModal === "transferencia" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Transferencia Bancaria</h2>
                        <p className="text-[10px] text-slate-500">Cuentas oficiales de Elegán</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable content */}
                  <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {/* Monto total destacado */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">
                          Monto exacto a transferir
                        </span>
                        <span className="text-base font-black text-amber-700 font-mono">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(cartTotal.toFixed(2), "total")}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 font-bold text-[10px] flex items-center gap-1 active:scale-95"
                      >
                        {copiedBank === "total" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBank === "total" ? "Copiado" : "Copiar monto"}</span>
                      </button>
                    </div>

                    {/* 3 Cuentas Bancarias */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 block">
                        Cuentas disponibles (DOP):
                      </span>

                      {/* Cuenta 1: Banco Popular */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">1. Banco Popular</span>
                            <span className="text-[9px] font-bold px-1 rounded bg-blue-100 text-blue-800">Ahorros</span>
                          </div>
                          <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                            824-102948-2
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText("8241029482", "popular")}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 active:scale-95 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedBank === "popular" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBank === "popular" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>

                      {/* Cuenta 2: Banreservas */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">2. Banreservas</span>
                            <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-800">Ahorros</span>
                          </div>
                          <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                            960-239104-5
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText("9602391045", "banreservas")}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 active:scale-95 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedBank === "banreservas" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBank === "banreservas" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>

                      {/* Cuenta 3: BHD */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">3. Banco BHD</span>
                            <span className="text-[9px] font-bold px-1 rounded bg-purple-100 text-purple-800">Ahorros</span>
                          </div>
                          <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                            045-819203-1
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText("0458192031", "bhd")}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 active:scale-95 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedBank === "bhd" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBank === "bhd" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Titular de la cuenta solicitado explícitamente */}
                    <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Titular de la cuenta:
                      </span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs font-black text-slate-900">
                          Carlos David Garcia Batista
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText("Carlos David Garcia Batista", "titular")}
                          className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                        >
                          {copiedBank === "titular" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBank === "titular" ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Campo para subir la foto del comprobante de pago */}
                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-black uppercase tracking-wide text-slate-700 block">
                        Foto del comprobante de pago *
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="receipt-file-input"
                      />

                      {!receiptImage ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-500/5 rounded-2xl p-4 text-center cursor-pointer transition-colors active:scale-[0.99]"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 mx-auto flex items-center justify-center mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-black text-slate-900">
                            Toca aquí para subir la foto del comprobante
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Captura de pantalla o foto de tu voucher de transferencia
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={receiptImage}
                              alt="Comprobante"
                              className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 text-emerald-700 font-black text-xs">
                                <FileCheck className="w-4 h-4" />
                                <span className="truncate">Comprobante cargado</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">
                                {receiptFileName || "foto_comprobante.jpg"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="p-1.5 rounded-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                            title="Eliminar comprobante"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {!receiptImage && (
                        <p className="text-[10px] text-slate-500 italic">
                          Nota: El botón de confirmar pago se habilitará automáticamente al subir la foto de tu comprobante.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón fijo en el pie del panel */}
                  <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                      type="button"
                      disabled={!receiptImage || isCheckingOut}
                      onClick={handleConfirmBankTransfer}
                      className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isCheckingOut
                          ? "Confirmando pago..."
                          : !receiptImage
                          ? "Sube el comprobante para confirmar"
                          : "Confirmar el pago"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL 2: TARJETA DE DEBITO O CREDITO (PAYPAL OFICIAL DENTRO DE LA APP) */}
              {activeModal === "tarjeta" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Tarjeta o PayPal</h2>
                        <p className="text-[10px] text-slate-500">Pasarela oficial cifrada</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">
                          Total a pagar con tarjeta
                        </span>
                        <span className="text-base font-black text-blue-900 font-mono">
                          {formatPrice(cartTotal)}
                        </span>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-blue-600" />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Paga de forma 100% segura dentro de la app con tu tarjeta de débito o crédito (Visa, Mastercard, American Express) o con tu cuenta de PayPal.
                    </p>

                    {/* Contenedor oficial de botones PayPal/Tarjeta */}
                    <div className="pt-2">
                      <div
                        ref={paypalButtonsRef}
                        id="android-paypal-buttons-container-modal"
                        className="w-full min-h-[90px] relative z-10"
                      />
                    </div>

                    {isCheckingOut && (
                      <p className="text-center text-xs font-semibold text-slate-500">
                        Procesando pago con tarjeta...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* MODAL 3: PAGO CONTRA ENTREGA (DISPONIBLE EN SANTO DOMINGO) */}
              {activeModal === "contra_entrega" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Pago Contra Entrega</h2>
                        <p className="text-[10px] text-slate-500">Paga en efectivo al recibir</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 overflow-y-auto space-y-4 text-xs">
                    {/* Mensaje obligatorio solicitado */}
                    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-black text-amber-950 text-xs uppercase tracking-wide">
                          Zona de cobertura exclusiva
                        </h3>
                        <p className="text-xs font-bold text-amber-900 mt-1 leading-snug">
                          El servicio de pago contra entrega está disponible en la ciudad de Santo Domingo.
                        </p>
                      </div>
                    </div>

                    {/* Resumen de entrega */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Detalles de envío:
                      </span>
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-medium">Destinatario:</span>
                        <span className="font-bold text-slate-900">{checkoutForm.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-medium">Teléfono:</span>
                        <span className="font-bold text-slate-900">{checkoutForm.phone}</span>
                      </div>
                      <div className="flex justify-between items-start text-slate-700 gap-2">
                        <span className="font-medium shrink-0">Dirección:</span>
                        <span className="font-bold text-slate-900 text-right">
                          {checkoutForm.shippingAddress}, {checkoutForm.city || "Santo Domingo"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-black">
                        <span>Total a pagar en efectivo:</span>
                        <span className="text-amber-600 font-mono text-sm">{formatPrice(cartTotal)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Al confirmar, despacharemos tu pedido a tu dirección. Por favor mantén el importe exacto listo en efectivo para la entrega.
                    </p>
                  </div>

                  {/* Botón fijo en el pie del panel */}
                  <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <button
                      type="button"
                      disabled={isCheckingOut}
                      onClick={handleConfirmCashOnDelivery}
                      className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isCheckingOut ? "Confirmando pedido..." : "Confirmar pedido contra entrega"}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VerificacionTiendaView;
