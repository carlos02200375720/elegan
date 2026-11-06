import React, { useState, useEffect } from "react";
import { User, Product, Reel, Order, isGuestUser } from "../tipos";
import { PerfilProps } from "./tipos";
import { deduplicateById } from "./utilidades";
import {
  navigateTo,
  parseRoute,
  getProfilePath,
  getProfileSavedPath,
  getProfileCompraPath,
  getProfileConfigPath,
} from "../enrutador";
import { apiFetch } from "../config";

export function usePerfilEstado(props: PerfilProps) {
  const {
    currentUser, selectedCreatorId, users, products = [], savedReelIds = [],
    onClearInitialSubTab, initialSubTab, socket,
  } = props;

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
    (!!currentUser.email && decodedCreatorId?.toLowerCase() === currentUser.email?.toLowerCase()) ||
    (decodedCreatorId === "current_user" && !isGuestUser(currentUser)) ||
    (isGuestUser(currentUser) && (decodedCreatorId?.toLowerCase().startsWith("invitado") || decodedCreatorId === "usuario" || decodedCreatorId === "guest"));
  const activeUserId = isSelf
    ? (currentUser.originalId || currentUser.id)
    : selectedCreatorId;

  // Profiles data states
  const [profileUser, setProfileUser] = useState<User | null>(() => {
    if (isSelf) return currentUser;
    if (selectedCreatorId && users) {
      return (
        users.find(
          (u) =>
            u.id === selectedCreatorId ||
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
    let targetPath: string | null = null;
    if (activeSubTab === "saved") {
      targetPath = getProfileSavedPath(targetUser);
    } else if (activeSubTab === "orders") {
      targetPath = getProfileCompraPath(targetUser);
    } else if (activeSubTab === "edit") {
      targetPath = getProfileConfigPath(targetUser);
    }
    if (targetPath && window.location.pathname !== targetPath) {
      navigateTo(targetPath, { replace: true });
    }
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
      } else {
        setProfileUser(currentUser);
      }
    } else if (activeUserId) {
      const matched = users?.find(
        (u) =>
          u.id === activeUserId ||
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
        ? `/api/users/${encodeURIComponent(currentUser.originalId || currentUser.id)}`
        : `/api/users/${encodeURIComponent(activeUserId)}`;

    apiFetch(targetEndpoint)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.user) {
          if (isSelf && currentUser && !isGuestUser(currentUser)) {
            setProfileUser({
              ...currentUser,
              ...data.user,
              id: currentUser.id,
              originalId: currentUser.originalId || data.user.originalId || data.user.id,
              username: currentUser.name || data.user.name,
              name: currentUser.name || data.user.name,
              avatar: currentUser.avatar || data.user.avatar,
              isGuest: false,
            });
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
    (isSelf || !selectedCreatorId || selectedCreatorId === currentUser.id || selectedCreatorId === currentUser.username || selectedCreatorId?.toLowerCase().startsWith("invitado") || selectedCreatorId === "usuario" || selectedCreatorId === "guest");

  return {
    isSelf, activeUserId, isGuestMode,
    profileUser, setProfileUser,
    userReels, setUserReels, userOrders, userSales, ordersLoading,
    selectedTrackingOrder, setSelectedTrackingOrder, copiedTrackingId,
    savedReels, setSavedReels, savedProducts, setSavedProductsFromApi,
    loading, activeSubTab, setActiveSubTab,
    activeFeedReelId, setActiveFeedReelId,
    handleSelectSubTab, fetchOrders, handleCopyTrackingNumber,
  };
}
