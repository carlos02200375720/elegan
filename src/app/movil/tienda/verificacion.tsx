import React, { useRef, useState, useEffect } from "react";
import { ArrowRight, ShoppingBag, CreditCard } from "lucide-react";
import { CartItem } from "../../../types";

export interface AndroidCheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  country: string;
  postalCode: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
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
  handleCheckout: () => void;
  isCheckingOut: boolean;
}

export function VerificacionTiendaView({
  onBackToCart,
  checkoutForm,
  setCheckoutForm,
  effectiveCheckoutItems,
  cart,
  cartSubtotal,
  cartShippingTotal,
  cartTotal,
  handleCheckout,
  isCheckingOut,
}: AndroidVerificacionProps) {
  const fixedFooterRef = useRef<HTMLDivElement | null>(null);
  const [footerHeight, setFooterHeight] = useState<number>(76);

  useEffect(() => {
    if (!fixedFooterRef.current) return;
    const updateHeight = () => {
      if (fixedFooterRef.current) {
        setFooterHeight(fixedFooterRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(fixedFooterRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none">
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 pb-3 border-b border-slate-200 flex items-center justify-between"
        style={{ paddingTop: "max(12px, calc(env(safe-area-inset-top, 0px) + 8px))" }}
      >
        <button
          type="button"
          onClick={onBackToCart}
          className="p-2 rounded-full bg-slate-100 text-slate-900 active:scale-95 cursor-pointer hover:bg-slate-200 transition-colors"
          id="android-checkout-back-btn"
          title="Volver al carrito"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-sm font-black text-slate-900">Checkout</h1>
        </div>
        <div className="w-8" />
      </div>

      <div
        className="px-4 py-4 space-y-4"
        style={{
          paddingBottom: `${footerHeight + 3}px`,
        }}
      >
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Información de envío
            </span>
            <ShoppingBag className="w-5 h-5 text-amber-500" />
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-700">Nombre completo</label>
              <input
                value={checkoutForm.fullName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Correo</label>
              <input
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Número de celular</label>
              <input
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="+52 555 000 0000"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Dirección de entrega</label>
              <input
                value={checkoutForm.shippingAddress}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Calle, número, colonia"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700">País de residencia</label>
                <input
                  value={checkoutForm.country}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="País"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700">Código postal</label>
                <input
                  value={checkoutForm.postalCode}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="00000"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Datos de la tarjeta
          </span>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-black text-slate-700">Nombre en la tarjeta</label>
              <input
                value={checkoutForm.cardName}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, cardName: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Nombre en la tarjeta"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-700">Número de tarjeta</label>
              <input
                value={checkoutForm.cardNumber}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, cardNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-slate-700">Expira</label>
                <input
                  value={checkoutForm.expiry}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, expiry: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="MM/AA"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700">CVV</label>
                <input
                  value={checkoutForm.cvv}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, cvv: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-2xl text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="123"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Resumen de compra
            </span>
            <span className="text-[11px] font-bold text-amber-700">
              {effectiveCheckoutItems.length} de {cart.length} {cart.length === 1 ? "producto" : "productos"}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {effectiveCheckoutItems.length === 0 ? (
              <div className="text-center text-[11px] text-slate-500 py-3">
                No hay productos seleccionados para pagar.
              </div>
            ) : (
              effectiveCheckoutItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-900 line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] font-black text-amber-600">
                        ${(item.product.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500">Cantidad: {item.quantity || 1}</span>
                      <span className="text-[10px] text-slate-500">${item.product.price.toFixed(2)} c/u</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 font-semibold">
              <span>Subtotal</span>
              <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-semibold">
              <span>Costo de Envío</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                {cartShippingTotal === 0 ? "GRATIS" : `$${cartShippingTotal.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total</span>
              <span className="text-amber-600 font-mono">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Fixed Checkout Footer */}
        <div
          ref={fixedFooterRef}
          id="android-checkout-footer-action"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))" }}
        >
          <div className="max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || effectiveCheckoutItems.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isCheckingOut
                  ? "Procesando..."
                  : `Completar Compra (${effectiveCheckoutItems.length}) - $${cartTotal.toFixed(2)}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificacionTiendaView;
