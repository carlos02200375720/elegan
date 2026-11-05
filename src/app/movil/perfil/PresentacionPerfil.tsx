import React from "react";
import { User, Reel } from "../../../types";
import { BadgeCheck, Mail, Plus, Sparkles, UserPlus } from "lucide-react";
import { isGuestUser } from "../../../types";
import { isSuperAdmin } from "../../../superAdmin";
import { navigateTo } from "../../../router";

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
              <div className="px-4 pt-3">
                {/* Fila de acciones superiores (Publicar / Seguir / Mensaje) */}
                <div className="flex items-center justify-end">
                  <div className="flex items-center space-x-2">
                    {isMe ? (
                      <>
                        {(activeUser.canSell === true || isSuperAdmin(activeUser)) && (
                          <button
                            onClick={() => (onOpenPublishModal ? onOpenPublishModal() : setIsPublishingOpen(true))}
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
      
                <div className="mt-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-lg font-black text-slate-900">{activeUser.name}</h1>
                    {isSuperAdmin(activeUser) && (
                      <span className="inline-flex items-center justify-center shrink-0" title="Verificado">
                        <BadgeCheck className="w-4 h-4 text-white fill-blue-500 shrink-0 drop-shadow-2xs" />
                      </span>
                    )}
                  </div>
                  {activeUser.email && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 font-medium">
                      <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{activeUser.email}</span>
                      {activeUser.city && <span className="text-slate-400">• {activeUser.city}</span>}
                      {activeUser.country && <span className="text-slate-400">, {activeUser.country}</span>}
                    </div>
                  )}
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
  );
}
