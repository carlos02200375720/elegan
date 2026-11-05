import React from "react";
import { Building2, CreditCard, Truck, Check, ShieldCheck } from "lucide-react";
import { PaymentMethodType } from "./TiposVerificacion";

export interface MetodosPagoProps {
  selectedPaymentMethod: PaymentMethodType;
  onSelectPaymentMethod: (method: PaymentMethodType) => void;
}

export const MetodosPago: React.FC<MetodosPagoProps> = ({
  selectedPaymentMethod,
  onSelectPaymentMethod,
}) => {
  return (
    <div className="w-full bg-white rounded-none shadow-none p-3 space-y-2" id="android-checkout-payment-methods">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Método de pago
        </span>
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
      </div>

      <div className="space-y-2 pt-0.5">
        {/* Metodo 1: Transferencia bancaria */}
        <button
          type="button"
          onClick={() => onSelectPaymentMethod("transferencia")}
          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedPaymentMethod === "transferencia"
              ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                selectedPaymentMethod === "transferencia"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900">
                  Transferencia bancaria
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Popular / Banreservas / BHD
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Transfiere a nuestras cuentas y sube tu comprobante
              </p>
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedPaymentMethod === "transferencia"
                ? "border-amber-500 bg-amber-500 text-slate-950"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedPaymentMethod === "transferencia" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
        </button>

        {/* Metodo 2: Tarjeta de debito o credito */}
        <button
          type="button"
          onClick={() => onSelectPaymentMethod("tarjeta")}
          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedPaymentMethod === "tarjeta"
              ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                selectedPaymentMethod === "tarjeta"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900">
                  Tarjeta de débito o crédito
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  PayPal / Tarjeta
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Pago inmediato y protegido con Visa, Mastercard o PayPal
              </p>
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedPaymentMethod === "tarjeta"
                ? "border-amber-500 bg-amber-500 text-slate-950"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedPaymentMethod === "tarjeta" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
        </button>

        {/* Metodo 3: Pago contra entrega */}
        <button
          type="button"
          onClick={() => onSelectPaymentMethod("contra_entrega")}
          className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
            selectedPaymentMethod === "contra_entrega"
              ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                selectedPaymentMethod === "contra_entrega"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900">
                  Pago contra entrega
                </span>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  Santo Domingo
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Paga en efectivo al recibir tu pedido en la puerta
              </p>
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
              selectedPaymentMethod === "contra_entrega"
                ? "border-amber-500 bg-amber-500 text-slate-950"
                : "border-slate-300 bg-white"
            }`}
          >
            {selectedPaymentMethod === "contra_entrega" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
        </button>
      </div>
    </div>
  );
};

export default MetodosPago;
