import React, { useState, useEffect } from "react";
import { User, Reel, Product, Order } from "../../../types";
import { androidApiFetch } from "../api";
import {
  navigateTo, parseRoute, getProfilePath, getProfileSavedPath,
  getProfileCompraPath, getProfileConfigPath, getProfileProductoPath,
  getProfilePublicacionesPath,
} from "../../../router";

type TabType = "reels" | "products" | "saved" | "orders";

interface UsePerfilDataParams {
  activeUser: User;
  currentUser: User;
  isMe: boolean;
  isSellerOrAdmin: boolean;
  props: any;
}

export default function usePerfilData({
  activeUser, currentUser, isMe, isSellerOrAdmin, props,
}: UsePerfilDataParams) {
  const {
    initialTab, onClearInitialTab, onDeleteReel, onPublishSuccess,
    onRefreshUsers, savedReelIds = [], cart, cartCount,
  } = props;

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
      }      if (parsed.type === "profile" && parsed.profileTab === "publicaciones") {
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
      }    }
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

  const totalCartItems = React.useMemo(() => {
    if (typeof cartCount === "number") return cartCount;
    if (Array.isArray(cart)) {      return cart.reduce((acc, item: any) => acc + (Number(item?.quantity) || 1), 0);
    }
    if (typeof window !== "undefined") {
      try {
        const userId = currentUser.id || currentUser.username || "guest";
        const raw = localStorage.getItem(`mall_cart_${userId}`) || localStorage.getItem("mall_cart");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.reduce((acc, item: any) => acc + (Number(item?.quantity) || 1), 0);
          }
        }
      } catch {}
    }
    return 0;
  }, [cart, cartCount, currentUser.id, currentUser.username]);


  return {
    activeTab, setActiveTab, selectedFeedReelId, setSelectedFeedReelId,
    isEditProfileOpen, setIsEditProfileOpen, isPublishingOpen, setIsPublishingOpen,
    publicationToDelete, setPublicationToDelete, isDeletingPublication,
    deleteErrorMessage, userReels, userProducts, savedReels, savedProducts,
    totalCartItems, handleSelectMobileTab, executeDeletePublication,
    handleDeletePublication,
  };
}
