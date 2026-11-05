import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { androidApi } from "../../api";
import {
  AndroidVerificacionProps,
  PaymentMethodType,
  PaypalSdk,
} from "./TiposVerificacion";
import {
  validateCheckoutForm,
  compressReceiptImage,
  copyToClipboard,
} from "./FuncionesVerificacion";
import { DireccionEntrega } from "./DireccionEntrega";
import { MetodosPago } from "./MetodosPago";
import { ResumenPedido } from "./ResumenPedido";
import { ConfirmacionPedido } from "./ConfirmacionPedido";
import { FormularioPago } from "./FormularioPago";

declare global {
  interface Window {
    paypal?: PaypalSdk;
  }
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
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const checkoutDataRef = useRef({
    checkoutForm,
    effectiveCheckoutItems,
    cartShippingTotal,
    cartTotal,
    handleCheckout,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("tarjeta");
  const [activeModal, setActiveModal] = useState<PaymentMethodType | null>(null);

  // Estados de transferencia
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados de PayPal
  const [paypalError, setPaypalError] = useState("");
  const [paypalCurrency, setPaypalCurrency] = useState("USD");
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [isPaypalConfigured, setIsPaypalConfigured] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  checkoutDataRef.current = {
    checkoutForm,
    effectiveCheckoutItems,
    cartShippingTotal,
    cartTotal,
    handleCheckout,
  };

  const validateForm = (): boolean => {
    const { checkoutForm: form } = checkoutDataRef.current;
    const { isValid, error } = validateCheckoutForm(form);
    if (!isValid && error) {
      setPaypalError(error);
      return false;
    }
    setPaypalError("");
    return true;
  };

  const handleCopyText = async (text: string, bankId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedBank(bankId);
      setTimeout(() => setCopiedBank(null), 2500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setReceiptFileName(file.name);
      const compressed = await compressReceiptImage(file);
      setReceiptImage(compressed);
      setPaypalError("");
    } catch (err: any) {
      setPaypalError(err?.message || "No se pudo procesar la imagen del comprobante.");
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMainConfirmClick = () => {
    if (!validateForm()) return;
    if (effectiveCheckoutItems.length === 0 || isCheckingOut) return;
    setActiveModal(selectedPaymentMethod);
  };

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

  // Carga de botones de PayPal oficiales
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
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
              effectiveClientId
            )}&currency=${encodeURIComponent(effectiveCurrency)}&intent=capture&components=buttons`;
            script.async = true;
            document.body.appendChild(script);
          }
          await new Promise<void>((resolve, reject) => {
            if (window.paypal) {
              resolve();
              return;
            }
            script?.addEventListener("load", () => resolve(), { once: true });
            script?.addEventListener(
              "error",
              () => reject(new Error("No se pudo cargar el componente seguro de PayPal.")),
              { once: true }
            );
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
              const {
                effectiveCheckoutItems: items,
                cartShippingTotal: shipping,
                cartTotal: total,
              } = checkoutDataRef.current;
              try {
                const paypalOrder = await androidApi.createPaypalOrder(items, shipping);
                if (paypalOrder?.id) return paypalOrder.id;
              } catch (err: any) {
                console.warn("Backend PayPal order fallback:", err?.message);
              }
              if (actions?.order?.create) {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: total.toFixed(2),
                        currency_code: effectiveCurrency,
                      },
                      description: `Compra Elegán (${total.toFixed(2)} ${effectiveCurrency})`,
                    },
                  ],
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
        {/* Alerta de error si existe */}
        {paypalError && (
          <div className="px-3 pt-2 pb-1">
            <div
              role="alert"
              className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-xs font-semibold text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1">{paypalError}</span>
            </div>
          </div>
        )}

        {/* 1. Información del comprador y dirección de entrega */}
        <DireccionEntrega
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
        />

        {/* Separador gris de 5px */}
        <div className="w-full h-[5px] bg-slate-200" />

        {/* 2. Métodos de pago */}
        <MetodosPago
          selectedPaymentMethod={selectedPaymentMethod}
          onSelectPaymentMethod={setSelectedPaymentMethod}
        />

        {/* Separador gris de 5px */}
        <div className="w-full h-[5px] bg-slate-200" />

        {/* 3. Resumen de compra */}
        <ResumenPedido
          effectiveCheckoutItems={effectiveCheckoutItems}
          cartSubtotal={cartSubtotal}
          cartShippingTotal={cartShippingTotal}
          cartTotal={cartTotal}
        />
      </div>

      {/* 4. Pie de página fijo con botón de confirmación */}
      <ConfirmacionPedido
        isCheckingOut={isCheckingOut}
        isDisabled={effectiveCheckoutItems.length === 0}
        onConfirmClick={handleMainConfirmClick}
      />

      {/* 5. Modales / Paneles inferiores de pago */}
      <FormularioPago
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        cartTotal={cartTotal}
        checkoutForm={checkoutForm}
        receiptImage={receiptImage}
        receiptFileName={receiptFileName}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        handleRemoveReceipt={handleRemoveReceipt}
        copiedBank={copiedBank}
        handleCopyText={handleCopyText}
        handleConfirmBankTransfer={handleConfirmBankTransfer}
        handleConfirmCashOnDelivery={handleConfirmCashOnDelivery}
        paypalButtonsRef={paypalButtonsRef}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
}

export default VerificacionTiendaView;
