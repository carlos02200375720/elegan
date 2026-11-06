import { CartItem } from "../../../../types";

export type WebPaymentMethod = "transferencia" | "tarjeta" | "contra_entrega";
export interface WebPaymentExtraDetails {
  paymentMethod?: WebPaymentMethod;
  paymentReceiptUrl?: string | null;
  receiptFileName?: string;
  bankName?: string;
}
export interface WebPaypalSdk {
  Buttons: (options: {
    style?: { layout?: "vertical" | "horizontal"; shape?: "rect" | "pill"; borderRadius?: number };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel: () => void;
    onError: (error: unknown) => void;
  }) => { render: (container: HTMLElement) => Promise<void> };
}

export const DEST_COUNTRIES = [
  { code: "US", name: "Estados Unidos 🇺🇸" },
  { code: "ES", name: "España 🇪🇸" },
  { code: "MX", name: "México 🇲🇽" },
  { code: "CO", name: "Colombia 🇨🇴" },
  { code: "CL", name: "Chile 🇨🇱" },
  { code: "AR", name: "Argentina 🇦🇷" },
  { code: "PE", name: "Perú 🇵🇪" },
  { code: "EC", name: "Ecuador 🇪🇨" },
  { code: "DO", name: "República Dominicana 🇩🇴" },
  { code: "GT", name: "Guatemala 🇬🇹" },
  { code: "VE", name: "Venezuela 🇻🇪" },
  { code: "FR", name: "Francia 🇫🇷" },
  { code: "DE", name: "Alemania 🇩🇪" },
  { code: "GB", name: "Reino Unido 🇬🇧" },
  { code: "CA", name: "Canadá 🇨🇦" },
  { code: "BR", name: "Brasil 🇧🇷" },
  { code: "IT", name: "Italia 🇮🇹" },
  { code: "PT", name: "Portugal 🇵🇹" },
  { code: "AU", name: "Australia 🇦🇺" },
];

export interface VerificasionTiendaViewProps {
  activeStep: "checkout" | "payment";
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  isFormValid: boolean;
  effectiveCheckoutItems: CartItem[];
  cartSubtotal: number;
  cartShippingTotal: number;
  cartTotal: number;
  executePayment: (paypalOrderId: string, extraPaymentDetails: WebPaymentExtraDetails) => Promise<boolean>;
}

