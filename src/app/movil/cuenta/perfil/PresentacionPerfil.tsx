import React from "react";
import { User, Reel } from "../../../../types";
import { BadgeCheck, Mail, MapPin, Phone, Plus, Sparkles, UserPlus } from "lucide-react";
import { isGuestUser } from "../../../../types";
import { isSuperAdmin } from "../../../../superAdmin";
import { navigateTo } from "../../enrutador";

interface PresentacionPerfilProps {
  activeUser: User;
  isMe: boolean;
  isSellerOrAdmin: boolean;
  userReels: Reel[];
  onOpenPublishModal?: () => void;
  onOpenDirectChat?: (user: User) => void;
  onOpenPublishing: () => void;
}

export default function PresentacionPerfil({
  activeUser, isMe, isSellerOrAdmin, userReels,
  onOpenPublishModal, onOpenDirectChat, onOpenPublishing,
}: PresentacionPerfilProps) {
  return (
              <div className="px-4 pt-3 mb-1">
                {/* Resumen privado de los datos de entrega del cliente */}
                {isMe && !isGuestUser(activeUser) && (
                  <section className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-500" />
                      <h2 className="text-xs font-black uppercase tracking-wide text-slate-800">
                        Datos de entrega
                      </h2>
                    </div>
                    <div className="space-y-2 text-xs text-slate-700">
                      {activeUser.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="break-all">{activeUser.email}</span>
                        </div>
                      )}
                      {activeUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{activeUser.phone}</span>
                        </div>
                      )}
                      {(activeUser.shippingAddress || activeUser.address) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{activeUser.shippingAddress || activeUser.address}</span>
                        </div>
                      )}
                      {(activeUser.city || activeUser.country || activeUser.postalCode) && (
                        <p className="pl-5 text-slate-500">
                          {[activeUser.city, activeUser.country, activeUser.postalCode].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Fila de acciones superiores (Publicar / Seguir / Mensaje) */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    {isMe ? (
                      <>
                        {(activeUser.canSell === true || isSuperAdmin(activeUser)) && (
                          <button
                            onClick={() => (onOpenPublishModal ? onOpenPublishModal() : onOpenPublishing())}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Publicar</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {onOpenDirectChat && (
                          <button
                            onClick={() => onOpenDirectChat(activeUser)}
                            className="px-3.5 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 active:scale-95 cursor-pointer"
                          >
                            Mensaje
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
      

      
              {/* Banner para usuarios que navegan como invitado */}
              {isMe && (!activeUser.email || isGuestUser(activeUser)) && (
                <div className="mt-3 p-3.5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border border-amber-200/90 rounded-2xl shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 leading-tight">Estás navegando como Invitado</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        Regístrate para guardar todas tus compras, carrito y videos favoritos, o inicia sesión si ya tienes cuenta.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={() => navigateTo("/perfil/login?mode=register")}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl active:scale-95 transition-transform cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Crear Cuenta y Guardar Mis Datos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/perfil/login?mode=login")}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-amber-200 font-bold text-xs rounded-xl active:scale-95 transition-transform cursor-pointer"
                    >
                      Ya tengo cuenta
                    </button>
                  </div>
                </div>
              )}
      
              {isSellerOrAdmin && (
                <div className="mt-4 py-3 border-y border-slate-100 bg-slate-50/70 rounded-2xl text-center">
                  <span className="block text-sm font-bold text-slate-900">{userReels.length}</span>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Reels</span>
                </div>
              )}
              </div>
  );
}
