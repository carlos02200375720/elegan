import React from "react";
import { Order } from "../../../types";

export interface PedidosAdminProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
  onRequestEditOrder?: (order: Order) => void;
}

export interface MensajePedidos {
  type: "success" | "error" | "info";
  text: string;
}
