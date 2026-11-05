import React from "react";
import {
  ShieldCheck,
  Truck,
  Star,
  X,
  Lock,
  CreditCard,
  CheckCircle2,
  PackageCheck,
  Award,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PolicyType } from "./TiposProducto";

export interface PoliticasProductoProps {
  activePolicySheet: PolicyType;
  setActivePolicySheet: (type: PolicyType) => void;
}

export const PoliticasProducto: React.FC<PoliticasProductoProps> = ({
  activePolicySheet,
  setActivePolicySheet,
}) => {
  return (
    <>
      {/* Security Badges - Al pie de la página con 10px de separación */}
      <div
        id="android-product-security-badges"
        className="bg-slate-50 rounded-xl p-3 mt-4 border border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-semibold mb-[10px]"
        style={{ marginBottom: "10px" }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActivePolicySheet("pago")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActivePolicySheet("pago");
            }
          }}
          className="flex flex-col items-center cursor-pointer p-1 rounded-lg transition-all active:scale-95 hover:bg-slate-200/50 select-none"
          title="Ver política de pago seguro"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1 transition-transform group-active:scale-110" />
          <span>Pago Seguro</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActivePolicySheet("envio")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActivePolicySheet("envio");
            }
          }}
          className="flex flex-col items-center border-x border-slate-200/60 cursor-pointer p-1 rounded-lg transition-all active:scale-95 hover:bg-slate-200/50 select-none"
          title="Ver política de envío rápido"
        >
          <Truck className="w-5 h-5 text-amber-500 mb-1 transition-transform group-active:scale-110" />
          <span>Envío Rápido</span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActivePolicySheet("garantia")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActivePolicySheet("garantia");
            }
          }}
          className="flex flex-col items-center cursor-pointer p-1 rounded-lg transition-all active:scale-95 hover:bg-slate-200/50 select-none"
          title="Ver política de garantía oficial"
        >
          <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 mb-1 transition-transform group-active:scale-110" />
          <span>Garantía Oficial</span>
        </div>
      </div>

      {/* Bottom Sheet de Políticas (Fondo blanco, bordes superiores redondeados) */}
      <AnimatePresence>
        {activePolicySheet && (
          <div
            id="android-policy-sheet-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
            onClick={() => setActivePolicySheet(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden text-slate-800 border-t border-slate-100"
              style={{ paddingBottom: "max(14px, calc(env(safe-area-inset-bottom, 0px) + 8px))" }}
              onClick={(e) => e.stopPropagation()}
              id="android-policy-bottom-sheet"
            >
              {/* Drag Handle Top Bar */}
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      activePolicySheet === "pago"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : activePolicySheet === "envio"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    {activePolicySheet === "pago" && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                    {activePolicySheet === "envio" && <Truck className="w-5 h-5 text-amber-500" />}
                    {activePolicySheet === "garantia" && <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                      {activePolicySheet === "pago" && "Política de Pago Seguro"}
                      {activePolicySheet === "envio" && "Política de Envío Rápido"}
                      {activePolicySheet === "garantia" && "Política de Garantía Oficial"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      {activePolicySheet === "pago" && "Transacciones 100% protegidas y encriptadas"}
                      {activePolicySheet === "envio" && "Despacho ágil y seguimiento en tiempo real"}
                      {activePolicySheet === "garantia" && "Respaldo directo y satisfacción asegurada"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePolicySheet(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  aria-label="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Policy Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs sm:text-sm bg-white">
                {activePolicySheet === "pago" && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Cifrado Bancario SSL 256-bit</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Todas las transacciones se realizan mediante conexiones cifradas con SSL de 256 bits, el más alto estándar de protección de datos financieros.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Métodos de Pago Confiables</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Aceptamos tarjetas de débito y crédito (Visa, Mastercard, American Express), transferencias bancarias y billeteras digitales seguras.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Protección al Comprador</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Tu pago está protegido de principio a fin. En caso de inconvenientes o discrepancias con tu pedido, tienes soporte prioritario y devolución asegurada.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Privacidad y Confidencialidad</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Nunca almacenamos los números completos de tus tarjetas ni los códigos de seguridad (CVV) en nuestros servidores locales.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activePolicySheet === "envio" && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Despacho Express en 24-48h</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Una vez acreditado tu pago, nuestro equipo empaqueta y entrega tu orden a la transportadora en un plazo estimado de 24 a 48 horas hábiles.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Tiempos de Entrega</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Los plazos de entrega habituales son de 1 a 5 días hábiles a nivel nacional, según la transportadora seleccionada y tu localidad.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Rastreo en Tiempo Real</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Te proporcionamos el número de guía para que puedas consultar el recorrido y estado de tu paquete en cualquier momento.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Embalaje Seguro y Protegido</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Todos los productos se empaquetan con materiales amortiguadores de alta resistencia para garantizar que lleguen en perfecto estado.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {activePolicySheet === "garantia" && (
                  <>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Garantía Oficial de Fábrica</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Todos nuestros artículos son 100% originales y cuentan con cobertura oficial ante fallas técnicas o defectos de fabricación.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">30 Días de Cobertura y Satisfacción</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Cuentas con hasta 30 días posteriores a la recepción para reportar cualquier irregularidad o falla de fábrica.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Reemplazo o Reembolso Directo</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Si se valida un desperfecto cubierto por garantía, gestionamos de inmediato el reemplazo por una unidad nueva o la devolución completa.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5">Soporte y Asistencia Continua</h4>
                        <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                          Nuestro equipo de soporte posventa te orienta en todo momento ante cualquier duda sobre el funcionamiento de tu compra.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Button */}
              <div className="px-5 pt-3 pb-2 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setActivePolicySheet(null)}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer text-center"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PoliticasProducto;
