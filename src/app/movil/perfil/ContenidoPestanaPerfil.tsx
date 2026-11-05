import React from "react";
import { User, Reel, Product, Order } from "../../../types";
import { X, Truck } from "lucide-react";
import { formatPrice } from "../../../utils/currency";
import AndroidPublicationCover from "../componente/miniaturapublicacion";
import GuardadoPerfilView from "./guardado";
import CompraPerfilView from "./compra";

type TabType = "reels" | "products" | "saved" | "orders";

interface ContenidoPestanaPerfilProps {
  activeTab: TabType;
  isSellerOrAdmin: boolean;
  isMe: boolean;
  canDelete: boolean;
  userReels: Reel[];
  userProducts: Product[];
  savedReels: Reel[];
  savedProducts: Product[];
  orders: Order[];
  activeUser: User;
  currentUser: User;
  socket?: WebSocket | null;
  onSelectReel?: (reel: Reel | string) => void;
  onSelectProduct?: (product: Product) => void;
  onToggleSaveReel?: (reelId: string) => void;
  onOpenFeed: (reelId: string) => void;
  onDeletePublication: (reelId: string) => void;
}

export default function ContenidoPestanaPerfil(props: ContenidoPestanaPerfilProps) {
  const {
    activeTab, isSellerOrAdmin, isMe, canDelete, userReels, userProducts,
    savedReels, savedProducts, orders, activeUser, currentUser, socket,
    onSelectReel, onSelectProduct, onToggleSaveReel, onOpenFeed, onDeletePublication,
  } = props;

  return (
            <div className="p-3">
              {isSellerOrAdmin && activeTab === "reels" && (
                <div className="grid grid-cols-3 gap-2">
                  {userReels.length === 0 ? (
                    <div className="col-span-3 py-16 text-center text-xs text-slate-400">
                      {isMe ? "Aún no tienes publicaciones ni reels." : "Este usuario aún no tiene publicaciones."}
                    </div>
                  ) : (
                    userReels.map((reel, rIdx) => (
                      <div
                        key={`${reel.id}-${rIdx}`}
                        id={`android-profile-pub-${reel.id}`}
                        onClick={() => {
                          if (onSelectReel) onSelectReel(reel);
                          onOpenFeed(reel.id);
                        }}
                        className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 cursor-pointer group active:scale-95 transition-transform shadow-xs"
                      >
                        {canDelete && (
                          <button
                            type="button"
                            id={`btn-delete-publication-${reel.id}`}
                            aria-label="Eliminar publicación"
                            title="Eliminar publicación de MongoDB y GCS"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeletePublication(reel.id);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                            }}
                            className="absolute right-0 top-0 z-30 flex h-10 w-10 items-center justify-center bg-transparent border-0 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] transition-transform hover:scale-110 active:scale-90 focus:outline-none cursor-pointer"
                          >
                            <X className="w-5 h-5 stroke-[2.5]" />
                          </button>
                        )}
                        <AndroidPublicationCover reel={reel} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 pointer-events-none">
                          <span className="text-[10px] font-bold text-white line-clamp-1">{reel.description || reel.title || "Reel"}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
      
              {isSellerOrAdmin && activeTab === "products" && (
                <div className="grid grid-cols-2 gap-3">
                  {userProducts.length === 0 ? (
                    <div className="col-span-2 py-16 text-center text-xs text-slate-400">
                      No hay productos en esta tienda.
                    </div>
                  ) : (
                    userProducts.map((p, pIdx) => (
                      <div
                        key={`${p.id}-${pIdx}`}
                        onClick={() => onSelectProduct?.(p)}
                        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
                      >
                        <img src={p.imageUrl} alt={p.name} className="w-full aspect-square rounded-xl object-cover mb-2" />
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <div className="flex items-center justify-between gap-1 mt-1.5 pt-1.5 border-t border-slate-100 flex-wrap">
                          <p className="text-xs font-black text-amber-600">{formatPrice(p.price)}</p>
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            Number(p.shippingCost || 0) > 0
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            <Truck className="w-2.5 h-2.5" />
                            <span>
                              {Number(p.shippingCost || 0) > 0
                                ? `+${formatPrice(Number(p.shippingCost))}`
                                : "Gratis"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
      
              {/* 3. Guardado (Imported from ./guardado) */}
              {activeTab === "saved" && (
                <GuardadoPerfilView
                  savedProducts={savedProducts}
                  savedReels={savedReels}
                  onSelectProduct={onSelectProduct}
                  onSelectReel={onSelectReel}
                  onToggleSaveReel={onToggleSaveReel}
                  onOpenFeed={(reelId) => onOpenFeed(reelId)}
                />
              )}
      
              {/* 4. Compras / Pedidos (Imported from ./compra) */}
              {activeTab === "orders" && (
                <CompraPerfilView
                  orders={orders}
                  activeUser={activeUser}
                  currentUser={currentUser}
                  socket={socket}
                  onSelectProduct={onSelectProduct}
                />
              )}
            </div>
  );
}
