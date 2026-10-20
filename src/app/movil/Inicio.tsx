import React, { useState, useRef, useEffect, useCallback } from "react";
import { Reel, ReelMedia, Product, User, Comment, CartItem, NavigationTab, isGuestUser } from "../../types";
import { Heart, MessageCircle, Share2, Bookmark, ShoppingBag, Volume2, VolumeX, Plus, Send, X, RefreshCw, Video, Minus, Trash2, CreditCard, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MovilVideoPlay, MovilVideoPlayHandle } from "./components/videoplay";
import { AndroidProgressBar } from "./components/barraprogreso";
import { MovilHamburgerButton, MovilHamburgerMenu } from "./components/menu";
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
  reels,
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
  const [publicationFormats, setPublicationFormats] = useState<Record<string, PublicationFormat>>({});

  const getEffectiveFormat = (item: Reel): PublicationFormat => {
    if (publicationFormats[item.id]) {
      return publicationFormats[item.id];
    }
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
  const selectedCartTotal = selectedCartItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 1);
  }, 0);
  const totalCartCount = (cart || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = selectedCartTotal;

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
  const currentMediaItems = getReelMediaItems(currentReel);
  const currentActiveMediaIdx = carouselIndices[currentReel?.id] || 0;

  const scrollToReelIndex = useCallback((targetIdx: number, smooth = true) => {
    if (!containerRef.current) return;
    const ch = containerRef.current.clientHeight;
    if (ch > 0) {
      containerRef.current.scrollTo({
        top: targetIdx * ch,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight <= 0) return;
    const newIdx = Math.round(scrollTop / clientHeight);
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

  if (!currentReel && reels.length === 0) {
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
      {/* Cabecera fija con fondo blanco que se acopla con la barra de estado de Android */}
      <header
        className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 bg-white border-b border-slate-100 shadow-2xs pointer-events-auto"
        style={{
          backgroundColor: "#ffffff",
          paddingTop: "max(12px, calc(env(safe-area-inset-top, 0px) + 0.5rem))",
          paddingBottom: "0.5rem",
        }}
        id="android-reels-fixed-header"
      >
        <div className="flex items-center space-x-2">
          <MovilHamburgerButton
            dark={true}
            onOpen={() => setShowHamburgerMenu(true)}
            totalUnreads={totalUnreads || unreadCount || 0}
          />
        </div>
        <div className="flex items-center space-x-2">
          {currentMediaItems.length > 1 && (
            <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs">
              <span className="text-amber-600 font-mono font-black">{currentActiveMediaIdx + 1}</span>
              <span className="text-slate-400 font-mono">/</span>
              <span className="text-slate-700 font-mono font-bold">{currentMediaItems.length}</span>
            </div>
          )}
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

      {/* Contenedor vertical deslizable como en catálogo (Continuous Vertical Snap-Scroll Feed) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar relative bg-white"
        style={{
          scrollbarWidth: "none",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          height: `calc(100dvh - ${actualNavHeight}px)`,
          touchAction: "pan-y",
          backgroundColor: "#ffffff",
        }}
        id="android-reels-scroll-container"
      >
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
              className="w-full shrink-0 snap-start snap-always relative flex flex-col items-center justify-start gap-2 bg-white overflow-hidden select-none px-0 pt-[76px] pb-2"
              style={{
                height: `calc(100dvh - ${actualNavHeight}px)`,
                minHeight: `calc(100dvh - ${actualNavHeight}px)`,
                maxHeight: `calc(100dvh - ${actualNavHeight}px)`,
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
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
              <div
                id={`android-publication-container-${reelItem.id}`}
                className="relative flex shrink-0 items-center justify-center overflow-hidden bg-black shadow-sm transition-all duration-300 mx-auto select-none"
                style={formatStyle}
              >
                {/* Selector interactivo de formatos: Formato 1 (1:1), Formato 2 (3:4), Formato 3 (4:3) */}
                <div className="absolute top-2.5 left-2.5 z-30 flex items-center bg-black/65 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-md pointer-events-auto">
                  <span className="text-[10px] text-white/80 font-bold px-1 select-none">Formato:</span>
                  {(['1:1', '3:4', '4:3'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setPublicationFormats((prev) => ({ ...prev, [reelItem.id]: fmt }));
                      }}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                        effectiveFormat === fmt
                          ? 'bg-white text-slate-950 shadow-sm scale-105'
                          : 'text-white/75 hover:text-white hover:bg-white/20'
                      }`}
                      title={`Cambiar a formato ${fmt}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

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

                    {/* Carousel lateral buttons */}
                    {reelMediaItems.length > 1 && (
                      <>
                        {activeMediaIdx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCarouselIndices((prev) => ({
                                ...prev,
                                [reelItem.id]: Math.max(0, activeMediaIdx - 1),
                              }));
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white backdrop-blur-xs flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer pointer-events-auto shadow-md"
                            aria-label="Foto anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {activeMediaIdx < reelMediaItems.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCarouselIndices((prev) => ({
                                ...prev,
                                [reelItem.id]: Math.min(reelMediaItems.length - 1, activeMediaIdx + 1),
                              }));
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white backdrop-blur-xs flex items-center justify-center hover:bg-black/70 transition-all cursor-pointer pointer-events-auto shadow-md"
                            aria-label="Siguiente foto"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
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
              </div>

              <div className="w-full max-w-xl shrink-0 border-y border-slate-100 px-2 py-1">
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

              <div className="w-full max-w-xl min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                {reelItem.title && (
                  <h2 className="mb-1 text-base font-bold text-slate-900">{reelItem.title}</h2>
                )}
                {reelItem.description && (
                  <p className="text-sm leading-5 text-slate-700 break-words">
                    {expandedDescriptions[reelItem.id]
                      ? reelItem.description
                      : reelItem.description.length > 140
                        ? `${reelItem.description.slice(0, 140)}...`
                        : reelItem.description}
                    {reelItem.description.length > 140 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDescriptions((prev) => ({
                            ...prev,
                            [reelItem.id]: !prev[reelItem.id],
                          }))
                        }
                        className="ml-1 font-semibold text-slate-500 hover:text-slate-800"
                      >
                        {expandedDescriptions[reelItem.id] ? "Ver menos" : "Ver más"}
                      </button>
                    )}
                  </p>
                )}
                {taggedProduct && handleProductSelect && (
                  <button
                    type="button"
                    onClick={() => handleProductSelect(taggedProduct)}
                    className="mt-2 flex w-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-left hover:bg-slate-50"
                    id={`tagged-product-${reelItem.id}`}
                  >
                    {taggedProduct.imageUrl || taggedProduct.images?.[0] ? (
                      <img
                        src={taggedProduct.imageUrl || taggedProduct.images?.[0]}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-amber-500">
                        <ShoppingBag className="h-5 w-5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-600">
                        Producto destacado
                      </span>
                      <span className="block truncate text-sm font-semibold text-slate-900">{taggedProduct.name}</span>
                      <span className="text-xs font-bold text-emerald-700">
                        {formatPrice(Number(taggedProduct.price) || 0)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-amber-700">Ver</span>
                  </button>
                )}
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

                    {/* Tarjeta de producto con fondo blanco */}
                    {taggedProduct && handleProductSelect && (
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => handleProductSelect(taggedProduct)}
                        className="bg-white border border-slate-200/90 text-slate-900 rounded-xl flex items-stretch cursor-pointer hover:bg-slate-50 hover:border-amber-400 active:scale-[0.98] transition-all shadow-xl overflow-hidden pointer-events-auto select-none mt-2"
                        data-legacy-id={`tagged-product-${reelItem.id}`}
                        style={{
                          marginLeft: "-4px",
                          width: "285.606px",
                          maxWidth: "100%",
                          height: "68.3438px",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <div className="w-20 shrink-0 h-full relative overflow-hidden bg-slate-100 border-r border-slate-200">
                          {taggedProduct.imageUrl || taggedProduct.images?.[0] ? (
                            <img
                              src={taggedProduct.imageUrl || taggedProduct.images?.[0]}
                              alt={taggedProduct.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-amber-500">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-between bg-white">
                          <span className="text-[9.5px] uppercase tracking-wider font-bold text-amber-600 flex items-center">
                            <ShoppingBag className="w-2.5 h-2.5 mr-1 shrink-0 text-amber-600" />
                            Producto Destacado
                          </span>
                          <h4 className="text-xs font-bold truncate text-slate-900">
                            {taggedProduct.name}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-emerald-600 font-mono">
                              {formatPrice(Number(taggedProduct.price) || 0)}
                            </span>
                            <span className="text-[9px] text-amber-600 font-bold hover:underline">
                              Ver detalles →
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Left Cart Side Panel */}
      <AnimatePresence>
        {showCartPanel && (
          <div
            className="fixed inset-0 z-[60] flex items-stretch"
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <motion.aside
              initial={{ x: -360, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -360, opacity: 0.8 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              className="w-[86vw] max-w-[380px] h-full bg-white text-slate-900 shadow-2xl border-r border-slate-200 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col border-b border-slate-200 bg-amber-50 px-4 py-3 gap-2" style={{ paddingTop: "max(14px, env(safe-area-inset-top))" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-black text-slate-900">Carrito</span>
                    {cart.length > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950">
                        {selectedCartIndices.length}/{cart.length}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowCartPanel(false)} className="p-1 rounded-full hover:bg-slate-100 cursor-pointer">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {cart.length > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-amber-700 transition-colors cursor-pointer select-none"
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                          isAllSelected
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : selectedCartIndices.length > 0
                            ? "bg-amber-200 text-amber-900"
                            : "border border-slate-300 bg-white"
                        }`}
                      >
                        {isAllSelected ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : selectedCartIndices.length > 0 ? (
                          <div className="w-1.5 h-1.5 bg-amber-900 rounded-xs" />
                        ) : null}
                      </div>
                      <span className="text-[11px]">
                        {isAllSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                      </span>
                    </button>
                    <span className="text-[10.5px] font-extrabold text-amber-800">
                      {selectedCartIndices.length} para pagar
                    </span>
                  </div>
                )}
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 py-3 overscroll-contain"
                style={{ touchAction: "pan-y" }}
                onWheel={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                    <ShoppingBag className="w-10 h-10 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-700">Tu carrito está vacío</p>
                    <p className="text-xs mt-1">Agrega artículos desde la tienda.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, idx) => {
                      const isSelected = selectedCartIndices.includes(idx);
                      const shippingFee =
                        item.selectedShippingCost !== undefined
                          ? Number(item.selectedShippingCost)
                          : Number(item.product.shippingCost ?? 0);
                      const carrierName = item.selectedCarrier || item.product.selectedCarrier;

                      return (
                        <div
                          key={`${item.product.id}-${idx}`}
                          className={`flex items-stretch rounded-2xl border transition-all shadow-sm overflow-hidden h-28 shrink-0 relative ${
                            isSelected
                              ? "bg-amber-500/[0.04] border-amber-400/80 shadow-amber-500/10 ring-1 ring-amber-400/40"
                              : "bg-slate-50/70 border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="w-24 sm:w-28 shrink-0 relative bg-slate-200 h-full overflow-hidden">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                              onClick={() => {
                                setShowCartPanel(false);
                                if (handleProductSelect) handleProductSelect(item.product);
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4
                                  className="text-xs font-extrabold text-slate-900 truncate cursor-pointer hover:text-amber-600 transition-colors"
                                  title={item.product.name}
                                  onClick={() => {
                                    setShowCartPanel(false);
                                    if (handleProductSelect) handleProductSelect(item.product);
                                  }}
                                >
                                  {item.product.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onRemoveFromCart) onRemoveFromCart(item.product.id, idx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 -mt-1 -mr-1"
                                  title="Eliminar del carrito"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-xs font-mono font-extrabold text-amber-600">
                                  {formatPrice(item.product.price)}
                                </span>
                                <span className="text-[9px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded leading-tight">
                                  Envío: {shippingFee > 0 ? formatPrice(shippingFee) : "Gratis"}
                                  {carrierName ? ` (${carrierName})` : ""}
                                </span>
                              </div>
                            </div>

                            {/* Incrementor buttons & Selection in bottom-right */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(1, (item.quantity || 1) - 1);
                                    if (onUpdateCartQuantity) onUpdateCartQuantity(item.product.id, newQty, idx);
                                    else if (onRemoveFromCart) onRemoveFromCart(item.product.id, idx);
                                  }}
                                  className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-mono font-extrabold text-slate-900 px-1">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateCartQuantity) onUpdateCartQuantity(item.product.id, (item.quantity || 1) + 1, idx);
                                  }}
                                  disabled={item.product.stock !== undefined && (item.quantity || 1) >= item.product.stock}
                                  className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Selector in bottom-right corner */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectCartItem(idx);
                                }}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                                  isSelected
                                    ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 scale-105"
                                    : "bg-white border-slate-300 hover:border-amber-400 text-transparent hover:text-slate-300"
                                }`}
                                title={isSelected ? "Deseleccionar producto para pago" : "Seleccionar producto para pagar"}
                                aria-label={isSelected ? "Deseleccionar producto" : "Seleccionar producto"}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5px)" }}>
                <div className="flex items-center justify-between text-sm font-black text-slate-900">
                  <div className="flex flex-col">
                    <span>Total a pagar</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {selectedCartItems.length} de {cart.length} {cart.length === 1 ? "artículo" : "artículos"}
                    </span>
                  </div>
                  <span className="text-amber-600 text-base font-black">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  id="android-reels-cart-checkout-btn"
                  disabled={cart.length > 0 && selectedCartItems.length === 0}
                  onClick={() => {
                    setShowCartPanel(false);
                    if (cart.length > 0 && onNavigateToCheckout) {
                      onNavigateToCheckout(selectedCartIndices);
                    } else if (onNavigateToShop) {
                      onNavigateToShop();
                    }
                  }}
                  className={`mt-3 w-full rounded-2xl font-black text-xs py-3.5 shadow-lg transition-all flex items-center justify-center space-x-2 ${
                    cart.length > 0 && selectedCartItems.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {cart.length === 0
                      ? "Ver tienda"
                      : selectedCartItems.length === 0
                      ? "Selecciona productos para pagar"
                      : `Completar Compra (${selectedCartItems.length}) - ${formatPrice(cartTotal)}`}
                  </span>
                </button>
              </div>
            </motion.aside>
            <button className="flex-1 bg-black/30 backdrop-blur-[1px]" onClick={() => setShowCartPanel(false)} aria-label="Cerrar carrito" />
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
