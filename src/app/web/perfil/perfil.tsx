import React, { useState, useEffect } from "react";
import { User, Product, Reel, Order, isGuestUser } from "../../../types";
import {
  Eye,
  Heart,
  MessageCircle,
  BarChart3,
  ShoppingBag,
  ShieldCheck,
  Shield,
  Lock,
  FileText,
  Mail,
  Play,
  Bookmark,
  Settings,
  X,
  LogOut,
  BadgeCheck,
  Package,
  Check,
  Truck,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  PackageSearch,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoginView from "../LoginView";
import UserPublicationsFeed from "../components/UserPublicationsFeed";
import GuardadoPerfilView from "./guardado";
import CompraPerfilView from "./compra";
import ConfigPerfilView from "./config";
import {
  navigateTo,
  parseRoute,
  getProfilePath,
  getProfileSavedPath,
  getProfileCompraPath,
  getProfileConfigPath,
} from "../../../router";
import { apiFetch } from "../../../config";
import { getDefaultAvatar } from "../../../utils/defaultAssets";

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export interface PerfilProps {
  currentUser: User;
  selectedCreatorId: string | null; // Null means we view our own private admin profile
  users: User[];
  products?: Product[];
  savedReelIds?: string[];
  onToggleSave?: (id: string) => void;
  onBackToSelf: () => void;
  onOpenDirectChat: (user: User) => void;
  onSelectProduct: (product: Product) => void;
  onSelectReel: (reelId: string) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onRefreshUsers?: () => void;
  onPublishSuccess?: () => void;
  onLogout?: () => void;
  socket?: WebSocket | null;
  initialSubTab?: "saved" | "orders" | "edit";
  onClearInitialSubTab?: () => void;
}

export type ProfileViewProps = PerfilProps;

export default function Perfil({
  currentUser,
  selectedCreatorId,
  users,
  products = [],
  savedReelIds = [],
  onToggleSave,
  onBackToSelf,
  onOpenDirectChat,
  onSelectProduct,
  onSelectReel,
  onProfileUpdate,
  onRefreshUsers,
  onPublishSuccess,
  onLogout,
  socket,
  initialSubTab,
  onClearInitialSubTab,
}: PerfilProps) {
  // Determine if we are looking at public creator profile or our private dashboard
  const decodedCreatorId = selectedCreatorId ? decodeURIComponent(selectedCreatorId).replace(/^@/, "") : null;
  const isConfigRoute = typeof window !== "undefined" && (() => {
    const parsed = parseRoute(window.location.pathname);
    return parsed.type === "profile" && parsed.profileTab === "config";
  })();
  const isSelf =
    isConfigRoute ||
    decodedCreatorId === null ||
    decodedCreatorId === currentUser.id ||
    (!!currentUser.originalId && decodedCreatorId === currentUser.originalId) ||
    (!!currentUser.username && decodedCreatorId?.toLowerCase() === currentUser.username?.toLowerCase().replace(/^@/, "")) ||
    (!!currentUser.email && decodedCreatorId?.toLowerCase() === currentUser.email?.toLowerCase()) ||
    (decodedCreatorId === "current_user" && !isGuestUser(currentUser)) ||
    (isGuestUser(currentUser) && (decodedCreatorId?.toLowerCase().startsWith("invitado") || decodedCreatorId === "usuario" || decodedCreatorId === "guest"));
  const activeUserId = isSelf
    ? (currentUser.originalId || currentUser.username || currentUser.id)
    : selectedCreatorId;

  // Profiles data states
  const [profileUser, setProfileUser] = useState<User | null>(() => {
    if (isSelf) return currentUser;
    if (selectedCreatorId && users) {
      return (
        users.find(
          (u) =>
            u.id === selectedCreatorId ||
            u.username?.toLowerCase() === selectedCreatorId.toLowerCase() ||
            (u.originalId && u.originalId === selectedCreatorId) ||
            u.name?.toLowerCase() === selectedCreatorId.toLowerCase()
        ) || null
      );
    }
    return null;
  });
  const [userReels, setUserReels] = useState<Reel[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userSales, setUserSales] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);


  // Tracking inspection modal
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  const [savedReels, setSavedReels] = useState<Reel[]>([]);
  const [savedProductsFromApi, setSavedProductsFromApi] = useState<Product[]>([]);
  const effectiveSavedIds = React.useMemo(() => {
    const set = new Set<string>([...(savedReelIds || []), ...(currentUser?.savedReelIds || [])]);
    return Array.from(set);
  }, [savedReelIds, currentUser?.savedReelIds]);
  const savedProducts = React.useMemo(() => {
    const combined = [
      ...savedProductsFromApi,
      ...(products || []).filter((p) => effectiveSavedIds.includes(p.id)),
    ];
    return deduplicateById(combined).filter(
      (p) =>
        effectiveSavedIds.includes(p.id) ||
        savedProductsFromApi.some(
          (sp) => sp.id === p.id && (!savedReelIds || savedReelIds.length === 0 || savedReelIds.includes(p.id))
        )
    );
  }, [savedProductsFromApi, products, effectiveSavedIds, savedReelIds]);

  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<
    "saved" | "orders" | "edit"
  >(() => {
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "profile" && parsed.profileTab === "guardado") {
        return "saved";
      }
      if (parsed.type === "profile" && parsed.profileTab === "compra") {
        return "orders";
      }
      if (parsed.type === "profile" && parsed.profileTab === "config") {
        return "edit";
      }
    }
    return initialSubTab || "saved";
  });



  // Dedicated user publications feed state
  const [activeFeedReelId, setActiveFeedReelId] = useState<string | null>(null);
  const [editPrivacyPolicy, setEditPrivacyPolicy] = useState(currentUser.privacyPolicy || "");

  const handleSelectSubTab = (
    tab: "saved" | "orders" | "edit"
  ) => {
    setActiveSubTab(tab);
    if (isSelf && typeof window !== "undefined") {
      const targetUser = profileUser || currentUser;
      if (tab === "saved") {
        navigateTo(getProfileSavedPath(targetUser));
      } else if (tab === "orders") {
        navigateTo(getProfileCompraPath(targetUser));
      } else if (tab === "edit") {
        navigateTo(getProfileConfigPath(targetUser));
      } else {
        navigateTo(getProfilePath(targetUser));
      }
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncFromUrl = () => {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "profile" && parsed.profileTab === "guardado") setActiveSubTab("saved");
      else if (parsed.type === "profile" && parsed.profileTab === "compra") setActiveSubTab("orders");
      else if (parsed.type === "profile" && parsed.profileTab === "config") setActiveSubTab("edit");
    };
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("app-route-change", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("app-route-change", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isSelf || isGuestUser(currentUser)) return;
    const targetUser = profileUser || currentUser;
    const targetPath = activeSubTab === "saved"
      ? getProfileSavedPath(targetUser)
      : activeSubTab === "orders"
        ? getProfileCompraPath(targetUser)
        : getProfileConfigPath(targetUser);
    if (window.location.pathname !== targetPath) navigateTo(targetPath, { replace: true });
  }, [isSelf, activeSubTab, profileUser, currentUser]);

  useEffect(() => {
    if (initialSubTab) {
      handleSelectSubTab(initialSubTab);
      onClearInitialSubTab?.();
    }
  }, [initialSubTab, onClearInitialSubTab]);


  // Whenever the active subtab/tarjeta changes or ProfileView unmounts, dismiss any active reel feed and pause all videos
  useEffect(() => {
    setActiveFeedReelId(null);
    if (typeof document !== "undefined") {
      document.querySelectorAll("video").forEach((v) => {
        try {
          v.pause();
        } catch {}
      });
    }
  }, [activeSubTab]);

  useEffect(() => {
    return () => {
      setActiveFeedReelId(null);
      if (typeof document !== "undefined") {
        document.querySelectorAll("video").forEach((v) => {
          try {
            v.pause();
          } catch {}
        });
      }
    };
  }, []);

  useEffect(() => {
    if (isSelf) {
      if (currentUser && !isGuestUser(currentUser)) {
        setProfileUser(currentUser);
        setEditPrivacyPolicy(currentUser.privacyPolicy || "");
      } else {
        setProfileUser(currentUser);
      }
    } else if (activeUserId) {
      const matched = users?.find(
        (u) =>
          u.id === activeUserId ||
          u.username?.toLowerCase() === activeUserId.toLowerCase() ||
          (u.originalId && u.originalId === activeUserId) ||
          u.name?.toLowerCase() === activeUserId.toLowerCase()
      );
      if (matched) {
        setProfileUser(matched);
      }
    }
  }, [currentUser, isSelf, activeUserId, users]);

  useEffect(() => {
    if (!activeUserId) return;

    // If viewing own guest profile, don't trigger unnecessary network fetch
    if (isSelf && isGuestUser(currentUser)) {
      setProfileUser(currentUser);
      setLoading(false);
      return;
    }

    setLoading(true);

    const targetEndpoint =
      isSelf && !isGuestUser(currentUser)
        ? `/api/users/${encodeURIComponent(currentUser.originalId || currentUser.username || currentUser.id)}`
        : `/api/users/${encodeURIComponent(activeUserId)}`;

    apiFetch(targetEndpoint)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.user) {
          if (isSelf && currentUser && !isGuestUser(currentUser)) {
            const resolvedPolicy =
              data.user.privacyPolicy !== undefined ? data.user.privacyPolicy : currentUser.privacyPolicy || "";
            setProfileUser({
              ...currentUser,
              ...data.user,
              id: currentUser.id,
              originalId: currentUser.originalId || data.user.originalId || data.user.id,
              username: currentUser.username || data.user.username,
              name: currentUser.name || data.user.name,
              avatar: currentUser.avatar || data.user.avatar,
              coverPhoto: currentUser.coverPhoto || data.user.coverPhoto,
              isGuest: false,
              privacyPolicy: resolvedPolicy,
            });
            if (resolvedPolicy) {
              setEditPrivacyPolicy(resolvedPolicy);
            }
          } else {
            setProfileUser(data.user);
          }
          setUserReels(deduplicateById(data.reels || []));
          setUserOrders(deduplicateById(data.purchases || data.orders || []));
          if (data.sales) {
            setUserSales(deduplicateById(data.sales || []));
          }
          setSavedReels(deduplicateById(data.savedReels || []));
          if (data.savedProducts) {
            setSavedProductsFromApi(deduplicateById(data.savedProducts || []));
          }
        } else if (isSelf) {
          setProfileUser(currentUser);
        } else {
          const matched = users?.find(
            (u) =>
              u.id === activeUserId ||
              u.username?.toLowerCase() === activeUserId.toLowerCase() ||
              (u.originalId && u.originalId === activeUserId) ||
              u.name?.toLowerCase() === activeUserId.toLowerCase()
          );
          if (matched) {
            setProfileUser(matched);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not fetch remote user details, using client state:", err);
        if (isSelf) {
          setProfileUser(currentUser);
        } else {
          const matched = users?.find(
            (u) =>
              u.id === activeUserId ||
              u.username?.toLowerCase() === activeUserId.toLowerCase() ||
              (u.originalId && u.originalId === activeUserId) ||
              u.name?.toLowerCase() === activeUserId.toLowerCase()
          );
          if (matched) {
            setProfileUser(matched);
          }
        }
        setLoading(false);
      });
  }, [activeUserId, currentUser, isSelf]);

  // Fetch fresh orders (both purchases and sales)
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const targetOrderUserId = currentUser.originalId || currentUser.username || currentUser.id;
      const res = await apiFetch(`/api/orders?userId=${encodeURIComponent(targetOrderUserId)}`);
      const data = await res.json();
      if (data && !data.error) {
        if (data.purchases) {
          setUserOrders(deduplicateById(data.purchases));
        } else if (Array.isArray(data)) {
          setUserOrders(deduplicateById(data));
        }
        if (data.sales) {
          setUserSales(deduplicateById(data.sales));
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (
      isSelf &&
      activeSubTab === "orders" &&
      currentUser &&
      !currentUser.isGuest &&
      currentUser.username !== "invitado"
    ) {
      fetchOrders();
    }
  }, [isSelf, activeSubTab, currentUser.id, currentUser.originalId, currentUser.username]);

  // Listen to WebSocket events for real-time order tracking updates
  useEffect(() => {
    if (!socket) return;
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "order_created" || payload.type === "order_updated") {
          const updated: Order = payload.order;
          if (updated) {
            setUserOrders((prev) => {
              const idx = prev.findIndex((o) => o.id === updated.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              const isBuyer =
                updated.buyerId === currentUser.id ||
                updated.buyerId === "current_user" ||
                (currentUser.originalId && updated.buyerId === currentUser.originalId) ||
                (updated.buyerUsername && updated.buyerUsername.toLowerCase() === currentUser.username?.toLowerCase());
              return isBuyer ? [updated, ...prev] : prev;
            });

            setUserSales((prev) => {
              const idx = prev.findIndex((o) => o.id === updated.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              const isSeller = updated.items.some(
                (it) =>
                  it.sellerId === currentUser.id ||
                  it.sellerId === "current_user" ||
                  (currentUser.originalId && it.sellerId === currentUser.originalId) ||
                  (it.sellerUsername && it.sellerUsername.toLowerCase() === currentUser.username?.toLowerCase())
              );
              return isSeller ? [updated, ...prev] : prev;
            });

            setSelectedTrackingOrder((prev) => (prev && prev.id === updated.id ? updated : prev));
          }
        }
      } catch (e) {}
    };

    socket.addEventListener("message", handleWsMessage);
    return () => {
      socket.removeEventListener("message", handleWsMessage);
    };
  }, [socket, currentUser.id, currentUser.originalId, currentUser.username]);

  const handleCopyTrackingNumber = (trackingNum: string, orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum);
    setCopiedTrackingId(orderId);
    setTimeout(() => setCopiedTrackingId(null), 2500);
  };

  const isGuestMode =
    isGuestUser(currentUser) &&
    activeSubTab !== "edit" &&
    (isSelf || !selectedCreatorId || selectedCreatorId === currentUser.id || selectedCreatorId === currentUser.username || selectedCreatorId?.toLowerCase().startsWith("invitado") || selectedCreatorId === "usuario" || selectedCreatorId === "guest");

  if (isGuestMode) {
    return (
      <div
        className="w-full max-w-4xl mx-auto pb-0 overflow-x-hidden"
        id="guest-profile-login-wrapper"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <LoginView
          users={users}
          currentUser={currentUser}
          initialTab="register"
          restrictionNotice="Para acceder a tu perfil, tus publicaciones guardadas, el historial de tus compras y todas tus interacciones, debes registrarte en la plataforma. Toda tu información previa se transferirá automáticamente a tu cuenta."
          onRefreshUsers={onRefreshUsers || (() => {})}
          onLoginSuccess={(user) => {
            setProfileUser(user);
            if (onProfileUpdate) {
              onProfileUpdate(user);
            }
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[550px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 pb-0">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold mt-4">Sincronizando perfil...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="w-full max-w-4xl mx-auto h-[450px] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 p-6 text-center pb-0">
        <p className="font-bold text-slate-700">Perfil no disponible</p>
        <button
          onClick={onBackToSelf}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          Regresar a mi perfil
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-4xl mx-auto min-h-[600px] bg-white rounded-none sm:rounded-t-none sm:rounded-b-2xl border-0 sm:border sm:border-slate-200 shadow-none sm:shadow-xl overflow-hidden flex flex-col no-scrollbar pb-0"
      id="profile-panel"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Profile Info Details Overlay row */}
      <div className="px-6 sm:px-8 pb-0 relative border-b border-slate-200/80 bg-slate-50 z-10">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-0 mb-4 gap-4 z-10 relative"
          style={{ marginTop: "0px", marginBottom: "0px" }}
        >
          <div className="flex items-end space-x-4">
            <div className="flex flex-col items-center shrink-0">
              <img
                src={profileUser.avatar || getDefaultAvatar()}
                alt={profileUser.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md bg-white shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDefaultAvatar();
                }}
              />
              <span className="text-xs text-slate-500 font-bold font-mono mt-1 text-center">
                @{profileUser.username}
              </span>
            </div>
            <div className="pb-1">
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-950 flex items-center space-x-2 flex-wrap">
                <span className="inline-block" style={{ paddingLeft: "18px" }}>
                  {profileUser.name}
                </span>
                {(isSuperAdmin(profileUser) || !isSelf) && (
                  <BadgeCheck className="w-5 h-5 fill-sky-500 text-white shrink-0" title="Verificado" />
                )}
              </h2>
            </div>
          </div>

          {/* Call-to-actions / Session indicator */}
          <div className="sm:pb-1 flex items-center space-x-2">
            {isSelf && onLogout && (
              <button
                type="button"
                onClick={onLogout}
                id="profile-logout-btn"
                className="p-2 text-slate-600 hover:text-red-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            {!isSelf && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenDirectChat(profileUser)}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  id="message-creator-btn"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Mensaje</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Biography summary (Max 50 chars) */}
        {profileUser.bio && (
          <div className="mt-2 mb-1">
            <p className="text-xs text-slate-800 leading-relaxed font-medium max-w-sm break-words bg-transparent rounded-none px-0 py-0.5 shadow-none border-0">
              {profileUser.bio.length > 50 ? profileUser.bio.slice(0, 50) + "..." : profileUser.bio}
            </p>
          </div>
        )}

        {/* Horizontal Menu with Icons Only */}
        {isSelf ? (
          <div className="mt-2 pt-0.5 border-t border-slate-200/80 flex items-center justify-around w-full max-w-sm sm:max-w-md mx-auto">
            <button onClick={() => handleSelectSubTab("saved")} title="Guardados" className="py-1.5 px-2.5 text-slate-500">
              <Bookmark className="w-4.5 h-4.5 stroke-[2]" />
            </button>
            <button onClick={() => { handleSelectSubTab("orders"); fetchOrders(); }} title="Historial de Mis Compras" className="py-1.5 px-2.5 text-slate-500">
              <ShoppingBag className="w-4.5 h-4.5 stroke-[2]" />
              {userOrders.length > 0 && <span className="ml-1">{userOrders.length}</span>}
            </button>
            <button onClick={() => handleSelectSubTab("edit")} title="Editar Perfil" className="py-1.5 px-2.5 text-slate-500">
              <Settings className="w-4.5 h-4.5 stroke-[2]" />
            </button>
          </div>
        ) : (
          <div className="mt-2 pt-0.5 border-t border-slate-200/80 flex items-center justify-center w-full max-w-sm sm:max-w-md mx-auto">
            <FileText className="w-4.5 h-4.5 stroke-[2] text-amber-500" />
          </div>
        )}
      </div>

      {/* Profile Inner Section tabs */}
      <div className="flex-1 p-4 sm:p-6 pt-3 sm:pt-4 pb-0">
        <AnimatePresence mode="wait">
          {isSelf ? (
            /* --- 1. ADMINISTRATIVE DASHBOARD VIEWS --- */
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <AnimatePresence mode="wait">
                {activeSubTab === "saved" && (
                  <GuardadoPerfilView
                    savedProducts={savedProducts}
                    savedReels={savedReels}
                    onSelectProduct={onSelectProduct}
                    onToggleSave={onToggleSave}
                    onRemoveSavedProductFromLocal={(productId) =>
                      setSavedProductsFromApi((prev) => prev.filter((p) => p.id !== productId))
                    }
                    onSelectReel={(reelId) => setActiveFeedReelId(reelId)}
                  />
                )}

                {activeSubTab === "orders" && (
                  <CompraPerfilView
                    userOrders={userOrders}
                    userSales={userSales}
                    ordersLoading={ordersLoading}
                    onRefreshOrders={fetchOrders}
                    onSelectTrackingOrder={(order) => setSelectedTrackingOrder(order)}
                  />
                )}

                {activeSubTab === "edit" && (
                  <ConfigPerfilView
                    currentUser={currentUser}
                    profileUser={profileUser || currentUser}
                    users={users}
                    onProfileSaved={(updatedUser) => {
                      setProfileUser(updatedUser);
                      if (onProfileUpdate) {
                        onProfileUpdate(updatedUser);
                      }
                    }}
                    onRefreshUsers={onRefreshUsers}
                    onBackToSelf={onBackToSelf}
                    onCancel={() => handleSelectSubTab("saved")}
                    onPrivacyPolicyChange={(policy) => setEditPrivacyPolicy(policy)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* --- 2. PUBLIC CREATOR PROFILE VIEW --- */
            <motion.div
              key="creator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                {(
                  <motion.div
                    key="public-policies"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4 max-w-2xl mx-auto"
                  >
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                            Política y Privacidad del Negocio
                          </h3>
                          <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                            Términos comerciales, garantías y resguardo de datos de{" "}
                            <span className="text-amber-400 font-bold">{profileUser.name}</span> (@{profileUser.username}).
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-700/60">
                        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/5 border border-white/5">
                          <Shield className="w-4 h-4 text-emerald-400 mb-1" />
                          <span className="text-[10px] font-bold text-white leading-tight">Compra Segura</span>
                          <span className="text-[9px] text-slate-400">Garantizada</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/5 border border-white/5">
                          <Lock className="w-4 h-4 text-sky-400 mb-1" />
                          <span className="text-[10px] font-bold text-white leading-tight">Privacidad</span>
                          <span className="text-[9px] text-slate-400">100% Protegido</span>
                        </div>
                        <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/5 border border-white/5">
                          <MessageCircle className="w-4 h-4 text-amber-400 mb-1" />
                          <span className="text-[10px] font-bold text-white leading-tight">Atención</span>
                          <span className="text-[9px] text-slate-400">Chat Directo</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                      <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-100">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Términos y Políticas del Vendedor
                        </h4>
                      </div>

                      {(() => {
                        const matchedUser = users?.find(
                          (u) =>
                            u.id === profileUser.id ||
                            (profileUser.username && u.username?.toLowerCase() === profileUser.username.toLowerCase()) ||
                            (profileUser.originalId && u.originalId === profileUser.originalId) ||
                            (profileUser.name && u.name?.toLowerCase() === profileUser.name.toLowerCase())
                        );
                        const effectivePolicy =
                          (profileUser.privacyPolicy && profileUser.privacyPolicy.trim()) ||
                          (matchedUser?.privacyPolicy && matchedUser.privacyPolicy.trim()) ||
                          (isSelf && editPrivacyPolicy && editPrivacyPolicy.trim()) ||
                          "";

                        return effectivePolicy ? (
                          <div className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line space-y-2 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                            {effectivePolicy}
                          </div>
                        ) : (
                          <div className="space-y-3 py-2">
                            <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-amber-900 text-xs leading-relaxed font-medium">
                              <p className="font-bold mb-1">Garantías estándar de la plataforma:</p>
                              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
                                <li>Todas tus transacciones cuentan con protección al comprador.</li>
                                <li>Puedes comunicarte directamente con el vendedor a través del chat oficial.</li>
                                <li>Tus datos personales y dirección solo son usados para la logística del despacho.</li>
                              </ul>
                            </div>
                            <p className="text-[11px] text-slate-400 italic text-center">
                              (El vendedor aún no ha configurado términos adicionales personalizados)
                            </p>
                          </div>
                        );
                      })()}

                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-bold text-slate-500">
                          ¿Deseas consultar o aclarar alguna duda?
                        </span>
                        <button
                          onClick={() => onOpenDirectChat(profileUser)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Contactar al Negocio</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL: LIVE TRACKING & EXPANDED DISPATCH TIMELINE */}
      <AnimatePresence>
        {selectedTrackingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
            onClick={() => setSelectedTrackingOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
              id="modal-live-tracking"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                    <PackageSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-slate-900">Rastreo de Envío en Vivo</h3>
                    <p className="text-[11px] font-mono text-slate-500">Ref: {selectedTrackingOrder.id}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTrackingOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Truck className="w-3 h-3" />
                      <span>{selectedTrackingOrder.carrier || "Paquetería Express"}</span>
                    </span>

                    {selectedTrackingOrder.estimatedDelivery && (
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Entrega: {selectedTrackingOrder.estimatedDelivery}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Número de Guía / Seguimiento
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-base font-black font-mono text-slate-900 tracking-wider">
                        {selectedTrackingOrder.trackingNumber || "Pendiente de asignación"}
                      </span>
                      {selectedTrackingOrder.trackingNumber && (
                        <button
                          onClick={(e) =>
                            handleCopyTrackingNumber(
                              selectedTrackingOrder.trackingNumber!,
                              selectedTrackingOrder.id,
                              e
                            )
                          }
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedTrackingId === selectedTrackingOrder.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-700 font-bold">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copiar</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedTrackingOrder.trackingUrl && (
                    <div className="pt-1">
                      <a
                        href={selectedTrackingOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        <span>Abrir portal oficial de {selectedTrackingOrder.carrier || "paquetería"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">
                    Estado Actual del Paquete
                  </p>
                  {(() => {
                    const st = selectedTrackingOrder.status;
                    const step = st === "delivered" ? 4 : st === "shipped" ? 3 : st === "processing" ? 2 : 1;
                    return (
                      <div className="relative flex items-center justify-between px-2">
                        <div className="absolute left-6 right-6 top-3 h-1 bg-slate-200 z-0" />
                        <div
                          className="absolute left-6 top-3 h-1 bg-amber-500 transition-all duration-300 z-0"
                          style={{
                            width: step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%",
                          }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 1
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Confirmado</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 2
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Preparando</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step >= 3
                                ? "bg-amber-500 text-slate-950 ring-4 ring-amber-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">En Camino</span>
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step === 4
                                ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {step === 4 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                          </div>
                          <span className="text-[9px] font-bold text-slate-700 mt-1">Entregado</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Historial Cronológico de Paradas y Despacho
                  </p>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
                    {selectedTrackingOrder.statusHistory && selectedTrackingOrder.statusHistory.length > 0 ? (
                      selectedTrackingOrder.statusHistory.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start space-x-3 text-xs">
                          <div className="relative flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[8px] font-black ring-4 ring-amber-50 shrink-0">
                              ✓
                            </div>
                            {hIdx < (selectedTrackingOrder.statusHistory?.length || 1) - 1 && (
                              <div className="w-0.5 h-10 bg-slate-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-slate-900 text-xs truncate">
                                {h.label || "Actualización de despacho"}
                              </p>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {new Date(h.timestamp).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {h.note && <p className="text-[11px] text-slate-600">{h.note}</p>}
                            {h.trackingNumber && (
                              <p className="text-[10px] text-amber-700 font-mono font-bold">
                                Guía asignada: {h.trackingNumber} ({h.carrier || "Transportista"})
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        <Clock className="w-6 h-6 mx-auto mb-1 stroke-1 text-slate-300" />
                        <p>El paquete está en proceso de despacho inicial.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-2.5 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Dirección de Destino:</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedTrackingOrder.shippingAddress}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTrackingOrder(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPONENTE EXCLUSIVO PARA MOSTRAR LA LISTA DE PUBLICACIONES DE UN USUARIO */}
      <AnimatePresence>
        {activeFeedReelId && (
          <UserPublicationsFeed
            user={profileUser || currentUser}
            reels={
              (isSelf && activeSubTab === "saved" ? savedReels : userReels).some((r) => r.id === activeFeedReelId)
                ? isSelf && activeSubTab === "saved"
                  ? savedReels
                  : userReels
                : userReels.some((r) => r.id === activeFeedReelId)
                ? userReels
                : savedReels.some((r) => r.id === activeFeedReelId)
                ? savedReels
                : [...userReels, ...savedReels.filter((sr) => !userReels.some((ur) => ur.id === sr.id))]
            }
            products={userProducts}
            initialReelId={activeFeedReelId}
            currentUser={currentUser}
            onClose={() => setActiveFeedReelId(null)}
            onSelectProduct={onSelectProduct}
            onDeleteReel={(reelId) => {
              setUserReels((prev) => prev.filter((r) => r.id !== reelId));
              if (onPublishSuccess) onPublishSuccess();
            }}
            onUpdateReels={(updatedReels) => {
              if (activeSubTab === "saved") {
                setSavedReels(updatedReels);
              } else {
                setUserReels(updatedReels);
              }
            }}
            savedReelIds={currentUser.savedReelIds || []}
            onToggleSaveReel={(reelId) => {
              apiFetch(`/api/users/${currentUser.id}/save-reel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reelId }),
              }).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
