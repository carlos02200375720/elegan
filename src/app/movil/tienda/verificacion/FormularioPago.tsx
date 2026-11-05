import React from "react";
import {
  Building2,
  CreditCard,
  Truck,
  Check,
  Copy,
  X,
  Upload,
  FileCheck,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatPrice } from "../../../../utils/currency";
import { PaymentMethodType, AndroidCheckoutForm } from "./TiposVerificacion";
import { OFFICIAL_BANK_ACCOUNTS, ACCOUNT_HOLDER } from "./FuncionesVerificacion";

export interface FormularioPagoProps {
  activeModal: PaymentMethodType | null;
  onCloseModal: () => void;
  cartTotal: number;
  checkoutForm: AndroidCheckoutForm;
  receiptImage: string | null;
  receiptFileName: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveReceipt: () => void;
  copiedBank: string | null;
  handleCopyText: (text: string, id: string) => void;
  handleConfirmBankTransfer: () => Promise<void>;
  handleConfirmCashOnDelivery: () => Promise<void>;
  paypalButtonsRef: React.RefObject<HTMLDivElement | null>;
  isCheckingOut: boolean;
}

export const FormularioPago: React.FC<FormularioPagoProps> = ({
  activeModal,
  onCloseModal,
  cartTotal,
  checkoutForm,
  receiptImage,
  receiptFileName,
  fileInputRef,
  handleFileChange,
  handleRemoveReceipt,
  copiedBank,
  handleCopyText,
  handleConfirmBankTransfer,
  handleConfirmCashOnDelivery,
  paypalButtonsRef,
  isCheckingOut,
}) => {
  return (
    <AnimatePresence>
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isCheckingOut) onCloseModal();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Bottom Sheet Panel Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl z-10"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
          >
            {/* Handle indicator */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* MODAL 1: TRANSFERENCIA BANCARIA */}
            {activeModal === "transferencia" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">Transferencia Bancaria</h2>
                      <p className="text-[10px] text-slate-500">Cuentas oficiales de Elegán</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  {/* Monto total destacado */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        Monto exacto a transferir
                      </span>
                      <span className="text-base font-black text-amber-700 font-mono">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(cartTotal.toFixed(2), "total")}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-800 font-bold text-[10px] flex items-center gap-1 active:scale-95"
                    >
                      {copiedBank === "total" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedBank === "total" ? "Copiado" : "Copiar monto"}</span>
                    </button>
                  </div>

                  {/* Cuentas Bancarias Oficiales */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500 block">
                      Cuentas disponibles (DOP):
                    </span>

                    {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                      <div
                        key={bank.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-xs">{bank.bankName}</span>
                            <span className={`text-[9px] font-bold px-1 rounded ${bank.badgeColor.bg} ${bank.badgeColor.text}`}>
                              {bank.type}
                            </span>
                          </div>
                          <span className="font-mono font-black text-slate-800 text-xs mt-0.5 block">
                            {bank.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bank.accountNumberClean, bank.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 active:scale-95 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedBank === bank.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedBank === bank.id ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Titular de la cuenta */}
                  <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Titular de la cuenta:
                    </span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-black text-slate-900">
                        {ACCOUNT_HOLDER}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(ACCOUNT_HOLDER, "titular")}
                        className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                      >
                        {copiedBank === "titular" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBank === "titular" ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Campo para subir la foto del comprobante de pago */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-black uppercase tracking-wide text-slate-700 block">
                      Foto del comprobante de pago *
                    </label>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="receipt-file-input"
                    />

                    {!receiptImage ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-500/5 rounded-2xl p-4 text-center cursor-pointer transition-colors active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 mx-auto flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-black text-slate-900">
                          Toca aquí para subir la foto del comprobante
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Captura de pantalla o foto de tu voucher de transferencia
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={receiptImage}
                            alt="Comprobante"
                            className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-emerald-700 font-black text-xs">
                              <FileCheck className="w-4 h-4" />
                              <span className="truncate">Comprobante cargado</span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {receiptFileName || "foto_comprobante.jpg"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="p-1.5 rounded-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                          title="Eliminar comprobante"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!receiptImage && (
                      <p className="text-[10px] text-slate-500 italic">
                        Nota: El botón de confirmar pago se habilitará automáticamente al subir la foto de tu comprobante.
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón fijo en el pie del panel */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                  <button
                    type="button"
                    disabled={!receiptImage || isCheckingOut}
                    onClick={handleConfirmBankTransfer}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isCheckingOut
                        ? "Confirmando pago..."
                        : !receiptImage
                        ? "Sube el comprobante para confirmar"
                        : "Confirmar el pago"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* MODAL 2: TARJETA DE DEBITO O CREDITO (PAYPAL OFICIAL DENTRO DE LA APP) */}
            {activeModal === "tarjeta" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">Tarjeta o PayPal</h2>
                      <p className="text-[10px] text-slate-500">Pasarela oficial cifrada</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        Total a pagar con tarjeta
                      </span>
                      <span className="text-base font-black text-blue-900 font-mono">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paga de forma 100% segura dentro de la app con tu tarjeta de débito o crédito (Visa, Mastercard, American Express) o con tu cuenta de PayPal.
                  </p>

                  {/* Contenedor oficial de botones PayPal/Tarjeta */}
                  <div className="pt-2">
                    <div
                      ref={paypalButtonsRef}
                      id="android-paypal-buttons-container-modal"
                      className="w-full min-h-[90px] relative z-10"
                    />
                  </div>

                  {isCheckingOut && (
                    <p className="text-center text-xs font-semibold text-slate-500">
                      Procesando pago con tarjeta...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* MODAL 3: PAGO CONTRA ENTREGA (DISPONIBLE EN SANTO DOMINGO) */}
            {activeModal === "contra_entrega" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">Pago Contra Entrega</h2>
                      <p className="text-[10px] text-slate-500">Paga en efectivo al recibir</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  {/* Mensaje obligatorio de cobertura */}
                  <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-black text-amber-950 text-xs uppercase tracking-wide">
                        Zona de cobertura exclusiva
                      </h3>
                      <p className="text-xs font-bold text-amber-900 mt-1 leading-snug">
                        El servicio de pago contra entrega está disponible en la ciudad de Santo Domingo.
                      </p>
                    </div>
                  </div>

                  {/* Resumen de entrega */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Detalles de envío:
                    </span>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Destinatario:</span>
                      <span className="font-bold text-slate-900">{checkoutForm.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium">Teléfono:</span>
                      <span className="font-bold text-slate-900">{checkoutForm.phone}</span>
                    </div>
                    <div className="flex justify-between items-start text-slate-700 gap-2">
                      <span className="font-medium shrink-0">Dirección:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {checkoutForm.shippingAddress}, {checkoutForm.city || "Santo Domingo"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-black">
                      <span>Total a pagar en efectivo:</span>
                      <span className="text-amber-600 font-mono text-sm">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Al confirmar, despacharemos tu pedido a tu dirección. Por favor mantén el importe exacto listo en efectivo para la entrega.
                  </p>
                </div>

                {/* Botón fijo en el pie del panel */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                  <button
                    type="button"
                    disabled={isCheckingOut}
                    onClick={handleConfirmCashOnDelivery}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isCheckingOut ? "Confirmando pedido..." : "Confirmar pedido contra entrega"}</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FormularioPago;
