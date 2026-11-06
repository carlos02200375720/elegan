import { Order, User } from "../../tipos";

export interface GraciaTiendaViewProps {
  completedOrder: Order | null;
  orderId?: string;
  onLoginSuccess?: (user: User) => void;
  onContinueShopping: () => void;
  onViewOrderHistory: () => void;
}
