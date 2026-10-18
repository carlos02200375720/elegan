import React, { useState, useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { User, Reel, Product, Order, isGuestUser } from "../../../types";
import { Play, ShoppingBag, Bookmark, Settings, LogOut, Edit3, Grid, Camera, Check, Sparkles, UserPlus, UserCheck, X, ExternalLink, Package, Plus, Trash2, ShieldCheck, Truck, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { androidApiFetch } from "../api";
import AndroidUserPublicationsFeed from "../components/Feedperfil";
import AndroidPublicationCover from "../components/miniaturapublicacion";
import AndroidPublishView from "../publicasion";
import { isSuperAdmin } from "../../../superAdmin";
import { navigateTo, parseRoute, getProfilePath, getProfileSavedPath, getProfileCompraPath, getProfileConfigPath, getProfileProductoPath, getProfilePublicacionesPath, getProfilePublicarPath } from "../../../router";
import { formatPrice } from "../../../utils/currency";

// Sub-components inside src/app/movil/perfil/
import GuardadoPerfilView from "./guardado";
import CompraPerfilView from "./compra";
import ConfigPerfilView from "./config";

export interface AndroidPerfilProps {
  user?: User;
  currentUser: User;
  selectedCreatorId?: string | null;
  users?: User[];
  reels?: Reel[];
  products?: Product[];
  onLogout: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectReel?: (reel: Reel | string) => void;
  onUpdateUser?: (updatedUser: User) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onToggleFollowUser?: (creatorId: string) => void;
  onOpenSocial?: () => void;
  unreadCount?: number;
  onOpenPublishModal?: () => void;
  isCurrentUserProfile?: boolean;
  onDeleteReel?: (reelId: string) => void;
  onUpdateReels?: (reels: Reel[]) => void;
  onUpdateProducts?: (products: Product[]) => void;
  savedReelIds?: string[];
  onToggleSaveReel?: (reelId: string) => void;
  orders?: Order[];
  onUpdateOrders?: (orders: Order[]) => void;
  onBackToSelf?: () => void;
  onOpenDirectChat?: (targetUser: User) => void;
  onRefreshUsers?: () => void;
  onPublishSuccess?: () => void;
  socket?: WebSocket | null;
  initialTab?: TabType;
  onClearInitialTab?: () => void;
}

export type AndroidProfileViewProps = AndroidPerfilProps;

type TabType = "reels" | "products" | "saved" | "orders";

export default function Perfil({
  user: directUser,
  currentUser,
  selectedCreatorId,
  users = [],
  reels = [],
  products = [],
  onLogout,
  onSelectProduct,
  onSelectReel,
  onUpdateUser,
  onProfileUpdate,
  onToggleFollowUser,
  onOpenPublishModal,
  onDeleteReel,
  savedReelIds = [],
  onToggleSaveReel,
  orders = [],
  onBackToSelf,
  onOpenDirectChat,
  onRefreshUsers,
  onPublishSuccess,
  initialTab,
  onClearInitialTab,
  socket,
}: AndroidPerfilProps) {
  // Determine who we are viewing
  const activeUser =
    directUser ||
    (selectedCreatorId
      ? users.find(
          (u) =>
            u.id === selectedCreatorId ||
            (u.originalId && u.originalId === selectedCreatorId) ||
            (u.username && u.username.toLowerCase() === selectedCreatorId.toLowerCase())
        )
      : null) ||
    currentUser;

  const isMe = activeUser.id === currentUser.id || activeUser.username === currentUser.username;
  const isAdmin = (currentUser as any)?.role === "admin" || (currentUser as any)?.isAdmin === true;
  const isSellerOrAdmin = Boolean(activeUser.canSell === true || isSuperAdmin(activeUser));
  const canDelete = isMe || isAdmin || !selectedCreatorId;

  // Configuración de la barra de estado nativa en celulares para la página de perfil:
  // Fondo blanco sólido (#ffffff, sin transparencia) y texto/iconos oscuros legibles
  useEffect(() => {
    const applyProfileStatusBar = async () => {
      try {
        if (typeof window !== "undefined" && Capacitor.isPluginAvailable("StatusBar")) {
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setStyle({ style: Style.Light });
        }
      } catch (e) {
        console.warn("StatusBar setup in Perfil:", e);
      }

      // Sincronizar theme-color en el DOM para la barra de estado nativa
      const themeMeta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute("content", "#ffffff");
      }
      document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
        tag.setAttribute("content", "#ffffff");
      });

      // Configurar apple-mobile-web-app-status-bar-style a default para eliminar translucidez
      const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusMeta) {
        appleStatusMeta.setAttribute("content", "default");
      }

      document.documentElement.style.backgroundColor = "#ffffff";
      document.body.style.backgroundColor = "#ffffff";
    };

    applyProfileStatusBar();
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "profile" && parsed.profileTab === "guardado") {
        return "saved";
      }
      if (parsed.type === "profile" && parsed.profileTab === "compra") {
        return "orders";
      }
      if (parsed.type === "profile" && parsed.profileTab === "producto") {
        return "products";
      }
      if (parsed.type === "profile" && parsed.profileTab === "publicaciones") {
        return "reels";
      }
    }
    return initialTab || (isSellerOrAdmin ? "reels" : "saved");
  });

  const [selectedFeedReelId, setSelectedFeedReelId] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "profile" && parsed.profileTab === "config") {
        return true;
      }
    }
    return false;
  });
  const [isPublishingOpen, setIsPublishingOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "profile" && parsed.profileTab === "publicar") {
        return true;
      }
    }
    return false;
  });

  const handleSelectMobileTab = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      if (tab === "saved" && isMe) {
        navigateTo(getProfileSavedPath(activeUser));
      } else if (tab === "orders") {
        navigateTo(getProfileCompraPath(activeUser));
      } else if (tab === "products") {
        navigateTo(getProfileProductoPath(activeUser));
      } else if (tab === "reels") {
        navigateTo(getProfilePublicacionesPath(activeUser));
      } else {
        navigateTo(getProfilePath(activeUser));
      }
    }
  };

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      onClearInitialTab?.();
    }
  }, [initialTab, onClearInitialTab]);

  React.useEffect(() => {
    if (!isSellerOrAdmin && (activeTab === "reels" || activeTab === "products")) {
      setActiveTab("saved");
    }
  }, [isSellerOrAdmin, activeTab]);

  const [publicationToDelete, setPublicationToDelete] = useState<Reel | null>(null);
  const [isDeletingPublication, setIsDeletingPublication] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const executeDeletePublication = async (target: Reel | string) => {
    const reelId = typeof target === "string" ? target : target.id;
    setIsDeletingPublication(true);
    setDeleteErrorMessage(null);
    try {
      console.log("🗑️ Solicitando eliminación de:", reelId);
      let res = await androidApiFetch(`/reels/${reelId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        res = await fetch(`/api/android/reels/${reelId}`, { method: "DELETE" });
      }
      if (!res.ok) {
        res = await fetch(`/api/reels/${reelId}`, { method: "DELETE" });
      }

      // Inmediatamente remover del estado local
      setExtraPublications((prev) => prev.filter((r) => r.id !== reelId));
      if (onDeleteReel) onDeleteReel(reelId);
      if (onPublishSuccess) onPublishSuccess();
      if (onRefreshUsers) onRefreshUsers();

      setPublicationToDelete(null);
      if (selectedFeedReelId === reelId) {
        setSelectedFeedReelId(null);
      }
    } catch (err: any) {
      console.error("Error al eliminar publicación:", err);
      setDeleteErrorMessage(err.message || "Error al eliminar");
    } finally {
      setIsDeletingPublication(false);
    }
  };

  const handleDeletePublication = (reelId: string) => {
    const target = userReels.find((r) => r.id === reelId) || { id: reelId, description: "Publicación" } as Reel;
    setPublicationToDelete(target);
  };

  const isFollowing = currentUser?.followingUserIds?.includes(activeUser.id) || false;

  const [extraPublications, setExtraPublications] = useState<Reel[]>([]);

  // Fetch real publications and reels from MongoDB Atlas for this user
  React.useEffect(() => {
    const targetId = activeUser.originalId || activeUser.id || activeUser.username;
    if (!targetId || targetId === "invitado") return;

    androidApiFetch(`/users/${targetId}/publications`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const apiReels: Reel[] = [];
          const seenIds = new Set<string>();
          const seenUrls = new Set<string>();

          const addEntry = (r: Reel) => {
            if (!r || !r.id || seenIds.has(r.id)) return;
            const norm = (r.videoUrl || r.hlsUrl || "").split("?")[0].trim().toLowerCase();
            if (norm && seenUrls.has(norm)) return;

            seenIds.add(r.id);
            if (norm) seenUrls.add(norm);
            apiReels.push(r);
          };

          if (Array.isArray(data.reels)) {
            data.reels.forEach((r: any) => addEntry(r));
          }
          if (Array.isArray(data.publicaciones)) {
            data.publicaciones.forEach((pub: any) => {
              if (pub.url) {
                const rawUrl = pub.url || "";
                const isVideo = rawUrl.includes(".m3u8") || /\.(mp4|mov|webm|m4v)/i.test(rawUrl);
                const hlsFolder = (rawUrl || pub.hlsUrl || "").match(/\/uploads\/hls\/([a-zA-Z0-9_-]+)\//);
                const resolvedThumb =
                  pub.thumbnailUrl &&
                  typeof pub.thumbnailUrl === "string" &&
                  !pub.thumbnailUrl.toLowerCase().endsWith(".m3u8") &&
                  !pub.thumbnailUrl.includes("1618005182384")
                    ? pub.thumbnailUrl
                    : hlsFolder
                    ? `/uploads/hls/${hlsFolder[1]}/poster.jpg`
                    : !isVideo
                    ? rawUrl
                    : "";

                addEntry({
                  id: pub.id,
                  videoUrl: pub.url,
                  hlsUrl: pub.hlsUrl || pub.url,
                  thumbnailUrl: resolvedThumb,
                  description: pub.title || pub.description || "Publicación",
                  creatorId: pub.creatorId || activeUser.id,
                  creatorName: activeUser.name,
                  creatorUsername: activeUser.username,
                  creatorAvatar: activeUser.avatar,
                  likes: pub.likes || 0,
                  likedBy: [],
                  comments: [],
                  shares: 0,
                  saves: 0,
                  views: 0,
                  type: isVideo ? "video" : "image",
                });
              }
            });
          }
          setExtraPublications(apiReels);
        }
      })
      .catch(() => {});
  }, [activeUser.id, activeUser.originalId, activeUser.username, activeUser.name, activeUser.avatar]);

  const userReels = React.useMemo(() => {
    const activeIds = [activeUser.id, activeUser.originalId].filter(Boolean);
    const primary = reels.filter((r) => {
      if (r.creatorId && activeIds.includes(r.creatorId)) return true;
      if (r.creatorUsername && activeUser.username && r.creatorUsername.toLowerCase() === activeUser.username.toLowerCase()) return true;
      if (isMe && (r.creatorId === "current_user" || (currentUser.username && r.creatorUsername?.toLowerCase() === currentUser.username.toLowerCase()))) return true;
      return false;
    });

    const result: Reel[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    const addUnique = (r: Reel) => {
      if (!r || !r.id || seenIds.has(r.id)) return;
      const url = (r.videoUrl || r.hlsUrl || "").split("?")[0].trim().toLowerCase();
      if (url && seenUrls.has(url)) return;

      seenIds.add(r.id);
      if (url) seenUrls.add(url);
      result.push(r);
    };

    primary.forEach(addUnique);
    extraPublications.forEach(addUnique);
    return result;
  }, [reels, extraPublications, activeUser.id, activeUser.originalId, activeUser.username, isMe, currentUser.username]);

  const userProducts = React.useMemo(() => {
    const activeIds = [activeUser.id, activeUser.originalId].filter(Boolean);
    return products.filter((p) => {
      if (p.sellerId && activeIds.includes(p.sellerId)) return true;
      if (p.sellerUsername && activeUser.username && p.sellerUsername.toLowerCase() === activeUser.username.toLowerCase()) return true;
      if (isMe && (p.sellerId === "current_user" || (currentUser.username && p.sellerUsername?.toLowerCase() === currentUser.username.toLowerCase()))) return true;
      return false;
    });
  }, [products, activeUser.id, activeUser.originalId, activeUser.username, isMe, currentUser.username]);

  const savedReels = React.useMemo(() => {
    const allCandidates = [...reels, ...extraPublications];
    const result: Reel[] = [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    allCandidates.forEach((r) => {
      if (!r || !r.id || !savedReelIds.includes(r.id) || seenIds.has(r.id)) return;
      const url = (r.videoUrl || r.hlsUrl || "").split("?")[0].trim().toLowerCase();
      if (url && seenUrls.has(url)) return;

      seenIds.add(r.id);
      if (url) seenUrls.add(url);
      result.push(r);
    });
    return result;
  }, [reels, extraPublications, savedReelIds]);

  const savedProducts = React.useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      if (savedReelIds.includes(p.id) && !seen.has(p.id)) {
        seen.add(p.id);
        return true;
      }
      return false;
    });
  }, [products, savedReelIds]);

  return (
    <div
      className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none pb-24 relative"
      id="android-profile-view"
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Barra de estado fija en blanco sólido 100% opaco para eliminar cualquier fondo transparente en celulares */}
      <div
        className="w-full bg-white fixed top-0 inset-x-0 z-50 pointer-events-none transition-colors"
        style={{
          height: "max(24px, env(safe-area-inset-top, 24px))",
          backgroundColor: "#ffffff",
        }}
        aria-hidden="true"
      />

      {/* Espaciador que respeta la barra de estado nativa y garantiza el margen de separación para que no se mezcle con el contenido */}
      <div
        className="w-full bg-white shrink-0 pointer-events-none transition-all"
        style={{
          height: "max(24px, env(safe-area-inset-top, 24px))",
          marginBottom: "8px",
          backgroundColor: "#ffffff",
        }}
        aria-hidden="true"
      />

      {/* Contenedor del contenido del perfil que respeta la barra de estado y no se mezcla */}
      <div
        className="w-full flex-1 flex flex-col"
        style={{
          marginTop: "0px",
        }}
      >
        {/* Profile Bio Section without Cover Container */}
        <div className="px-4 pt-1">
          {/* Barra superior con botón para cerrar sesión en la esquina superior derecha */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {onBackToSelf && !isMe && (
                <button
                  type="button"
                  onClick={onBackToSelf}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 active:scale-95 cursor-pointer shadow-2xs"
                >
                  ← Mi Perfil
                </button>
              )}
              <span className="text-xs font-black text-slate-500 tracking-wide uppercase">
                {isMe ? "Mi Perfil" : `@${activeUser.username}`}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  navigateTo("/perfil/login?mode=login");
                }}
                id="mobile-profile-logout-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/80 active:scale-95 transition-all cursor-pointer shadow-2xs group"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-rose-700">Cerrar sesión</span>
              </button>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="relative">
              <img
                src={activeUser.avatar}
                alt={activeUser.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm bg-white"
              />
            </div>

          <div className="flex items-center space-x-2 pb-1">
            {isMe ? (
              <>
                <button
                  onClick={() => {
                    setIsEditProfileOpen(true);
                    navigateTo(getProfileConfigPath(activeUser));
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-200 active:scale-95 transition-transform cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
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
                {onBackToSelf && (
                  <button
                    onClick={onBackToSelf}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 active:scale-95 cursor-pointer shadow-sm"
                  >
                    Mi Perfil
                  </button>
                )}
                <button
                  onClick={() => onToggleFollowUser?.(activeUser.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer ${
                    isFollowing
                      ? "bg-slate-100 text-slate-700 border border-slate-300"
                      : "bg-amber-500 text-slate-950 shadow-sm"
                  }`}
                >
                  {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isFollowing ? "Siguiendo" : "Seguir"}</span>
                </button>
                {onOpenDirectChat && (
                  <button
                    onClick={() => onOpenDirectChat(activeUser)}
                    className="px-3 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 active:scale-95 cursor-pointer"
                  >
                    Mensaje
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-lg font-black text-slate-900">{activeUser.name}</h1>
            {isSuperAdmin(activeUser) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 text-[10px] font-black tracking-wide">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>SUPERADMIN</span>
              </span>
            )}
          </div>
          <p className="text-xs text-amber-600 font-semibold">@{activeUser.username}</p>
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

        {/* Stats Row - Only for Sellers / Admins */}
        {isSellerOrAdmin && (
          <div className="flex items-center space-x-6 mt-4 py-3 border-y border-slate-100 bg-slate-50/70 rounded-2xl text-center">
            <div className="flex-1">
              <span className="block text-sm font-bold text-slate-900">{userReels.length}</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Reels</span>
            </div>
            <div className="flex-1 border-x border-slate-200">
              <span className="block text-sm font-bold text-slate-900">{typeof activeUser.followers === 'number' ? activeUser.followers : 0}</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Seguidores</span>
            </div>
            <div className="flex-1">
              <span className="block text-sm font-bold text-slate-900">{typeof activeUser.following === 'number' ? activeUser.following : 0}</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Siguiendo</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mt-2 px-2">
        {isSellerOrAdmin && (
          <button
            onClick={() => handleSelectMobileTab("reels")}
            title={`Reels (${userReels.length})`}
            aria-label="Reels"
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
              activeTab === "reels" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
        )}

        {isSellerOrAdmin && (
          <button
            onClick={() => handleSelectMobileTab("products")}
            title={`Tienda (${userProducts.length})`}
            aria-label="Tienda"
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
              activeTab === "products" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        )}

        {isMe && (
          <button
            onClick={() => handleSelectMobileTab("saved")}
            title="Guardados"
            aria-label="Guardados"
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
              activeTab === "saved" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Bookmark className="w-5 h-5" />
          </button>
        )}

        {isMe && (
          <button
            onClick={() => handleSelectMobileTab("orders")}
            title="Pedidos"
            aria-label="Pedidos"
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center border-b-2 transition-all cursor-pointer ${
              activeTab === "orders" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Package className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tab Content */}
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
                    setSelectedFeedReelId(reel.id);
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
                        handleDeletePublication(reel.id);
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
            onOpenFeed={(reelId) => setSelectedFeedReelId(reelId)}
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
      </div>

      {/* Publications Feed Modal */}
      {selectedFeedReelId && (
        <AndroidUserPublicationsFeed
          user={activeUser}
          reels={userReels}
          products={products}
          initialReelId={selectedFeedReelId}
          currentUser={currentUser}
          onClose={() => setSelectedFeedReelId(null)}
          onSelectProduct={onSelectProduct}
          onDeleteReel={handleDeletePublication}
          savedReelIds={savedReelIds}
          onToggleSaveReel={onToggleSaveReel}
        />
      )}

      {/* Standalone Publish Modal for Android */}
      {isPublishingOpen && (
        <AndroidPublishView
          currentUser={currentUser}
          onBack={() => setIsPublishingOpen(false)}
          onSuccess={() => {
            setIsPublishingOpen(false);
            onPublishSuccess?.();
          }}
          userProducts={userProducts}
        />
      )}

      {/* Edit Profile Sheet (Imported from ./config) */}
      <ConfigPerfilView
        isOpen={isEditProfileOpen}
        activeUser={activeUser}
        currentUser={currentUser}
        onProfileUpdate={onProfileUpdate}
        onUpdateUser={onUpdateUser}
        onClose={() => {
          setIsEditProfileOpen(false);
          navigateTo(getProfilePath(activeUser));
        }}
      />

      {/* Modal de confirmación de eliminación in-app (evita bloqueos de window.confirm) */}
      <AnimatePresence>
        {publicationToDelete && (
          <div
            id="modal-confirm-delete-publication"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
            onClick={() => !isDeletingPublication && setPublicationToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl text-slate-900 border border-slate-200 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ¿Eliminar publicación?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Esta publicación se eliminará permanentemente de MongoDB Atlas, Google Cloud Storage y de todos los servidores.
              </p>

              {deleteErrorMessage && (
                <div className="mt-2 text-xs text-rose-600 font-semibold">
                  {deleteErrorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 w-full mt-5">
                <button
                  type="button"
                  disabled={isDeletingPublication}
                  onClick={() => setPublicationToDelete(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-publication"
                  disabled={isDeletingPublication}
                  onClick={() => executeDeletePublication(publicationToDelete)}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingPublication ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <span>Eliminar</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export { Perfil, Perfil as ProfileView };
