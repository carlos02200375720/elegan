import { CartItem } from "../../../../types";

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface AndroidGraciaProps {
  lastOrderItems: CartItem[];
  lastDeliveryAddress: string;
  lastContactInfo: ContactInfo;
  onContinueShopping: () => void;
  onNavigateToHistory?: () => void;
  lastShippingCost?: number;
  lastShippingCarrier?: string;
  orderTotal?: number;
}

export type AndroidGrasiaProps = AndroidGraciaProps;
