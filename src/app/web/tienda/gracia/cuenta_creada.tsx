import React from "react";
import { User } from "../../tipos";
import { Order } from "../../tipos";
interface Props { activeOrder: Order | null; onLoginSuccess?: (user: User) => void; }
export function CuentaCreada({ activeOrder, onLoginSuccess }: Props) {
  return (
    <>
      {/* Auto-Created User Profile Card for Guest Checkout */}
              {activeOrder?.autoCreatedUser && activeOrder.autoCreatedUser.created && (
                <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-50 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 mt-4 text-left shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-600 font-extrabold text-xs uppercase tracking-wider mb-2">
                    <span className="text-base">🎉</span>
                    <span>¡Cuenta Creada Automáticamente!</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Como eres un comprador nuevo, registramos automáticamente tu perfil con tu correo{" "}
                    <strong className="text-slate-900 font-bold">
                      {activeOrder.autoCreatedUser.email}
                    </strong>
                    .
                  </p>
                  <div className="bg-white rounded-xl p-3 border border-amber-200/60 my-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Usuario asignado:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        @{activeOrder.autoCreatedUser.username}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Contraseña enviada a tu correo:</span>
                      <span className="font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-mono text-sm tracking-wider">
                        {activeOrder.autoCreatedUser.tempPassword}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-slate-600 leading-relaxed mb-3.5">
                    <p className="font-bold text-slate-800 mb-0.5">🔒 Notificación de Seguridad:</p>
                    Te enviamos los datos de acceso a tu correo. Te recomendamos iniciar sesión para
                    hacer el seguimiento de tus pedidos y actualizar tu contraseña por una más segura en
                    tu perfil.
                  </div>
                  {activeOrder.autoCreatedUser.user && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onLoginSuccess && activeOrder.autoCreatedUser?.user) {
                          onLoginSuccess(activeOrder.autoCreatedUser.user);
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
                      id="activate-auto-user-btn"
                    >
                      <span>Iniciar Sesión con esta Cuenta Ahora</span>
                    </button>
                  )}
                </div>
              )}
    </>
  );
}
