import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../../config";
import { VerificasionTiendaViewProps, WebPaymentExtraDetails, WebPaymentMethod, WebPaypalSdk } from "./tipos";

export function useEstadoPago({ name, email, phone, address, city, country, postalCode, effectiveCheckoutItems, cartShippingTotal, cartTotal, executePayment }: VerificasionTiendaViewProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<WebPaymentMethod>("tarjeta");
  const [activeModal, setActiveModal] = useState<WebPaymentMethod | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState("");
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paypalCurrency, setPaypalCurrency] = useState("USD");
  const [isPaypalLoading, setIsPaypalLoading] = useState(false);
  const paypalButtonsRef = useRef<HTMLDivElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);

  const validateCheckout = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() ||
        !city.trim() || !country.trim() || !postalCode.trim()) {
      setPaymentError("Completa todos tus datos de contacto y dirección antes de continuar.");
      return false;
    }
    setPaymentError("");
    return true;
  };

  const copyPaymentText = async (value: string, key: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedBank(key);
      window.setTimeout(() => setCopiedBank(null), 2200);
    } catch {
      setPaymentError("No se pudo copiar el dato. Puedes seleccionarlo manualmente.");
    }
  };

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPaymentError("Selecciona una imagen válida del comprobante.");
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const dataUrl = reader.result;
      const image = new Image();
      image.onload = () => {
        let { width, height } = image;
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round(height * maxDimension / width);
            width = maxDimension;
          } else {
            width = Math.round(width * maxDimension / height);
            height = maxDimension;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (context) {
            context.drawImage(image, 0, 0, width, height);
            setReceiptImage(canvas.toDataURL("image/jpeg", 0.85));
            setPaymentError("");
            return;
          }
        }
        setReceiptImage(dataUrl);
        setPaymentError("");
      };
      image.onerror = () => { setReceiptImage(dataUrl); setPaymentError(""); };
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptImage(null);
    setReceiptFileName("");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const submitNonCardPayment = async (method: "transferencia" | "contra_entrega") => {
    if (!validateCheckout() || isProcessingPayment || (method === "transferencia" && !receiptImage)) return;
    setIsProcessingPayment(true);
    setPaymentError("");
    try {
      const orderId = `${method}_${Date.now()}`;
      const succeeded = await executePayment(orderId, method === "transferencia"
        ? { paymentMethod: method, paymentReceiptUrl: receiptImage, receiptFileName: receiptFileName || "comprobante_transferencia.jpg" }
        : { paymentMethod: method });
      if (succeeded) setActiveModal(null);
      else setPaymentError("No se pudo registrar el pedido. Inténtalo nuevamente.");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "No se pudo confirmar el pedido.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (activeModal !== "tarjeta") return;
    let cancelled = false;
    const initializePaypal = async () => {
      setIsPaypalLoading(true);
      setPaymentError("");
      try {
        const configResponse = await apiFetch("/api/paypal/config");
        const config = await configResponse.json();
        const envClientId = (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID?.trim() || "";
        const clientId = config.clientId || envClientId;
        const currency = config.currency || "USD";
        if (!clientId) throw new Error(config.message || "PayPal no está configurado.");
        setPaypalCurrency(currency);
        if (!(window as any).paypal) {
          let script = document.getElementById("paypal-checkout-sdk-web") as HTMLScriptElement | null;
          if (!script) {
            script = document.createElement("script");
            script.id = "paypal-checkout-sdk-web";
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
            script.async = true;
            document.body.appendChild(script);
          }
          await new Promise<void>((resolve, reject) => {
            if ((window as any).paypal) return resolve();
            script?.addEventListener("load", () => resolve(), { once: true });
            script?.addEventListener("error", () => reject(new Error("No se pudo cargar PayPal.")), { once: true });
          });
        }
        if (cancelled || !(window as any).paypal || !paypalButtonsRef.current) return;
        paypalButtonsRef.current.replaceChildren();
        const buttons = ((window as any).paypal as WebPaypalSdk).Buttons({
          style: { layout: "vertical", shape: "rect", borderRadius: 14 },
          createOrder: async () => {
            if (!validateCheckout()) throw new Error("Completa tus datos de envío.");
            const response = await apiFetch("/api/paypal/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: effectiveCheckoutItems, shippingCost: cartShippingTotal }),
            });
            const payload = await response.json();
            if (!response.ok || !payload.id) throw new Error(payload.error || "No se pudo iniciar el pago con PayPal.");
            return payload.id;
          },
          onApprove: async ({ orderID }) => {
            setIsProcessingPayment(true);
            try {
              const succeeded = await executePayment(orderID, { paymentMethod: "tarjeta" });
              if (!succeeded) throw new Error("No se pudo confirmar el pago con PayPal.");
              setActiveModal(null);
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onCancel: () => setPaymentError("Pago cancelado en PayPal."),
          onError: (error) => {
            console.error("Error PayPal web:", error);
            setPaymentError(error instanceof Error ? error.message : "No se pudo completar el pago con PayPal.");
          },
        });
        await buttons.render(paypalButtonsRef.current);
      } catch (error) {
        if (!cancelled) setPaymentError(error instanceof Error ? error.message : "No se pudo preparar PayPal.");
      } finally {
        if (!cancelled) setIsPaypalLoading(false);
      }
    };
    void initializePaypal();
    return () => {
      cancelled = true;
      paypalButtonsRef.current?.replaceChildren();
    };
  }, [activeModal]);

  return { selectedPaymentMethod, setSelectedPaymentMethod, activeModal, setActiveModal, receiptImage, receiptFileName, copiedBank, paymentError, setPaymentError, isProcessingPayment, isPaypalLoading, paypalCurrency, paypalButtonsRef, receiptInputRef, validateCheckout, copyPaymentText, handleReceiptChange, removeReceipt, submitNonCardPayment };
}
