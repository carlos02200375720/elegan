import type React from "react";
import { CartItem } from "../../../../types";

export interface PaypalSdk {
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

export interface AndroidCheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city?: string;
  country: string;
  postalCode: string;
}

export type PaymentMethodType = "transferencia" | "tarjeta" | "contra_entrega";

export interface PaymentExtraDetails {
  paymentMethod?: PaymentMethodType;
  paymentReceiptUrl?: string | null;
  receiptFileName?: string;
  bankName?: string;
}

export interface BankAccountInfo {
  id: string;
  bankName: string;
  type: string;
  accountNumber: string;
  accountNumberClean: string;
  badgeColor: { bg: string; text: string };
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
