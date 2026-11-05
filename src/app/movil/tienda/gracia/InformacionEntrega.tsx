import React from "react";
import { ContactInfo } from "./TiposConfirmacion";

export interface InformacionEntregaProps {
  lastDeliveryAddress: string;
  lastContactInfo: ContactInfo;
}

export const InformacionEntrega: React.FC<InformacionEntregaProps> = ({
  lastDeliveryAddress,
  lastContactInfo,
}) => {
  return (
    <div className="mt-4 border-t border-slate-200 pt-3 space-y-2.5 text-xs" id="android-thank-you-delivery-info">
      <div className="flex items-center justify-between text-slate-600">
        <span>Dirección de entrega</span>
        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
          {lastDeliveryAddress || "Dirección de entrega"}
        </span>
      </div>

      <div className="flex items-center justify-between text-slate-600">
        <span>Contacto</span>
        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
          {lastContactInfo?.fullName || "Cliente"}
        </span>
      </div>

      <div className="flex items-center justify-between text-slate-600">
        <span>Email</span>
        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
          {lastContactInfo?.email || "correo@ejemplo.com"}
        </span>
      </div>

      <div className="flex items-center justify-between text-slate-600">
        <span>Teléfono</span>
        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
          {lastContactInfo?.phone || "Sin teléfono"}
        </span>
      </div>
    </div>
  );
};

export default InformacionEntrega;
