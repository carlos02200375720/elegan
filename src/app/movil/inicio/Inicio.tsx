import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Reel, ReelMedia, Product, User, Comment, CartItem, isGuestUser } from "../tipos";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovilHamburgerMenu } from "../componente/menu";
import { CATEGORIES_WITH_IMAGES } from "../tienda/catalogo";
import { CarritoTiendaView } from "../tienda/carrito";
import { apiFetch } from "../config";
import { getInicioShareUrl, findReelByInicioParam, navigateTo } from "../../../router";
import { getLocalGuestToken } from "../guestToken";
import { isSuperAdmin } from "../utilidades/superAdmin";
import type { AndroidInicioProps, PublicationFormat } from "./TiposInicio";
import { findProductForReel } from "./FuncionesInicio";
import InicioCargando from "./InicioCargando";
import InicioSinContenido from "./InicioSinContenido";
import EncabezadoInicio from "./EncabezadoInicio";
import BannerPrincipal from "./BannerPrincipal";
import SeccionCategorias from "./SeccionCategorias";
import SeccionVideos from "./SeccionVideos";

export default function Inicio({
  reels: publishedReels,
  currentUser,
  onLikeReel,
  onCommentReel,
  onAddComment,
  onSelectProduct,
  onProductClick,
  products = [],
  onToggleSaveReel,
  savedReelIds,
  onSelectUser,
  onCreatorClick,
  users = [],
  isFeedActive = true,
  unreadCount = 0,
  totalUnreads = 0,
  onNavigateToTab,
  onNavigateToPath,
  onAuthRequired,
  onGuestInteraction,
  onRefreshReels,
  isLoading = false,
  isMuted: propIsMuted,
  onToggleMute: propOnToggleMute,
  bottomNavHeight = 56,
  cart = [],
  onNavigateToShop,
  onNavigateToCheckout,
  onNavigateToProfile,
  onRemoveFromCart,
  onUpdateCartQuantity,
  initialReelId,
  onActiveReelChange,
}: AndroidInicioProps) {
  const [activeBanner, setActiveBanner] = useState<{
    label: string; title: string; description: string; link: string; imageUrl: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/banner")
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setActiveBanner(data?.banner?.enabled === true ? data.banner : null);
      })
      .catch((error) => console.warn("[Inicio] No se pudieron cargar las promociones:", error));
    return () => { cancelled = true; };
  }, []);

  const [localReelOverrides, setLocalReelOverrides] = useState<
    Record<string, { likes?: number; likedBy?: string[]; comments?: Comment[]; saves?: number; shares?: number }>
  >({});

  const allReels = useMemo(() => {
    const productPublications = products.flatMap((product): Reel[] => {
      if (!product.id) return [];

      const canonicalId = `reel_prod_${product.id}`;
      const existingReel = publishedReels.find(
        (reel) => reel.id === canonicalId ||
          (reel.type === "product" && reel.productId === product.id)
      );
      const productImages = (product.images || []).filter(
        (image): image is string => typeof image === "string" && image.trim().length > 0
      );
      if (productImages.length === 0 && product.imageUrl?.trim()) {
        productImages.push(product.imageUrl);
      }
      const productVideos = (product.videos || []).filter(
        (video): video is string => typeof video === "string" && video.trim().length > 0
      );
      const seller = users.find(
        (user) =>
          user.id === product.sellerId ||
          user.originalId === product.sellerId ||
          user.username === product.sellerUsername
      );
      const description = product.description?.trim() || "";
      const creator = {
        creatorId: seller?.id || product.sellerId || "seller",
        creatorName: seller?.name || product.sellerName || "Vendedor",
        creatorUsername: seller?.username || product.sellerUsername,
        creatorAvatar:
          seller?.avatar ||
          product.sellerAvatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      };

      const generated: Reel[] = [];

      // Publicación principal: reúne todos los videos e imágenes del mismo producto.
      if (!existingReel) {
        const override = localReelOverrides[canonicalId] || localReelOverrides[product.id];
        const media: ReelMedia[] = [
          ...productVideos.map((url) => ({ type: "video" as const, url })),
          ...productImages.map((url) => ({ type: "image" as const, url })),
        ];
        generated.push({
          id: canonicalId,
          type: "product",
          title: product.name,
          description,
          caption: description,
          ...creator,
          videoUrl: productVideos[0] || "",
          thumbnailUrl: product.imageUrl || productImages[0] || "",
          images: productImages,
          media,
          likes: override?.likes ?? 0,
          likedBy: override?.likedBy ?? [],
          comments: override?.comments ?? [],
          shares: override?.shares ?? 0,
          saves: override?.saves ?? 0,
          views: existingReel?.views ?? 0,
          productId: product.id,
          aspectRatio: "square",
        });
      }

      // Un Reel independiente por imagen, vinculado al producto existente.
      productImages.forEach((imageUrl, index) => {
        const reelId = `${canonicalId}_imagen_${index + 1}`;
        if (publishedReels.some((reel) => reel.id === reelId)) return;
        const override = localReelOverrides[reelId];
        generated.push({
          id: reelId,
          type: "image",
          title: product.name,
          description,
          caption: description,
          ...creator,
          videoUrl: "",
          thumbnailUrl: imageUrl,
          images: [imageUrl],
          media: [{ type: "image", url: imageUrl }],
          likes: override?.likes ?? 0,
          likedBy: override?.likedBy ?? [],
          comments: override?.comments ?? [],
          shares: override?.shares ?? 0,
          saves: override?.saves ?? 0,
          views: 0,
          productId: product.id,
          aspectRatio: "square",
        });
      });

      return generated;
    });

    return [...publishedReels, ...productPublications].map((reel) => {
      const override =
        localReelOverrides[reel.id] ||
        (reel.productId ? localReelOverrides[reel.productId] : undefined);
      if (!override) return reel;
      return {
        ...reel,
        likes: override.likes !== undefined ? override.likes : reel.likes,
        likedBy: override.likedBy !== undefined ? override.likedBy : reel.likedBy,
        comments: override.comments !== undefined ? override.comments : reel.comments,
        saves: override.saves !== undefined ? override.saves : reel.saves,
        shares: override.shares !== undefined ? override.shares : reel.shares,
      };
    });
  }, [publishedReels, products, users, localReelOverrides]);
  const menuCategories = useMemo(() => {
    const seen = new Set<string>();
    const categories: string[] = [];

    const addCategory = (name?: string) => {
      const clean = name?.trim();
      if (!clean) return;
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        categories.push(clean);
      }
    };

    addCategory("Todos");
    for (const category of CATEGORIES_WITH_IMAGES) {
      addCategory(category.name);
    }
    for (const product of products) {
      addCategory(product.category);
    }
    return categories;
  }, [products]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const reels = useMemo(() => {
    if (!selectedCategory) return allReels;
    const normalizedCategory = selectedCategory.trim().toLowerCase();
    return allReels.filter((reel) => {
      const taggedProduct = findProductForReel(reel, products) || (reel as Reel & { product?: Product }).product;
      return taggedProduct?.category?.trim().toLowerCase() === normalizedCategory;
    });
  }, [allReels, products, selectedCategory]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialReelId && reels.length > 0) {
      const matched = findReelByInicioParam(reels, initialReelId);
      const idx = matched ? reels.findIndex((r) => r.id === matched.id) : -1;
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const lastSeenInitialReelIdPropRef = useRef<string | null>(
    initialReelId && reels.length > 0 ? initialReelId : null
  );
  const lastReportedActiveReelIdRef = useRef<string | null>(initialReelId || null);
  const internalSwipedReelIdsRef = useRef<Set<string>>(new Set());
  const onActiveReelChangeRef = useRef(onActiveReelChange);
  onActiveReelChangeRef.current = onActiveReelChange;
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const activeReelNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDescription, setAuthDescription] = useState("");
  const [actualNavHeight, setActualNavHeight] = useState<number>(bottomNavHeight || 56);
  const [imageAspect, setImageAspect] = useState<'vertical' | 'horizontal' | 'square'>('square');
  const [progressVideo, setProgressVideo] = useState<HTMLVideoElement | null>(null);
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const [descriptionOverflow, setDescriptionOverflow] = useState<{ [key: string]: boolean }>({});
  const descriptionRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  const getEffectiveFormat = (item: Reel): PublicationFormat => {
    const ar = (item.aspectRatio || '').toLowerCase().trim();
    if (ar === '1:1' || ar === 'square') return '1:1';
    if (ar === '4:3' || ar === 'horizontal' || ar === 'landscape') return '4:3';
    if (ar === '3:4' || ar === 'vertical' || ar === 'portrait') return '3:4';
    if (item.type === 'product' || item.productId) return '1:1';
    return '3:4';
  };

  const [selectedCartIndices, setSelectedCartIndices] = useState<number[]>([]);

  // Synchronize cart selection when cart items change
  useEffect(() => {
    setSelectedCartIndices((prev) => {
      if (!cart || cart.length === 0) return prev.length === 0 ? prev : [];
      const valid = prev.filter((i) => i < cart.length);
      if (valid.length === cart.length && valid.length === prev.length) return prev;
      if (valid.length > 0) return valid;
      return cart.map((_, i) => i);
    });
  }, [cart?.length]);

  const toggleSelectCartItem = (idx: number) => {
    setSelectedCartIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const isAllSelected = (cart?.length || 0) > 0 && selectedCartIndices.length === cart.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCartIndices([]);
    } else {
      setSelectedCartIndices((cart || []).map((_, i) => i));
    }
  };

  const selectedCartItems = (cart || []).filter((_, idx) => selectedCartIndices.includes(idx));
  const selectedCartSubtotal = selectedCartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 1);
  }, 0);
  const selectedCartShipping = selectedCartItems.reduce((sum, item) => {
    const shipping = item.selectedShippingCost !== undefined
      ? Number(item.selectedShippingCost)
      : Number(item.product?.shippingCost || 0);
    return sum + (Number.isNaN(shipping) ? 0 : shipping) * (item.quantity || 1);
  }, 0);
  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  const selectedCartTotal = selectedCartSubtotal + selectedCartShipping;

  // Track bottom navigation bar height dynamically for pixel-perfect alignment
  useEffect(() => {
    const updateHeight = () => {
      const navEl = document.getElementById("android-bottom-nav-bar");
      if (navEl) {
        const nextH = navEl.getBoundingClientRect().height || navEl.offsetHeight || 56;
        setActualNavHeight((prev) => (prev === nextH ? prev : nextH));
      } else if (bottomNavHeight) {
        setActualNavHeight((prev) => (prev === bottomNavHeight ? prev : bottomNavHeight));
      }
    };
    updateHeight();
    const navEl = document.getElementById("android-bottom-nav-bar");
    let ro: ResizeObserver | null = null;
    if (navEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateHeight);
      ro.observe(navEl);
    }
    window.addEventListener("resize", updateHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [bottomNavHeight]);

  const isMuted = propIsMuted !== undefined ? propIsMuted : localMuted;
  const toggleMute = () => {
    if (propOnToggleMute) {
      propOnToggleMute();
    } else {
      setLocalMuted((prev) => !prev);
    }
    if (playerRef.current) {
      playerRef.current.toggleMute();
    }
  };

  const handleMuteChange = useCallback((m: boolean) => {
    setLocalMuted(m);
  }, []);

  const handleVideoReady = useCallback((video: HTMLVideoElement | null) => {
    setProgressVideo((prev) => (prev === video ? prev : video));
  }, []);

  const playerRef = useRef<MovilVideoPlayHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaSliderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [activeCommentsReelId, setActiveCommentsReelId] = useState<string | null>(null);
  const [heartAnimReelId, setHeartAnimReelId] = useState<string | null>(null);

  const handleMediaScroll = useCallback(
    (reelId: string, element: HTMLDivElement, totalItems: number) => {
      const width = element.clientWidth;
      if (width > 0) {
        const newIdx = Math.round(element.scrollLeft / width);
        if (newIdx >= 0 && newIdx < totalItems) {
          setCarouselIndices((prev) => {
            if (prev[reelId] === newIdx) return prev;
            return { ...prev, [reelId]: newIdx };
          });
        }
      }
    },
    []
  );

  const getReelMediaItems = useCallback((reel?: Reel): ReelMedia[] => {
    if (!reel) return [{ type: "image", url: "" }];
    if (Array.isArray(reel.media) && reel.media.length > 0) {
      return reel.media.map((item) =>
        item.type === "video"
          ? {
              ...item,
              url: reel.hlsUrl || reel.videoUrl || item.url,
              hlsUrl: reel.hlsUrl || item.hlsUrl,
              thumbnailUrl: item.thumbnailUrl || reel.thumbnailUrl || undefined,
            }
          : item
      );
    }
    if (reel.videoUrl && reel.videoUrl.trim() !== "") {
      return [
        {
          type: "video",
          url: reel.hlsUrl || reel.videoUrl,
          hlsUrl: reel.hlsUrl,
          thumbnailUrl: reel.thumbnailUrl || undefined,
        },
      ];
    }
    if (reel.images && reel.images.length > 0) {
      return reel.images.map((img, i) => ({ type: "image", url: img, order: i }));
    }
    return [{ type: "image", url: reel.thumbnailUrl || "" }];
  }, []);

  const currentReel = reels[currentIndex] || reels[0];

  useEffect(() => {
    const measureDescriptions = () => {
      setDescriptionOverflow((previous) => {
        let changed = false;
        const next = { ...previous };
        for (const reel of reels) {
          if (expandedDescriptions[reel.id]) continue;
          const element = descriptionRefs.current[reel.id];
          const overflows = Boolean(element && element.scrollHeight > element.clientHeight + 1);
          if (next[reel.id] !== overflows) {
            next[reel.id] = overflows;
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    };

    measureDescriptions();
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measureDescriptions)
      : null;
    Object.values(descriptionRefs.current).forEach((element: HTMLParagraphElement | null) => {
      if (element) observer?.observe(element);
    });
    window.addEventListener("resize", measureDescriptions);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureDescriptions);
    };
  }, [reels, expandedDescriptions]);

  // Cleanup timers and RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current);
      if (activeReelNotifyTimerRef.current) clearTimeout(activeReelNotifyTimerRef.current);
    };
  }, []);

  const scrollToReelIndex = useCallback((targetIdx: number, smooth = true) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const card = container.children.item(targetIdx + 1);
    if (!(card instanceof HTMLElement)) return;
    const headerHeight = container.querySelector("header")?.getBoundingClientRect().height || 0;

    isProgrammaticScrollRef.current = true;
    if (programmaticScrollTimerRef.current) clearTimeout(programmaticScrollTimerRef.current);
    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, smooth ? 450 : 150);

    container.scrollTo({
      top: Math.max(0, card.offsetTop - headerHeight),
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const previousCategoryRef = useRef(selectedCategory);
  useEffect(() => {
    if (previousCategoryRef.current === selectedCategory) return;
    previousCategoryRef.current = selectedCategory;
    setCurrentIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || !containerRef.current) return;

    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current || isProgrammaticScrollRef.current) return;
      const container = containerRef.current;
      const containerHeight = container.clientHeight;
      if (!containerHeight) return;

      const headerHeight = container.querySelector("header")?.getBoundingClientRect().height || 0;
      const focalCenter = container.scrollTop + headerHeight + (containerHeight - headerHeight) / 2;
      const cards = Array.from(container.children).slice(1);
      if (cards.length === 0) return;

      let bestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const el = cards[i] as HTMLElement;
        const cardCenter = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(cardCenter - focalCenter);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0 && bestIdx < reels.length) {
        if (bestIdx !== currentIndex) {
          setCurrentIndex(bestIdx);
        }
        if (bestIdx >= reels.length - 2 && onRefreshReels && !isRefreshingRef.current) {
          isRefreshingRef.current = true;
          onRefreshReels();
          setTimeout(() => {
            isRefreshingRef.current = false;
          }, 3500);
        }
      }
    });
  }, [currentIndex, reels.length, onRefreshReels]);

  const handleNext = useCallback(() => {
    if (reels.length === 0) return;
    const nextIdx = (currentIndex + 1) % reels.length;
    setCurrentIndex(nextIdx);
    scrollToReelIndex(nextIdx, true);
  }, [currentIndex, reels.length, scrollToReelIndex]);

  const handlePrev = useCallback(() => {
    if (reels.length === 0) return;
    const prevIdx = (currentIndex - 1 + reels.length) % reels.length;
    setCurrentIndex(prevIdx);
    scrollToReelIndex(prevIdx, true);
  }, [currentIndex, reels.length, scrollToReelIndex]);

  useEffect(() => {
    if (!initialReelId || reels.length === 0) return;
    const matched = findReelByInicioParam(reels, initialReelId);
    const resolvedId = matched?.id || initialReelId;
    if (
      lastSeenInitialReelIdPropRef.current === initialReelId ||
      lastSeenInitialReelIdPropRef.current === resolvedId
    ) {
      return;
    }
    lastSeenInitialReelIdPropRef.current = resolvedId;
    lastReportedActiveReelIdRef.current = resolvedId;

    // If user already scrolled to this reel, do not programmatically scroll
    if (
      internalSwipedReelIdsRef.current.has(initialReelId) ||
      internalSwipedReelIdsRef.current.has(resolvedId)
    ) {
      internalSwipedReelIdsRef.current.delete(initialReelId);
      internalSwipedReelIdsRef.current.delete(resolvedId);
      return;
    }

    const idx = matched ? reels.findIndex((r) => r.id === matched.id) : -1;
    if (idx !== -1 && idx !== currentIndex) {
      setCurrentIndex(idx);
      scrollToReelIndex(idx, false);
    }
  }, [initialReelId, reels, currentIndex, scrollToReelIndex]);

  useEffect(() => {
    if (activeReelNotifyTimerRef.current) {
      clearTimeout(activeReelNotifyTimerRef.current);
    }
    activeReelNotifyTimerRef.current = setTimeout(() => {
      const activeReel = reels[currentIndex];
      if (!activeReel?.id) return;
      if (lastReportedActiveReelIdRef.current === activeReel.id) return;
      lastReportedActiveReelIdRef.current = activeReel.id;
      internalSwipedReelIdsRef.current.add(activeReel.id);
      onActiveReelChangeRef.current?.(activeReel.id);
    }, 150);

    return () => {
      if (activeReelNotifyTimerRef.current) {
        clearTimeout(activeReelNotifyTimerRef.current);
      }
    };
  }, [currentIndex, reels]);

  // Keyboard navigation (ArrowDown / ArrowUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments || showCartPanel || showHamburgerMenu) return;
      if (e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowUp") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, showComments, showCartPanel, showHamburgerMenu]);

  const handleProductSelect = onProductClick || onSelectProduct;
  const storeProfile = users.find((user) => isSuperAdmin(user)) ||
    (isSuperAdmin(currentUser) ? currentUser : undefined);
  const currentGuestToken = currentUser?.guestToken || getLocalGuestToken();
  const requireLoginForInteraction = (actionDescription: string) => {
    if (!isGuestUser(currentUser)) return false;
    if (onAuthRequired) {
      onAuthRequired(actionDescription);
    } else {
      navigateTo("/perfil/login");
    }
    return true;
  };

  const handleLikeClick = (reelItem: Reel) => {
    if (requireLoginForInteraction("dar me gusta")) return;

    const userIdentifier =
      currentUser?.originalId ||
      currentUser?.guestToken ||
      currentUser?.id ||
      currentGuestToken ||
      "current_user";

    const currentlyLiked = Boolean(
      reelItem.likedBy?.some(
        (id) =>
          id === currentUser?.originalId ||
          id === currentUser?.id ||
          id === currentUser?.username ||
          (currentGuestToken && id === currentGuestToken) ||
          id === userIdentifier
      )
    );

    const nextLikedBy = currentlyLiked
      ? (reelItem.likedBy || []).filter(
          (id) =>
            id !== currentUser?.originalId &&
            id !== currentUser?.id &&
            id !== currentUser?.username &&
            id !== currentGuestToken &&
            id !== userIdentifier
        )
      : [...(reelItem.likedBy || []), userIdentifier];

    const nextLikes = nextLikedBy.length;

    setLocalReelOverrides((prev) => ({
      ...prev,
      [reelItem.id]: {
        ...prev[reelItem.id],
        likes: nextLikes,
        likedBy: nextLikedBy,
      },
      ...(reelItem.productId
        ? {
            [reelItem.productId]: {
              ...prev[reelItem.productId],
              likes: nextLikes,
              likedBy: nextLikedBy,
            },
          }
        : {}),
    }));

    onLikeReel(reelItem.id);
  };

  const handleSaveClick = (reelItem: Reel) => {
    if (requireLoginForInteraction("guardar una publicación")) return;

    const currentlySaved =
      savedReelIds.includes(reelItem.id) ||
      (Boolean(reelItem.productId) && savedReelIds.includes(reelItem.productId!));

    const nextSaves = currentlySaved
      ? Math.max(0, (reelItem.saves ?? 0) - 1)
      : (reelItem.saves ?? 0) + 1;

    setLocalReelOverrides((prev) => ({
      ...prev,
      [reelItem.id]: {
        ...prev[reelItem.id],
        saves: nextSaves,
      },
      ...(reelItem.productId
        ? {
            [reelItem.productId]: {
              ...prev[reelItem.productId],
              saves: nextSaves,
            },
          }
        : {}),
    }));

    onToggleSaveReel(reelItem.id);
  };

  const handleDoubleTap = (reelItem: Reel) => {
    const isLiked = Boolean(
      reelItem.likedBy?.some(
        (id) =>
          id === currentUser?.originalId ||
          id === currentUser?.id ||
          id === currentUser?.username ||
          (currentGuestToken && id === currentGuestToken)
      )
    );
    if (!isLiked) {
      handleLikeClick(reelItem);
    }
    setHeartAnimReelId(reelItem.id);
    setTimeout(() => setHeartAnimReelId(null), 800);
  };

  const handleShare = async (reelToShare: Reel) => {
    if (requireLoginForInteraction("compartir una publicación")) return;
    const shareUrl = getInicioShareUrl(reelToShare);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: reelToShare.description || "Inicio",
          text: reelToShare.description,
          url: shareUrl,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText?.(shareUrl);
    }
  };

  const handleCreatorNav = (_reelItem: Reel) => {
    if (!storeProfile) return;
    if (onCreatorClick) {
      onCreatorClick(storeProfile.id);
    } else {
      onSelectUser?.(storeProfile);
    }
  };

  const activeCommentsReel =
    reels.find((r) => r.id === activeCommentsReelId) || reels[currentIndex] || reels[0];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentsReel) return;
    const commentFn = onAddComment || onCommentReel;
    const text = commentInput.trim();

    const optimisticComment: Comment = {
      id: "com_local_" + Date.now(),
      userId: currentUser?.originalId || currentUser?.id || currentGuestToken || "current_user",
      username:
        currentUser?.name && currentUser?.name !== "Invitado"
          ? currentUser.name
          : currentUser?.username || "Tú",
      avatar:
        currentUser?.avatar ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      text,
      createdAt: new Date().toISOString(),
    };

    setLocalReelOverrides((prev) => {
      const existingComments =
        prev[activeCommentsReel.id]?.comments || activeCommentsReel.comments || [];
      return {
        ...prev,
        [activeCommentsReel.id]: {
          ...prev[activeCommentsReel.id],
          comments: [...existingComments, optimisticComment],
        },
        ...(activeCommentsReel.productId
          ? {
              [activeCommentsReel.productId]: {
                ...prev[activeCommentsReel.productId],
                comments: [...existingComments, optimisticComment],
              },
            }
          : {}),
      };
    });

    if (commentFn) commentFn(activeCommentsReel.id, text);
    setCommentInput("");
  };

  if (!currentReel && reels.length === 0 && !selectedCategory) {
    if (isLoading) {
      return <InicioCargando />;
    }

    return <InicioSinContenido onRefreshReels={onRefreshReels} />;
  }

  return (
    <div
      className="relative w-full bg-white overflow-hidden flex flex-col font-sans select-none"
      style={{
        height: `calc(100dvh - ${actualNavHeight}px)`,
        minHeight: `calc(100dvh - ${actualNavHeight}px)`,
        maxHeight: `calc(100dvh - ${actualNavHeight}px)`,
        backgroundColor: "#ffffff",
      }}
      id="android-reels-view"
    >
      {/* Contenedor vertical con desplazamiento continuo */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full flex-1 overflow-y-scroll no-scrollbar relative bg-white"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          height: `calc(100dvh - ${actualNavHeight}px)`,
          touchAction: "pan-y",
          backgroundColor: "#ffffff",
        }}
        id="android-reels-scroll-container"
      >
        {/* Cabecera fija dentro del área de scroll respetando la barra de estado nativa (50px a partir de ella) */}
        <EncabezadoInicio
          currentUser={currentUser}
          totalCartCount={totalCartCount}
          totalUnreads={totalUnreads}
          unreadCount={unreadCount}
          onOpenMenu={() => setShowHamburgerMenu(true)}
          onOpenCart={() => setShowCartPanel(true)}
        />
        {activeBanner && (
          <BannerPrincipal banner={activeBanner} onNavigateToPath={onNavigateToPath} />
        )}
        <SeccionCategorias
          categories={menuCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => setSelectedCategory(category === "Todos" ? null : category)}
          getCategoryImage={(category) => {
            const normalized = category.trim().toLowerCase();
            return CATEGORIES_WITH_IMAGES.find((item) => item.name.trim().toLowerCase() === normalized)?.imageUrl
              || products.find((product) => product.category?.trim().toLowerCase() === normalized)?.imageUrl
              || products.find((product) => product.category?.trim().toLowerCase() === normalized)?.images?.[0];
          }}
        />
        {selectedCategory && reels.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-base font-bold text-slate-800">
              No hay productos en {selectedCategory}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Elige otra categoría desde el menú.
            </p>
          </div>
        )}
        <SeccionVideos
          reels={reels}
          tarjetaProps={{
            currentIndex,
            actualNavHeight,
            getReelMediaItems,
            carouselIndices,
            products,
            storeProfile,
            currentUser,
            currentGuestToken,
            savedReelIds,
            getEffectiveFormat,
            handleProductSelect,
            descriptionRefs,
            expandedDescriptions,
            setExpandedDescriptions,
            descriptionOverflow,
            mediaSliderRefs,
            handleMediaScroll,
            handleDoubleTap,
            playerRef,
            isMuted,
            isFeedActive,
            handleMuteChange,
            handleVideoReady,
            progressVideo,
            heartAnimReelId,
            handleCreatorNav,
            handleLikeClick,
            requireLoginForInteraction,
            setActiveCommentsReelId,
            setShowComments,
            handleSaveClick,
            handleShare,
            onLikeReel,
            onToggleSaveReel: onToggleSaveReel,
          }}
        />
      </div>
      <MovilHamburgerMenu
        isOpen={showHamburgerMenu}
        onOpen={() => setShowHamburgerMenu(true)}
        onClose={() => setShowHamburgerMenu(false)}
        currentUser={currentUser}
        totalUnreads={totalUnreads || unreadCount || 0}
        onNavigateToTab={onNavigateToTab}
        onRefreshReels={onRefreshReels}
        onNavigateToShop={onNavigateToShop}
        onNavigateToProfile={onNavigateToProfile}
        categories={menuCategories}
        onSelectCategory={(category) => setSelectedCategory(category === "Todos" ? null : category)}
      />
      <AnimatePresence>
        {showCartPanel && (
          <div
            className="fixed inset-0 z-[60] flex justify-end bg-black/30"
            onClick={() => setShowCartPanel(false)}
            onWheel={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="h-full w-full max-w-none overflow-hidden bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <CarritoTiendaView
                presentation="drawer"
                cart={cart}
                selectedCartIndices={selectedCartIndices}
                isAllCartSelected={isAllSelected}
                toggleSelectAllCart={toggleSelectAll}
                toggleSelectCartItem={toggleSelectCartItem}
                selectedCartItems={selectedCartItems}
                cartSubtotal={selectedCartSubtotal}
                cartShippingTotal={selectedCartShipping}
                cartTotal={selectedCartTotal}
                handleItemRemove={(index, item) => onRemoveFromCart?.(item.product.id, index)}
                handleItemQtyChange={(index, item, quantity) =>
                  onUpdateCartQuantity?.(item.product.id, quantity, index)
                }
                onSelectProduct={(product) => {
                  setShowCartPanel(false);
                  handleProductSelect?.(product);
                }}
                onProceedToCheckout={() => {
                  setShowCartPanel(false);
                  if (cart.length > 0) onNavigateToCheckout?.(selectedCartIndices);
                }}
                onCloseCart={() => setShowCartPanel(false)}
                onExploreProducts={() => {
                  setShowCartPanel(false);
                  onNavigateToShop?.();
                }}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Comments Sheet */}
      <AnimatePresence>
        {showComments && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full h-[70vh] max-h-[70vh] bg-white border-t border-slate-200 rounded-t-3xl flex flex-col overflow-hidden p-2 text-slate-900"
              style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">Comentarios ({activeCommentsReel?.comments?.length || 0})</span>
                <button onClick={() => setShowComments(false)} className="p-1 text-slate-500 hover:text-slate-900">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 space-y-2">
                {(!activeCommentsReel?.comments || activeCommentsReel.comments.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Aún no hay comentarios. ¡Sé el primero!
                  </div>
                ) : (
                  activeCommentsReel.comments.map((c, cIdx) => (
                    <div key={`${c.id || 'comment'}-${cIdx}`} className="flex space-x-3 text-xs">
                      <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div>
                        <span className="font-bold text-amber-600">@{c.username}</span>
                        <p className="text-slate-500 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="pt-1 border-t border-slate-200 flex items-center space-x-2 bg-white" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 3px)" }}>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="p-2 bg-amber-500 disabled:opacity-40 text-slate-950 rounded-xl font-bold active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
