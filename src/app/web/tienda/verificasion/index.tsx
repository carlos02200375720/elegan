import React from "react";
import { Truck, CreditCard, ShoppingBag, ShieldCheck, Building2, Check, Upload, X, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DEST_COUNTRIES, VerificasionTiendaViewProps } from "./tipos";
import { useEstadoPago } from "./estado_pago";

export function VerificasionTiendaView(props: VerificasionTiendaViewProps) {
  const { activeStep, name, setName, email, setEmail, phone, setPhone, address, setAddress, country, setCountry, city, setCity, postalCode, setPostalCode, effectiveCheckoutItems, cartSubtotal, cartShippingTotal, cartTotal } = props;
  const { selectedPaymentMethod, setSelectedPaymentMethod, activeModal, setActiveModal, receiptImage, receiptFileName, copiedBank, paymentError, setPaymentError, isProcessingPayment, isPaypalLoading, paypalCurrency, paypalButtonsRef, receiptInputRef, validateCheckout, copyPaymentText, handleReceiptChange, removeReceipt, submitNonCardPayment } = useEstadoPago(props);
  if (activeStep === "payment") {
    return (
      <motion.div
        key="payment"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-[380px] flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <h3 className="font-display font-extrabold text-lg text-slate-900 mt-6 animate-pulse">
          Procesando Pago Seguro...
        </h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          Conectando con la pasarela bancaria WebRTC. Por favor, no recargue ni cierre la pestaña.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="checkout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-5xl mx-auto px-2 sm:px-4 py-2 pb-24 md:pb-8"
    >
      {/* Left Column: Checkout Inputs (3 cols) */}
      <div className="md:col-span-3 space-y-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <h3 className="font-display font-extrabold text-sm text-slate-900 mb-4 flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Truck className="w-4 h-4 text-amber-500" />
            <span>Información de Envío</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Gómez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Número de Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Dirección de Entrega
              </label>
              <input
                type="text"
                placeholder="Calle, Número, Piso/Puerta"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  placeholder="Código postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  País
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer pr-8 transition-all"
                  >
                    {DEST_COUNTRIES.map((c, cIdx) => (
                      <option key={`${c.code}-${cIdx}`} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Santo Domingo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 text-xs rounded-xl p-3 font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-display font-extrabold text-sm text-slate-900">Método de pago</h3>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {([
              { id: "transferencia", title: "Transferencia bancaria", tag: "Popular / Banreservas / BHD", description: "Transfiere a nuestras cuentas y sube tu comprobante", Icon: Building2 },
              { id: "tarjeta", title: "Tarjeta de débito o crédito", tag: "PayPal / Tarjeta", description: "Pago inmediato y protegido con Visa, Mastercard o PayPal", Icon: CreditCard },
              { id: "contra_entrega", title: "Pago contra entrega", tag: "Santo Domingo", description: "Paga en efectivo al recibir tu pedido en la puerta", Icon: Truck },
            ] as const).map((method) => (
              <button key={method.id} type="button" onClick={() => setSelectedPaymentMethod(method.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${selectedPaymentMethod === method.id ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <span className="flex items-center gap-3 min-w-0">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selectedPaymentMethod === method.id ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-700"}`}><method.Icon className="w-4 h-4" /></span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5"><span className="text-xs font-black text-slate-900">{method.title}</span><span className="text-[9px] font-bold px-1 py-0.5 rounded-md bg-slate-100 text-slate-700">{method.tag}</span></span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{method.description}</span>
                  </span>
                </span>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPaymentMethod === method.id ? "border-amber-500 bg-amber-500 text-slate-950" : "border-slate-300"}`}>{selectedPaymentMethod === method.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}</span>
              </button>
            ))}
          </div>
          {paymentError && <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{paymentError}</p>}
          <button type="button" disabled={effectiveCheckoutItems.length === 0 || isProcessingPayment}
            onClick={() => { if (validateCheckout()) { setPaymentError(""); setActiveModal(selectedPaymentMethod); } }}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Confirmar método de pago
          </button>
        </section>
      </div>

      {/* Right Column: Order Summary (2 cols) */}
      <div
        className="md:col-span-2 bg-white text-slate-900 p-6 rounded-2xl flex flex-col justify-between border border-slate-200/90 shadow-xl shadow-slate-100/80 space-y-5 h-fit sticky top-20"
        id="checkout-order-summary"
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <h3 className="font-display font-extrabold text-sm text-slate-900">
                Resumen del Pedido
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {effectiveCheckoutItems.reduce((acc, i) => acc + i.quantity, 0)}{" "}
              {effectiveCheckoutItems.reduce((acc, i) => acc + i.quantity, 0) === 1
                ? "producto"
                : "productos"}
            </span>
          </div>

          <div
            className="space-y-3 max-h-[220px] overflow-y-auto pr-1 divide-y divide-slate-100 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {effectiveCheckoutItems.map((item, idx) => (
              <div
                key={`${item.product.id}-${idx}`}
                className="flex items-center justify-between text-xs pt-2.5 first:pt-0"
              >
                <div className="flex items-center space-x-3 truncate flex-1 pr-2">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0 bg-slate-50"
                  />
                  <div className="truncate">
                    <span className="font-bold text-slate-800 text-xs block truncate">
                      {item.product.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Cant: {item.quantity} × ${item.product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 mt-5 pt-4 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal Productos</span>
              <span className="font-mono font-semibold">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 items-center">
              <span>Costo de Envío</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px]">
                {cartShippingTotal === 0 ? "GRATIS" : `$${cartShippingTotal.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200/80 pt-3 mt-2">
              <span>Total a Pagar</span>
              <span className="text-amber-600 font-mono text-lg">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center">
            <motion.button type="button" aria-label="Cerrar métodos de pago" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setActiveModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.section initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative z-10 w-full max-w-lg max-h-[88vh] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />
              {activeModal === "transferencia" && <>
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-600" /><div><h2 className="text-sm font-black">Transferencia bancaria</h2><p className="text-[10px] text-slate-500">Cuentas oficiales de Elegán</p></div></div>
                  <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-full bg-slate-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between"><div><span className="block text-[10px] uppercase font-bold text-slate-600">Monto exacto a transferir</span><strong className="text-base text-amber-700 font-mono">${cartTotal.toFixed(2)}</strong></div><button type="button" onClick={() => void copyPaymentText(cartTotal.toFixed(2), "total")} className="px-3 py-2 bg-white border border-amber-300 rounded-lg font-bold">{copiedBank === "total" ? "Copiado" : "Copiar monto"}</button></div>
                  <div className="space-y-2"><p className="text-[11px] font-black uppercase text-slate-500">Cuentas disponibles (DOP)</p>
                    {[
                      { id: "popular", bank: "Banco Popular", number: "824-102948-2", copy: "8241029482" },
                      { id: "banreservas", bank: "Banreservas", number: "960-239104-5", copy: "9602391045" },
                      { id: "bhd", bank: "Banco BHD", number: "045-819203-1", copy: "0458192031" },
                    ].map((account) => <div key={account.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                      <div><strong className="block text-slate-900">{account.bank}</strong><span className="block font-mono font-bold text-slate-800">{account.number}</span></div>
                      <button type="button" onClick={() => void copyPaymentText(account.copy, account.id)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold">{copiedBank === account.id ? "Copiado" : "Copiar"}</button>
                    </div>)}
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl"><span className="block text-[10px] uppercase font-bold text-slate-500">Titular de la cuenta</span><div className="flex items-center justify-between gap-2"><strong>Carlos David Garcia Batista</strong><button type="button" onClick={() => void copyPaymentText("Carlos David Garcia Batista", "titular")} className="text-amber-700 font-bold">{copiedBank === "titular" ? "Copiado" : "Copiar"}</button></div></div>
                  <div className="space-y-2"><label className="block text-[11px] font-black uppercase text-slate-700">Foto del comprobante de pago *</label><input ref={receiptInputRef} type="file" accept="image/*" onChange={handleReceiptChange} className="hidden" />
                    {!receiptImage ? <button type="button" onClick={() => receiptInputRef.current?.click()} className="w-full border-2 border-dashed border-amber-300 bg-amber-50 rounded-2xl p-5 text-center"><Upload className="w-6 h-6 mx-auto text-amber-600 mb-2" /><strong className="block">Subir comprobante</strong><span className="text-[10px] text-slate-500">Captura o foto del voucher</span></button> :
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"><img src={receiptImage} alt="Comprobante" className="w-12 h-12 rounded-lg object-cover" /><span className="flex-1 min-w-0 text-xs font-bold truncate">{receiptFileName || "comprobante.jpg"}</span><button type="button" onClick={removeReceipt} className="p-2 text-rose-600"><X className="w-4 h-4" /></button></div>}
                  </div>
                  {paymentError && <p role="alert" className="text-xs text-rose-700 font-semibold">{paymentError}</p>}
                </div>
                <div className="p-4 border-t border-slate-100"><button type="button" disabled={!receiptImage || isProcessingPayment} onClick={() => void submitNonCardPayment("transferencia")} className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs disabled:opacity-40">{isProcessingPayment ? "Registrando transferencia..." : "Confirmar el pago"}</button></div>
              </>}
              {activeModal === "tarjeta" && <>
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /><div><h2 className="text-sm font-black">Tarjeta o PayPal</h2><p className="text-[10px] text-slate-500">Pasarela oficial cifrada</p></div></div><button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-full bg-slate-100"><X className="w-4 h-4" /></button></div>
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between"><div><span className="block text-[10px] uppercase font-bold">Total a pagar con tarjeta</span><strong className="text-base text-blue-900 font-mono">${cartTotal.toFixed(2)} {paypalCurrency}</strong></div><ShieldCheck className="w-6 h-6 text-blue-600" /></div>
                  <p className="text-xs text-slate-600">Paga de forma segura con tarjeta de débito o crédito (Visa, Mastercard, American Express) o con tu cuenta PayPal.</p>
                  <div ref={paypalButtonsRef} id="web-paypal-buttons-container" className="w-full min-h-[90px]" />
                  {isPaypalLoading && <p className="text-center text-xs text-slate-500">Conectando con PayPal...</p>}
                  {isProcessingPayment && <p className="text-center text-xs font-semibold text-slate-500">Procesando pago...</p>}
                  {paymentError && <p role="alert" className="text-xs text-rose-700 font-semibold">{paymentError}</p>}
                </div>
              </>}
              {activeModal === "contra_entrega" && <>
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><Truck className="w-5 h-5 text-amber-600" /><div><h2 className="text-sm font-black">Pago contra entrega</h2><p className="text-[10px] text-slate-500">Paga en efectivo al recibir</p></div></div><button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-full bg-slate-100"><X className="w-4 h-4" /></button></div>
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3"><MapPin className="w-5 h-5 text-amber-600 shrink-0" /><div><h3 className="font-black uppercase text-amber-950">Zona de cobertura exclusiva</h3><p className="font-bold text-amber-900 mt-1">El servicio de pago contra entrega está disponible en la ciudad de Santo Domingo.</p></div></div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2"><span className="block text-[10px] uppercase font-bold text-slate-500">Detalles de envío</span><div className="flex justify-between gap-3"><span>Destinatario:</span><strong>{name}</strong></div><div className="flex justify-between gap-3"><span>Teléfono:</span><strong>{phone}</strong></div><div className="flex justify-between items-start gap-3"><span>Dirección:</span><strong className="text-right">{address}, {city}</strong></div><div className="flex justify-between border-t border-slate-200 pt-2 font-black"><span>Total en efectivo:</span><strong className="text-amber-600 font-mono">${cartTotal.toFixed(2)}</strong></div></div>
                  <p className="text-[11px] text-slate-500">Al confirmar, despacharemos tu pedido a la dirección indicada. Ten preparado el importe exacto en efectivo.</p>
                  {paymentError && <p role="alert" className="text-xs text-rose-700 font-semibold">{paymentError}</p>}
                </div>
                <div className="p-4 border-t border-slate-100"><button type="button" disabled={isProcessingPayment} onClick={() => void submitNonCardPayment("contra_entrega")} className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs disabled:opacity-50">{isProcessingPayment ? "Confirmando pedido..." : "Confirmar pedido contra entrega"}</button></div>
              </>}
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const Verificasion = VerificasionTiendaView;
export const Verificacion = VerificasionTiendaView;
export const VerificacionTiendaView = VerificasionTiendaView;
export default VerificasionTiendaView;
