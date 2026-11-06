import { Order, User } from "../../../../types";

export interface GraciaTiendaViewProps {
  completedOrder: Order | null;
  orderId?: string;
  onLoginSuccess?: (user: User) => void;
  onContinueShopping: () => void;
  onViewOrderHistory: () => void;
}
