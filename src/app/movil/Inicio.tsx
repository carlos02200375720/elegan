import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Reel, ReelMedia, Product, User, Comment, CartItem, NavigationTab, isGuestUser } from "../../types";
import { Heart, MessageCircle, Share2, Bookmark, ShoppingBag, Volume2, VolumeX, Send, X, RefreshCw, Video, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovilVideoPlay, MovilVideoPlayHandle } from "./componente/videoplay";
import { AndroidProgressBar } from "./componente/barraprogreso";
import { MovilHamburgerButton, MovilHamburgerMenu } from "./componente/menu";
import { LikeButton } from "./componente/like";
import { ComentarioButton } from "./componente/comentario";
import { GuardadoButton } from "./componente/guardado";
import { ConpartilButton } from "./componente/conpartil";
import { CATEGORIES_WITH_IMAGES } from "./tienda/catalogo";
import { CarritoTiendaView } from "./tienda/carrito";
import { getMediaUrl, apiFetch } from "../../config";
import { getInicioShareUrl, findReelByInicioParam, navigateTo } from "../../router";
import { getLocalGuestToken } from "../../utils/guestToken";
import { formatPrice } from "../../utils/currency";
import { isSuperAdmin } from "../../superAdmin";

export interface AndroidInicioProps {
  reels: Reel[];
  currentUser: User;
  onLikeReel: (reelId: string) => void;
  onCommentReel?: (reelId: string, commentText: string) => void;
  onAddComment?: (reelId: string, commentText: string) => void;
  onSelectProduct?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  products?: Product[];
  onOpenPublishModal?: () => void;
  onToggleSaveReel: (reelId: string) => void;
  savedReelIds: string[];
  onSelectUser?: (user: User) => void;
  onCreatorClick?: (creatorId: string) => void;
  users?: User[];
  isFeedActive?: boolean;
  onOpenSocial?: () => void;
  unreadCount?: number;
  totalUnreads?: number;
  onNavigateToTab?: (tab: NavigationTab) => void;
  onNavigateToPath?: (path: string) => void;
  onAuthRequired?: (actionDescription?: string) => void;
  onGuestInteraction?: (action: string) => void;
  onRefreshReels?: () => void;
  isLoading?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  bottomNavHeight?: number;
  cart?: CartItem[];
  onRemoveFromCart?: (productId: string, idx?: number) => void;
  onUpdateCartQuantity?: (productId: string, qty: number, idx?: number) => void;
  onNavigateToShop?: () => void;
  onNavigateToCheckout?: (selectedIndices?: number[]) => void;
  onNavigateToProfile?: () => void;
  initialReelId?: string | null;
  onActiveReelChange?: (reelId: string) => void;
}

export type PublicationFormat = '1:1' | '3:4' | '4:3';

export const getPublicationFormatStyles = (format: PublicationFormat): React.CSSProperties => {
  switch (format) {
    case '1:1':
      return {
        aspectRatio: '1 / 1',
        width: '100%',
        maxWidth: 'min(100%, calc(100dvh - 200px))',
        maxHeight: 'calc(100dvh - 200px)',
      };
    case '3:4':
      return {
        aspectRatio: '3 / 4',
        height: '100%',
        maxHeight: 'calc(100dvh - 160px)',
        maxWidth: 'min(100%, calc((100dvh - 160px) * 3 / 4))',
        width: 'auto',
      };
    case '4:3':
      return {
        aspectRatio: '4 / 3',
        width: '100%',
        maxWidth: '100%',
        maxHeight: 'calc(100dvh - 220px)',
      };
  }
};

export const getMediaTokens = (url?: string): string[] => {
  if (!url || typeof url !== "string") return [];
  const clean = url.trim().split("?")[0];
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return [clean, last].filter(Boolean);
};

export const findProductForReel = (reel: Reel, productList: Product[]): Product | undefined => {
  if (!productList || productList.length === 0) return undefined;

  // 1. Direct ID link
  const directId =
    reel.productId ||
    (reel as any).taggedProductId ||
    ((reel as any).product?.id) ||
    (reel.id?.startsWith("reel_prod_") ? reel.id.slice("reel_prod_".length) : undefined);

  if (directId) {
    const matched = productList.find((p) => p.id === directId);
    if (matched) return matched;
  }

  // 2. Media URL matching
  const reelUrls = [
    reel.thumbnailUrl,
    reel.videoUrl,
    reel.hlsUrl,
    ...(Array.isArray(reel.images) ? reel.images : []),
    ...(Array.isArray(reel.media) ? reel.media.map((m) => m?.url) : []),
  ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);

  const reelTokens = new Set(reelUrls.flatMap(getMediaTokens));

  for (const prod of productList) {
    const prodUrls = [
      prod.imageUrl,
      ...(Array.isArray(prod.images) ? prod.images : []),
      ...(Array.isArray(prod.videos) ? prod.videos : []),
      ...(Array.isArray(prod.variantList) ? prod.variantList.map((v) => v.imageUrl) : []),
    ].filter((u): u is string => typeof u === "string" && u.trim().length > 0);

    const prodTokens = prodUrls.flatMap(getMediaTokens);
    if (prodTokens.some((token) => reelTokens.has(token))) {
      return prod;
    }
  }

  return undefined;
};

export const isDefaultDescription = (desc?: string | null): boolean => {
  if (!desc) return true;
  const trimmed = desc.trim();
  if (!trimmed) return true;
  if (/^uploaded via/i.test(trimmed)) return true;
  if (/^publicado v[ií]a/i.test(trimmed)) return true;
  if (/^publicaci[oó]n generada/i.test(trimmed)) return true;
  return false;
};

export const isFilenameTitle = (title?: string | null): boolean => {
  if (!title) return true;
  const trimmed = title.trim();
  return /\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$/i.test(trimmed);
};

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
      return (
        <div className="w-full h-screen bg-white flex flex-col items-center justify-center text-slate-800 p-6 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-800">Sincronizando Reels...</p>
          <p className="text-xs text-slate-500 mt-1">Conectando con la base de datos de videos</p>
        </div>
      );
    }

    return (
      <div className="w-full h-screen bg-white flex flex-col items-center justify-center text-slate-800 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-amber-500">
          <Video className="w-8 h-8" />
        </div>
        <p className="text-base font-bold text-slate-800">No hay publicaciones disponibles</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Aún no se han publicado reels o videos en la aplicación.
        </p>
        {onRefreshReels && (
          <button
            type="button"
            onClick={onRefreshReels}
            className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-transform shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        )}
      </div>
    );
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
        <header
          className="sticky top-0 inset-x-0 z-40 flex flex-col shrink-0 box-border justify-end bg-white border-t-0 border-b border-slate-200/80 pointer-events-auto"
          style={{
            height: "calc(50px + env(safe-area-inset-top, 0px))",
            minHeight: "calc(50px + env(safe-area-inset-top, 0px))",
            maxHeight: "calc(50px + env(safe-area-inset-top, 0px))",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
            backgroundColor: "#ffffff",
          }}
          id="android-reels-fixed-header"
        >
          <div
            className="relative mx-auto flex h-[50px] min-h-[50px] max-h-[50px] w-full max-w-md shrink-0 items-center justify-between px-5 bg-white border-t-0"
            style={{
              height: "50px",
              minHeight: "50px",
              maxHeight: "50px",
              backgroundColor: "#ffffff",
            }}
          >
            <h1
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-[calc(100%-10rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-base font-bold text-slate-900"
              title={currentUser?.name && !isGuestUser(currentUser) ? currentUser.name : "Inicio"}
            >
              {currentUser?.name?.trim() && !isGuestUser(currentUser) ? currentUser.name : "Inicio"}
            </h1>
            <div className="flex items-center space-x-2">
              <MovilHamburgerButton
                dark={true}
                onOpen={() => setShowHamburgerMenu(true)}
                totalUnreads={totalUnreads || unreadCount || 0}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCartPanel(true)}
                className="relative p-1.5 rounded-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center pointer-events-auto"
                id="android-reels-cart-btn"
                title="Ver carrito de compras"
                aria-label={`Ver carrito (${totalCartCount} productos)`}
              >
                <ShoppingBag className="w-5 h-5 text-slate-800" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-mono text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {totalCartCount > 99 ? "99+" : totalCartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        {activeBanner && (
          <section aria-label="Publicidad y promociones" className="w-full p-0">
            <a
              href={activeBanner.link || undefined}
              onClick={(event) => {
                if (!activeBanner.link) {
                  event.preventDefault();
                  return;
                }

                const link = activeBanner.link.trim();
                try {
                  const target = new URL(link, window.location.origin);
                  if (target.origin === window.location.origin) {
                    event.preventDefault();
                    const targetPath = `${target.pathname}${target.search}${target.hash}`;
                    if (onNavigateToPath) onNavigateToPath(targetPath);
                    else navigateTo(targetPath);
                  }
                } catch {
                  event.preventDefault();
                }
              }}
              className={`relative block aspect-[4/3] w-full overflow-hidden rounded-none bg-gradient-to-r from-slate-950 via-slate-800 to-amber-700 shadow-sm ${activeBanner.link ? "cursor-pointer" : "cursor-default"}`}
              aria-label={activeBanner.title}
            >
              {activeBanner.imageUrl && (
                <img src={getMediaUrl(activeBanner.imageUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
              <div className="absolute inset-0 z-10 flex flex-col justify-center overflow-y-auto px-4 py-3">
                <span className="mb-1 w-fit rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                  {activeBanner.label || "Promoción"}
                </span>
                <h2 className="max-w-full break-words text-base font-extrabold leading-tight text-white [overflow-wrap:anywhere]">{activeBanner.title}</h2>
                {activeBanner.description && (
                  <p className="mt-1 w-full max-w-full whitespace-normal break-words text-[11px] leading-snug text-white/90 [overflow-wrap:anywhere]">
                    {Array.from({ length: Math.ceil(Array.from(activeBanner.description).length / 30) }, (_, index) => (
                      <React.Fragment key={index}>
                        {Array.from(activeBanner.description).slice(index * 30, (index + 1) * 30).join("")}
                        {index < Math.ceil(Array.from(activeBanner.description).length / 30) - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                )}
              </div>
            </a>
          </section>
        )}
        <section aria-label="Categorías" className="w-full px-3 pt-3 pb-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Categorías</h2>
            <span className="text-[10px] text-slate-500">Desliza para ver más</span>
          </div>
          <div className="flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menuCategories.map((category) => {
              const categoryImage = CATEGORIES_WITH_IMAGES.find(
                (item) => item.name.trim().toLowerCase() === category.trim().toLowerCase()
              )?.imageUrl || products.find(
                (product) => product.category?.trim().toLowerCase() === category.trim().toLowerCase()
              )?.imageUrl || products.find(
                (product) => product.category?.trim().toLowerCase() === category.trim().toLowerCase()
              )?.images?.[0];
              const isActive = (selectedCategory || "Todos").toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category === "Todos" ? null : category)}
                  aria-pressed={isActive}
                  className={`flex min-w-0 flex-[0_0_calc((100%-24px)/4)] flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition-colors ${isActive ? "bg-amber-50" : "bg-transparent"}`}
                >
                  <span className={`flex aspect-[9/19] w-full items-center justify-center overflow-hidden rounded-xl border-2 bg-slate-100 ${isActive ? "border-amber-500" : "border-slate-200"}`}>
                    {categoryImage ? (
                      <img src={getMediaUrl(categoryImage)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-slate-400">{category.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-semibold text-slate-700">{category}</span>
                </button>
              );
            })}
          </div>
        </section>
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
        {reels.map((reelItem, reelIndex) => {
          const isCurrent = reelIndex === currentIndex;
          const shouldPreload = isCurrent || Math.abs(reelIndex - currentIndex) <= 1;
          const reelMediaItems = getReelMediaItems(reelItem);
          const activeMediaIdx = carouselIndices[reelItem.id] || 0;
          const currentMedia = reelMediaItems[activeMediaIdx] || reelMediaItems[0];
          const isVideo = currentMedia?.type === "video" && !!currentMedia.url;
          const taggedProduct =
            findProductForReel(reelItem, products) || (reelItem as any).product;
          const isProductPub = Boolean(
            taggedProduct ||
            reelItem.type === "product" ||
            reelItem.id?.startsWith("reel_prod_") ||
            reelItem.productId ||
            (reelItem as any)?.taggedProductId
          );

          const rawDesc =
            (taggedProduct?.description && !isDefaultDescription(taggedProduct.description)
              ? taggedProduct.description
              : "") ||
            (reelItem.description && !isDefaultDescription(reelItem.description)
              ? reelItem.description
              : "");
          const publicationDescription = isDefaultDescription(rawDesc) ? "" : rawDesc.trim();

          const displayTitle =
            taggedProduct?.name ||
            (reelItem.title && !isFilenameTitle(reelItem.title) ? reelItem.title.trim() : "");

          const displayUsername = storeProfile?.username?.trim() || "elegan";
          const displayName = storeProfile?.name?.trim() || "Elegan";
          const displayAvatar = storeProfile?.avatar?.trim() || "";

          const isLiked = Boolean(
            reelItem.likedBy?.some(
              (id) =>
                id === currentUser?.originalId ||
                id === currentUser?.id ||
                id === currentUser?.username ||
                (currentGuestToken && id === currentGuestToken)
            )
          );
          const isSaved =
            savedReelIds.includes(reelItem.id) ||
            (Boolean(taggedProduct?.id) && savedReelIds.includes(taggedProduct!.id)) ||
            (Boolean(reelItem.productId) && savedReelIds.includes(reelItem.productId!));

          const effectiveFormat = getEffectiveFormat(reelItem);
          const mediaMaxHeight = `calc(100dvh - ${actualNavHeight + 300}px)`;
          const formatStyle: React.CSSProperties = {
            aspectRatio: effectiveFormat.replace(":", " / "),
            width: "100%",
            maxWidth: "100%",
            maxHeight: mediaMaxHeight,
            ...(effectiveFormat === "3:4" ? { height: mediaMaxHeight } : {}),
          };

          return (
            <div
              key={reelItem.id || reelIndex}
              id={`android-reel-card-${reelItem.id}`}
              className={`w-full shrink-0 relative flex flex-col items-center justify-start gap-2 bg-white overflow-hidden select-none px-0 pt-2 ${
                isProductPub && taggedProduct && handleProductSelect ? "cursor-pointer" : ""
              }`}
              style={{
                backgroundColor: "#ffffff",
              }}
              onClick={(event) => {
                if (!isProductPub || !taggedProduct || !handleProductSelect) return;
                if (event.target instanceof Element && event.target.closest("button, a, input, textarea")) return;
                handleProductSelect(taggedProduct);
              }}
            >
              {/* Información del creador sobre la publicación y precio en esquina superior derecha */}
              <div className="mx-auto flex w-full max-w-xl shrink-0 items-center justify-between gap-3 px-1">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCreatorNav(reelItem)}
                    className="shrink-0 rounded-full"
                    aria-label={`Ver perfil de ${displayName}`}
                  >
                    <img
                      src={displayAvatar}
                      alt={reelItem.creatorName || displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 max-w-full items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCreatorNav(reelItem)}
                        className="min-w-0 truncate text-left text-sm font-bold text-slate-900"
                      >
                        {displayName}
                      </button>
                      <BadgeCheck
                        size={18}
                        className="shrink-0"
                        fill="#2563eb"
                        color="#ffffff"
                        strokeWidth={2.5}
                        aria-label="Cuenta verificada"
                      />
                    </div>
                  </div>
                </div>

                {taggedProduct && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-slate-900">
                    {formatPrice(Number(taggedProduct.price) || 0)}
                  </span>
                )}
              </div>

              {/* Título del producto cuando corresponde a un producto */}
              {displayTitle && (
                <div className="mx-auto w-full max-w-xl shrink-0 px-2 pt-0.5">
                  <p
                    onClick={(e) => {
                      if (isProductPub && taggedProduct && handleProductSelect) {
                        e.stopPropagation();
                        handleProductSelect(taggedProduct);
                      }
                    }}
                    className={`text-sm font-bold text-slate-900 truncate ${
                      isProductPub && taggedProduct && handleProductSelect
                        ? "cursor-pointer hover:text-amber-600 transition-colors"
                        : ""
                    }`}
                    title={displayTitle}
                  >
                    {displayTitle}
                  </p>
                </div>
              )}

              {publicationDescription && (
                <div className="mx-auto w-full max-w-xl shrink-0 px-2">
                  <div className="relative">
                    <p
                      ref={(element) => {
                        descriptionRefs.current[reelItem.id] = element;
                      }}
                      className={`text-sm leading-5 text-slate-700 break-words ${
                        expandedDescriptions[reelItem.id] ? "" : "line-clamp-2"
                      }`}
                    >
                      {publicationDescription}
                      {expandedDescriptions[reelItem.id] && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setExpandedDescriptions((previous) => ({
                              ...previous,
                              [reelItem.id]: false,
                            }));
                          }}
                          className="ml-1 font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Ver menos
                        </button>
                      )}
                    </p>
                    {!expandedDescriptions[reelItem.id] && descriptionOverflow[reelItem.id] && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedDescriptions((previous) => ({
                            ...previous,
                            [reelItem.id]: true,
                          }));
                        }}
                        className="absolute bottom-0 right-0 bg-white pl-1 font-semibold leading-5 text-slate-500 hover:text-slate-800"
                      >
                        …más
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div
                id={`android-publication-container-${reelItem.id}`}
                className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-black shadow-none transition-all duration-300 mx-auto select-none ${
                  isProductPub && taggedProduct && handleProductSelect ? "cursor-pointer" : ""
                }`}
                style={{ ...formatStyle, touchAction: "pan-x pan-y", boxShadow: "none" }}
                onClick={(event) => {
                  if (!isProductPub || !taggedProduct || !handleProductSelect) return;
                  if (event.target instanceof Element && event.target.closest("button, a, input, textarea")) return;
                  handleProductSelect(taggedProduct);
                }}
              >
                {/* Horizontal Scroll Gallery Slider - exactly like productoid.tsx */}
                <div
                  ref={(el) => {
                    mediaSliderRefs.current[reelItem.id] = el;
                  }}
                  onScroll={(e) =>
                    handleMediaScroll(reelItem.id, e.currentTarget, reelMediaItems.length)
                  }
                  className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-x pan-y",
                  }}
                >
                  {reelMediaItems.map((mediaItem, mediaIdx) => {
                    const isThisVideo = mediaItem.type === "video" && Boolean(mediaItem.url);
                    const isThisActive = isCurrent && activeMediaIdx === mediaIdx;

                    return (
                      <div
                        key={`${reelItem.id}-media-${mediaIdx}`}
                        className={`w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-black overflow-hidden select-none ${
                          isProductPub && taggedProduct && handleProductSelect ? "cursor-pointer" : ""
                        }`}
                        onClick={(event) => {
                          if (!isProductPub || !taggedProduct || !handleProductSelect) return;
                          if (event.target instanceof Element && event.target.closest("button, a, input, textarea")) return;
                          handleProductSelect(taggedProduct);
                        }}
                        onDoubleClick={() => handleDoubleTap(reelItem)}
                      >
                        {isThisVideo ? (
                          <div className="w-full h-full overflow-hidden bg-black flex items-center justify-center">
                            {shouldPreload ? (
                              <MovilVideoPlay
                                key={`${reelItem.id}-${mediaIdx}`}
                                ref={isThisActive ? playerRef : undefined}
                                src={getMediaUrl(mediaItem.url)}
                                hlsUrl={getMediaUrl(
                                  mediaItem.hlsUrl ||
                                    (mediaItem.url?.includes(".m3u8")
                                      ? mediaItem.url
                                      : reelItem.hlsUrl)
                                )}
                                poster={
                                  reelItem.thumbnailUrl
                                    ? getMediaUrl(reelItem.thumbnailUrl)
                                    : undefined
                                }
                                autoPlay={isThisActive && isFeedActive}
                                loop={true}
                                muted={isMuted}
                                isCurrent={isThisActive && isFeedActive}
                                aspectRatio={effectiveFormat}
                                onDoubleTap={() => handleDoubleTap(reelItem)}
                                onMuteChange={handleMuteChange}
                                onVideoReady={isThisActive ? handleVideoReady : undefined}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black">
                                <img
                                  src={getMediaUrl(reelItem.thumbnailUrl || mediaItem.url || "")}
                                  alt={reelItem.description || ""}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
                            <img
                              src={getMediaUrl(
                                mediaItem.url ||
                                  reelItem.thumbnailUrl ||
                                  (reelItem.images && reelItem.images[0]) ||
                                  ""
                              )}
                              alt={reelItem.description || ""}
                              className="w-full h-full object-cover object-center block"
                              loading={reelIndex <= 2 && mediaIdx === 0 ? "eager" : "lazy"}
                              draggable={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Media Counter Badge in Top-Right Corner */}
                {reelMediaItems.length > 1 && (
                  <div
                    className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-xl bg-black/40 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm pointer-events-none select-none"
                    aria-label={`Contenido ${activeMediaIdx + 1} de ${reelMediaItems.length}`}
                  >
                    <span className="font-mono font-black text-amber-400">
                      {activeMediaIdx + 1}
                    </span>
                    <span className="font-mono text-white/80">/</span>
                    <span className="font-mono font-bold text-white">
                      {reelMediaItems.length}
                    </span>
                  </div>
                )}

                {/* Progress Bar for active video publication */}
                {isCurrent && isVideo && (
                  <AndroidProgressBar
                    video={progressVideo}
                    isActive={isFeedActive}
                    bottomOffset={0}
                  />
                )}

                {/* Heart animation on double tap */}
                <AnimatePresence>
                  {heartAnimReelId === reelItem.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.3, opacity: 1 }}
                      exit={{ scale: 1.8, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute z-40 pointer-events-none text-rose-500"
                    >
                      <Heart className="w-24 h-24 fill-rose-500 drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {isProductPub && taggedProduct && handleProductSelect && (
                  <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded-full bg-black/30 px-1.5 py-1 text-white shadow-lg backdrop-blur-sm">
                    <span className="text-[11px] font-bold">
                      {formatPrice(Number(taggedProduct.price) || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleProductSelect(taggedProduct);
                      }}
                      className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 hover:bg-amber-300"
                    >
                      Comprar
                    </button>
                  </div>
                )}
              </div>

              <div className="-mt-2 w-full max-w-xl shrink-0 border-b-2 border-slate-300 px-2 py-1">
                <div
                  className="flex items-center justify-around"
                  id={`android-reel-interaction-bar-${reelItem.id}`}
                >
                  <LikeButton
                    reelId={reelItem.id}
                    likes={reelItem.likes || 0}
                    isLiked={isLiked}
                    onClick={() => {
                      handleLikeClick(reelItem);
                    }}
                  />
                  <ComentarioButton
                    reelId={reelItem.id}
                    commentsCount={reelItem.comments?.length || 0}
                    onClick={() => {
                      if (requireLoginForInteraction("comentar una publicación")) return;
                      setActiveCommentsReelId(reelItem.id);
                      setShowComments(true);
                    }}
                  />
                  <GuardadoButton
                    reelId={reelItem.id}
                    savesCount={reelItem.saves ?? 0}
                    isSaved={isSaved}
                    onClick={() => {
                      handleSaveClick(reelItem);
                    }}
                  />
                  <ConpartilButton
                    reelId={reelItem.id}
                    sharesCount={reelItem.shares || 0}
                    onClick={() => handleShare(reelItem)}
                  />
                </div>
              </div>

              {/* Interaction Bar on the Right */}
              <div
                className="hidden"
                aria-hidden="true"
              >
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleCreatorNav(reelItem)}
                    className="relative rounded-full transform hover:scale-110 active:scale-95 transition-transform cursor-pointer drop-shadow-sm pointer-events-auto"
                    id={`android-mobile-creator-avatar-btn-${reelItem.id}`}
                  >
                    <img
                      src={displayAvatar}
                      alt={displayUsername}
                      className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full object-cover"
                    />
                  </button>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => onLikeReel(reelItem.id)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-115 active:scale-95 transition-all cursor-pointer shadow-md pointer-events-auto ${
                      isLiked ? "text-rose-500" : "text-white hover:text-rose-400"
                    }`}
                    data-legacy-id={`android-reel-like-btn-${reelItem.id}`}
                  >
                    <Heart
                      strokeWidth={2.2}
                      className={`w-6 h-6 scale-x-110 ${
                        isLiked
                          ? "fill-rose-500 text-rose-500 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                          : "fill-white text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                      }`}
                    />
                  </button>
                  <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {reelItem.likes || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setActiveCommentsReelId(reelItem.id);
                      setShowComments(true);
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:text-amber-400 hover:scale-115 active:scale-95 transition-all cursor-pointer shadow-md pointer-events-auto"
                    data-legacy-id={`android-reel-comment-btn-${reelItem.id}`}
                  >
                    <MessageCircle
                      strokeWidth={2.2}
                      className="w-6 h-6 scale-x-110 fill-white text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                    />
                  </button>
                  <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {reelItem.comments?.length || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => onToggleSaveReel(reelItem.id)}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-115 active:scale-95 transition-all cursor-pointer shadow-md pointer-events-auto ${
                      isSaved ? "text-amber-400" : "text-white hover:text-amber-300"
                    }`}
                    data-legacy-id={`android-reel-save-btn-${reelItem.id}`}
                  >
                    <Bookmark
                      strokeWidth={2.2}
                      className={`w-6 h-6 scale-x-110 ${
                        isSaved
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                          : "fill-white text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                      }`}
                    />
                  </button>
                  <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {reelItem.saves ?? 0}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleShare(reelItem)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white hover:text-cyan-400 hover:scale-115 active:scale-95 transition-all cursor-pointer shadow-md pointer-events-auto"
                    data-legacy-id={`android-reel-share-btn-${reelItem.id}`}
                  >
                    <Share2
                      strokeWidth={2.2}
                      className="w-6 h-6 scale-x-110 fill-white text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
                    />
                  </button>
                  <span className="text-white text-xs font-bold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {reelItem.shares || 0}
                  </span>
                </div>
              </div>

              {/* Creator & Description Overlay */}
              <div className="hidden">
                <div className="max-w-[calc(100%-10px)]">
                  <div className="text-white bg-black/40 backdrop-blur-md p-3 rounded-2xl drop-shadow-md border border-white/10 pointer-events-auto">
                    <h3 className="font-display font-bold text-base tracking-wide flex items-center space-x-2.5">
                      <span
                        onClick={() => handleCreatorNav(reelItem)}
                        className="cursor-pointer hover:underline text-white font-bold drop-shadow-sm pointer-events-auto"
                      >
                        {displayName}
                      </span>
                    </h3>
                    {reelItem.description && (
                      <p
                        className={`text-sm text-white/95 font-medium mt-1.5 leading-relaxed drop-shadow-sm pointer-events-auto break-words ${
                          expandedDescriptions[reelItem.id]
                            ? "whitespace-pre-line max-h-40 overflow-y-auto no-scrollbar"
                            : ""
                        }`}
                      >
                        {reelItem.description.length > 25 && !expandedDescriptions[reelItem.id] ? (
                          <>
                            <span>{reelItem.description.slice(0, 25)}...</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setExpandedDescriptions((prev) => ({
                                  ...prev,
                                  [reelItem.id]: true,
                                }));
                              }}
                              className="font-bold text-white hover:text-amber-400 cursor-pointer pointer-events-auto transition-colors"
                            >
                              mas
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{reelItem.description}</span>
                            {reelItem.description.length > 25 &&
                              expandedDescriptions[reelItem.id] && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setExpandedDescriptions((prev) => ({
                                      ...prev,
                                      [reelItem.id]: false,
                                    }));
                                  }}
                                  className="font-bold text-white/75 hover:text-amber-400 cursor-pointer pointer-events-auto transition-colors ml-1.5 text-xs"
                                >
                                  menos
                                </button>
                              )}
                          </>
                        )}
                      </p>
                    )}

                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
