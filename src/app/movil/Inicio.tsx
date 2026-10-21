import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Reel, ReelMedia, Product, User, Comment, CartItem, NavigationTab, isGuestUser } from "../../types";
import { Heart, MessageCircle, Share2, Bookmark, ShoppingBag, Volume2, VolumeX, Send, X, RefreshCw, Video } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovilVideoPlay, MovilVideoPlayHandle } from "./components/videoplay";
import { AndroidProgressBar } from "./components/barraprogreso";
import { MovilHamburgerButton, MovilHamburgerMenu } from "./components/menu";
import { CATEGORIES_WITH_IMAGES } from "./tienda/catalogo";
import { CarritoTiendaView } from "./tienda/carrito";
import { getMediaUrl } from "../../config";
import { getInicioShareUrl, findReelByInicioParam, navigateTo } from "../../router";
import { getLocalGuestToken } from "../../utils/guestToken";
import { formatPrice } from "../../utils/currency";

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
  onToggleFollowUser?: (creatorId: string) => void;
  isFeedActive?: boolean;
  onOpenSocial?: () => void;
  unreadCount?: number;
  totalUnreads?: number;
  onNavigateToTab?: (tab: NavigationTab) => void;
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
  onToggleFollowUser,
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
  const allReels = useMemo(() => {
    const productPublications = products
      .filter((product) => {
        if (!product.id) return false;
        return !publishedReels.some(
          (reel) =>
            reel.id === `reel_prod_${product.id}` ||
            (reel.type === "product" && reel.productId === product.id)
        );
      })
      .map((product): Reel => {
        const productImages = (product.images || []).filter(
          (image): image is string => typeof image === "string" && image.trim().length > 0
        );
        if (productImages.length === 0 && product.imageUrl) {
          productImages.push(product.imageUrl);
        }
        const productVideos = (product.videos || []).filter(
          (video): video is string => typeof video === "string" && video.trim().length > 0
        );
        const media: ReelMedia[] = [
          ...productVideos.map((url) => ({ type: "video" as const, url })),
          ...productImages.map((url) => ({ type: "image" as const, url })),
        ];
        const seller = users.find(
          (user) =>
            user.id === product.sellerId ||
            user.originalId === product.sellerId ||
            user.username === product.sellerUsername
        );
        const description = product.description || `${product.name} - ${formatPrice(Number(product.price) || 0)}`;

        return {
          id: `reel_prod_${product.id}`,
          type: "product",
          title: product.name,
          description,
          caption: description,
          creatorId: seller?.id || product.sellerId || "seller",
          creatorName: seller?.name || product.sellerName || "Vendedor",
          creatorUsername: seller?.username || product.sellerUsername,
          creatorAvatar:
            seller?.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          videoUrl: productVideos[0] || "",
          thumbnailUrl: product.imageUrl || productImages[0] || "",
          images: productImages,
          media,
          likes: 0,
          likedBy: [],
          comments: [],
          shares: 0,
          saves: 0,
          views: 0,
          productId: product.id,
          aspectRatio: "square",
        };
      });

    return [...publishedReels, ...productPublications];
  }, [publishedReels, products, users]);
  const menuCategories = useMemo(() => {
    const categories = ["Todos", ...CATEGORIES_WITH_IMAGES.map((category) => category.name)];
    for (const product of products) {
      const category = product.category?.trim();
      if (category && !categories.some((existing) => existing.toLowerCase() === category.toLowerCase())) {
        categories.push(category);
      }
    }
    return categories;
  }, [products]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const reels = useMemo(() => {
    if (!selectedCategory) return allReels;
    const normalizedCategory = selectedCategory.trim().toLowerCase();
    return allReels.filter((reel) => {
      const taggedProductId =
        reel.productId ||
        (reel as Reel & { taggedProductId?: string }).taggedProductId ||
        (reel.id.startsWith("reel_prod_") ? reel.id.slice("reel_prod_".length) : undefined);
      const taggedProduct =
        (reel as Reel & { product?: Product }).product ||
        products.find((product) => product.id === taggedProductId);
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
  const internalSwipedReelIdsRef = useRef<Set<string>>(new Set());
  const onActiveReelChangeRef = useRef(onActiveReelChange);
  onActiveReelChangeRef.current = onActiveReelChange;
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
      if (!cart || cart.length === 0) return [];
      const valid = prev.filter((i) => i < cart.length);
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
        setActualNavHeight(navEl.getBoundingClientRect().height || navEl.offsetHeight || 56);
      } else if (bottomNavHeight) {
        setActualNavHeight(bottomNavHeight);
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
  const mediaTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({});
  const [activeCommentsReelId, setActiveCommentsReelId] = useState<string | null>(null);
  const [heartAnimReelId, setHeartAnimReelId] = useState<string | null>(null);

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
    Object.values(descriptionRefs.current).forEach((element) => {
      if (element) observer?.observe(element);
    });
    window.addEventListener("resize", measureDescriptions);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureDescriptions);
    };
  }, [reels, expandedDescriptions]);

  const scrollToReelIndex = useCallback((targetIdx: number, smooth = true) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const card = container.children.item(targetIdx + 1);
    if (!(card instanceof HTMLElement)) return;
    const headerHeight = container.querySelector("header")?.getBoundingClientRect().height || 0;
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
    if (!containerRef.current) return;
    const container = containerRef.current;
    const headerHeight = container.querySelector("header")?.getBoundingClientRect().height || 0;
    const visiblePosition = container.scrollTop + headerHeight + 1;
    const cards = Array.from(container.children).slice(1);
    const visibleCardIndex = cards.findIndex((card) => {
      const element = card as HTMLElement;
      return element.offsetTop + element.offsetHeight > visiblePosition;
    });
    const newIdx = visibleCardIndex === -1 ? reels.length - 1 : visibleCardIndex;
    if (newIdx >= 0 && newIdx < reels.length && newIdx !== currentIndex) {
      setCurrentIndex(newIdx);
      if (newIdx >= reels.length - 2 && onRefreshReels) {
        onRefreshReels();
      }
    }
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
    if (lastSeenInitialReelIdPropRef.current === initialReelId) return;
    const matched = findReelByInicioParam(reels, initialReelId);
    const idx = matched ? reels.findIndex((r) => r.id === matched.id) : -1;
    if (idx !== -1) {
      lastSeenInitialReelIdPropRef.current = initialReelId;
      if (idx !== currentIndex) {
        setCurrentIndex(idx);
        scrollToReelIndex(idx, false);
      }
    }
  }, [initialReelId, reels, currentIndex, scrollToReelIndex]);

  useEffect(() => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;
    internalSwipedReelIdsRef.current.add(activeReel.id);
    onActiveReelChangeRef.current?.(activeReel.id);
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
  const currentGuestToken = currentUser?.guestToken || getLocalGuestToken();

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
      onLikeReel(reelItem.id);
    }
    setHeartAnimReelId(reelItem.id);
    setTimeout(() => setHeartAnimReelId(null), 800);
  };

  const handleShare = async (reelToShare: Reel) => {
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

  const handleCreatorNav = (reelItem: Reel) => {
    if (onCreatorClick) {
      onCreatorClick(reelItem.creatorId);
    } else if (onSelectUser) {
      const creator = users.find(
        (u) => u.id === reelItem.creatorId || u.username === reelItem.creatorUsername
      );
      if (creator) onSelectUser(creator);
    }
  };

  const activeCommentsReel =
    reels.find((r) => r.id === activeCommentsReelId) || reels[currentIndex] || reels[0];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentsReel) return;
    const commentFn = onAddComment || onCommentReel;
    if (commentFn) commentFn(activeCommentsReel.id, commentInput.trim());
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
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          height: `calc(100dvh - ${actualNavHeight}px)`,
          touchAction: "pan-y",
          backgroundColor: "#ffffff",
        }}
        id="android-reels-scroll-container"
      >
        {/* Cabecera fija dentro del área de scroll para que solo se reserve espacio una vez */}
        <header
          className="sticky top-0 inset-x-0 z-40 flex shrink-0 items-center justify-between px-4 bg-white border-b border-slate-100 shadow-2xs pointer-events-auto"
          style={{
            backgroundColor: "#ffffff",
            paddingTop: "max(12px, calc(env(safe-area-inset-top, 0px) + 0.5rem))",
            paddingBottom: "0.5rem",
          }}
          id="android-reels-fixed-header"
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
              className="relative p-2 rounded-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center pointer-events-auto"
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
        </header>
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
          const isProductPub = Boolean(
            reelItem.type === "product" ||
            reelItem.id?.startsWith("reel_prod_") ||
            reelItem.productId ||
            (reelItem as any)?.taggedProductId
          );

          const taggedProduct =
            (reelItem as any).product ||
            products.find((p) => p.id === (reelItem.productId || (reelItem as any).taggedProductId));

          const creatorUser = users.find(
            (u) =>
              (reelItem.creatorId && (u.id === reelItem.creatorId || u.originalId === reelItem.creatorId)) ||
              (reelItem.creatorUsername && u.username?.toLowerCase() === reelItem.creatorUsername?.toLowerCase())
          );
          const displayUsername =
            creatorUser?.username ||
            reelItem.creatorUsername ||
            (reelItem.creatorId === "current_user" ? currentUser?.username : "") ||
            "usuario";
          const displayAvatar =
            creatorUser?.avatar ||
            reelItem.creatorAvatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";

          const isLiked = Boolean(
            reelItem.likedBy?.some(
              (id) =>
                id === currentUser?.originalId ||
                id === currentUser?.id ||
                id === currentUser?.username ||
                (currentGuestToken && id === currentGuestToken)
            )
          );
          const isSaved = savedReelIds.includes(reelItem.id);
          const isFollowing = currentUser?.followingUserIds?.includes(reelItem.creatorId) || false;

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
              className="w-full shrink-0 relative flex flex-col items-center justify-start gap-2 bg-white overflow-hidden select-none px-0 pt-2"
              style={{
                backgroundColor: "#ffffff",
              }}
            >
              {/* Información del creador sobre la publicación */}
              <div className="mx-auto flex w-full max-w-xl shrink-0 items-center gap-3 px-1">
                <button
                  type="button"
                  onClick={() => handleCreatorNav(reelItem)}
                  className="shrink-0 rounded-full"
                  aria-label={`Ver perfil de @${displayUsername}`}
                >
                  <img src={displayAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleCreatorNav(reelItem)}
                    className="block max-w-full truncate text-left text-sm font-bold text-slate-900"
                  >
                    @{displayUsername}
                  </button>
                </div>
                {currentUser?.id !== reelItem.creatorId && onToggleFollowUser && (
                  <button
                    type="button"
                    onClick={() => onToggleFollowUser(reelItem.creatorId)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                      isFollowing ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                )}
              </div>
              {(reelItem.title || reelItem.description) && (
                <div className="mx-auto w-full max-w-xl shrink-0 px-2">
                  {reelItem.title && (
                    <h2 className="mb-1 text-base font-bold text-slate-900">{reelItem.title}</h2>
                  )}
                  {reelItem.description && (
                    <div className="relative">
                      <p
                        ref={(element) => {
                          descriptionRefs.current[reelItem.id] = element;
                        }}
                        className={`text-sm leading-5 text-slate-700 break-words ${
                          expandedDescriptions[reelItem.id] ? "" : "line-clamp-2"
                        }`}
                      >
                        {reelItem.description}
                        {expandedDescriptions[reelItem.id] && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDescriptions((previous) => ({
                                ...previous,
                                [reelItem.id]: false,
                              }))
                            }
                            className="ml-1 font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Ver menos
                          </button>
                        )}
                      </p>
                      {!expandedDescriptions[reelItem.id] && descriptionOverflow[reelItem.id] && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDescriptions((previous) => ({
                              ...previous,
                              [reelItem.id]: true,
                            }))
                          }
                          className="absolute bottom-0 right-0 bg-white pl-1 font-semibold leading-5 text-slate-500 hover:text-slate-800"
                        >
                          …más
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div
                id={`android-publication-container-${reelItem.id}`}
                className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-black shadow-sm transition-all duration-300 mx-auto select-none ${
                  isProductPub && taggedProduct && handleProductSelect ? "cursor-pointer" : ""
                }`}
                style={{ ...formatStyle, touchAction: "pan-y" }}
                onClick={(event) => {
                  if (!isProductPub || !taggedProduct || !handleProductSelect) return;
                  if (event.target instanceof Element && event.target.closest("button")) return;
                  handleProductSelect(taggedProduct);
                }}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (touch) mediaTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
                }}
                onTouchEnd={(event) => {
                  const start = mediaTouchStartRef.current;
                  const touch = event.changedTouches[0];
                  mediaTouchStartRef.current = null;
                  if (!start || !touch || reelMediaItems.length < 2) return;

                  const deltaX = touch.clientX - start.x;
                  const deltaY = touch.clientY - start.y;
                  if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

                  const nextIndex = activeMediaIdx + (deltaX < 0 ? 1 : -1);
                  if (nextIndex >= 0 && nextIndex < reelMediaItems.length) {
                    setCarouselIndices((previous) => ({ ...previous, [reelItem.id]: nextIndex }));
                  }
                }}
              >
                {reelMediaItems.length > 1 && (
                  <div
                    className="absolute right-3 top-3 z-30 flex items-center gap-1 bg-transparent text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                    aria-label={`Contenido ${activeMediaIdx + 1} de ${reelMediaItems.length}`}
                  >
                    <span className="font-mono font-black">{activeMediaIdx + 1}</span>
                    <span className="font-mono">/</span>
                    <span className="font-mono font-bold">{reelMediaItems.length}</span>
                  </div>
                )}
                {/* Media Player Container */}
                {isVideo ? (
                  <div className="w-full h-full overflow-hidden bg-black flex items-center justify-center">
                    {shouldPreload ? (
                      <MovilVideoPlay
                        key={`${reelItem.id}-${activeMediaIdx}`}
                        ref={isCurrent ? playerRef : undefined}
                        src={getMediaUrl(currentMedia.url)}
                        hlsUrl={getMediaUrl(currentMedia.hlsUrl || (currentMedia.url?.includes(".m3u8") ? currentMedia.url : reelItem.hlsUrl))}
                        poster={reelItem.thumbnailUrl ? getMediaUrl(reelItem.thumbnailUrl) : undefined}
                        autoPlay={isCurrent && isFeedActive}
                        loop={true}
                        muted={isMuted}
                        isCurrent={isCurrent && isFeedActive}
                        aspectRatio={effectiveFormat}
                        onDoubleTap={() => handleDoubleTap(reelItem)}
                        onMuteChange={handleMuteChange}
                        onVideoReady={isCurrent ? handleVideoReady : undefined}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                        <img
                          src={getMediaUrl(reelItem.thumbnailUrl || "")}
                          alt={reelItem.description || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Image / Carousel publication */
                  <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden bg-black">
                    <div
                      className="w-full h-full flex items-center justify-center bg-black overflow-hidden cursor-pointer"
                      onDoubleClick={() => handleDoubleTap(reelItem)}
                    >
                      <img
                        src={getMediaUrl(currentMedia?.url || reelItem.thumbnailUrl || (reelItem.images && reelItem.images[0]))}
                        alt={reelItem.description}
                        className="w-full h-full object-cover object-center block"
                        loading={reelIndex <= 2 ? "eager" : "lazy"}
                      />
                    </div>

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
                  <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-2 text-white shadow-lg backdrop-blur-sm">
                    <span className="text-sm font-bold">
                      {formatPrice(Number(taggedProduct.price) || 0)}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleProductSelect(taggedProduct);
                      }}
                      className="rounded-md bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-300"
                    >
                      Comprar
                    </button>
                  </div>
                )}
              </div>

              <div className="-mt-2 w-full max-w-xl shrink-0 border-y border-slate-300 px-2 py-1">
                <div
                  className="flex items-center justify-around"
                  id={`android-reel-interaction-bar-${reelItem.id}`}
                >
                  <button
                    type="button"
                    onClick={() => onLikeReel(reelItem.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 ${
                      isLiked ? "text-rose-600" : "text-slate-600"
                    }`}
                    id={`android-reel-like-btn-${reelItem.id}`}
                    aria-label={`Me gusta, ${reelItem.likes || 0}`}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>{reelItem.likes || 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCommentsReelId(reelItem.id);
                      setShowComments(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    id={`android-reel-comment-btn-${reelItem.id}`}
                    aria-label={`Comentar, ${reelItem.comments?.length || 0}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{reelItem.comments?.length || 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSaveReel(reelItem.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50 ${
                      isSaved ? "text-amber-600" : "text-slate-600"
                    }`}
                    id={`android-reel-save-btn-${reelItem.id}`}
                    aria-label={`Guardar, ${reelItem.saves ?? 0}`}
                  >
                    <Bookmark className={`h-5 w-5 ${isSaved ? "fill-amber-400" : ""}`} />
                    <span>{reelItem.saves ?? 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(reelItem)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    id={`android-reel-share-btn-${reelItem.id}`}
                    aria-label={`Compartir, ${reelItem.shares || 0}`}
                  >
                    <Share2 className="h-5 w-5" />
                    <span>{reelItem.shares || 0}</span>
                  </button>
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
                        @{displayUsername}
                      </span>
                      {currentUser?.id !== reelItem.creatorId && onToggleFollowUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onToggleFollowUser(reelItem.creatorId);
                          }}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer border bg-transparent backdrop-blur-sm pointer-events-auto ${
                            isFollowing
                              ? "text-white/80 border-white/60"
                              : "text-white border-white"
                          }`}
                        >
                          {isFollowing ? "Siguiendo" : "+ Seguir"}
                        </button>
                      )}
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
              className="h-full w-[92vw] max-w-[430px] overflow-hidden border-l border-slate-200 bg-white shadow-2xl"
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
