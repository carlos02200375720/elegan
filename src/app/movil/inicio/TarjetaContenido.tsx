import React from "react";
import { Heart, MessageCircle, Share2, Bookmark, BadgeCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Reel, ReelMedia, Product, User } from "../tipos";
import { MovilVideoPlay, MovilVideoPlayHandle } from "../componente/videoplay";
import { AndroidProgressBar } from "../componente/barraprogreso";
import { LikeButton } from "../componente/like";
import { ComentarioButton } from "../componente/comentario";
import { GuardadoButton } from "../componente/guardado";
import { ConpartilButton } from "../componente/conpartil";
import { getMediaUrl } from "../config";
import { formatPrice } from "../utilidades/moneda";
import { isDefaultDescription, isFilenameTitle, findProductForReel } from "./FuncionesInicio";
import type { PublicationFormat } from "./TiposInicio";

export interface TarjetaContenidoProps {
  reelItem: Reel;
  reelIndex: number;
  currentIndex: number;
  actualNavHeight: number;
  getReelMediaItems: (reel?: Reel) => ReelMedia[];
  carouselIndices: Record<string, number>;
  products: Product[];
  storeProfile?: User;
  currentUser: User;
  currentGuestToken?: string | null;
  savedReelIds: string[];
  getEffectiveFormat: (item: Reel) => PublicationFormat;
  handleProductSelect?: (product: Product) => void;
  descriptionRefs: React.MutableRefObject<Record<string, HTMLParagraphElement | null>>;
  expandedDescriptions: Record<string, boolean>;
  setExpandedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  descriptionOverflow: Record<string, boolean>;
  mediaSliderRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  handleMediaScroll: (reelId: string, element: HTMLDivElement, totalItems: number) => void;
  handleDoubleTap: (reel: Reel) => void;
  playerRef: React.MutableRefObject<MovilVideoPlayHandle | null>;
  isMuted: boolean;
  isFeedActive: boolean;
  handleMuteChange: (muted: boolean) => void;
  handleVideoReady: (video: HTMLVideoElement | null) => void;
  progressVideo: HTMLVideoElement | null;
  heartAnimReelId: string | null;
  handleCreatorNav: (reel: Reel) => void;
  handleLikeClick: (reel: Reel) => void;
  requireLoginForInteraction: (description: string) => boolean;
  setActiveCommentsReelId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowComments: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveClick: (reel: Reel) => void;
  handleShare: (reel: Reel) => void | Promise<void>;
  onLikeReel: (reelId: string) => void;
  onToggleSaveReel: (reelId: string) => void;
}

export default function TarjetaContenido({
  reelItem,
  reelIndex,
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
  onToggleSaveReel,
}: TarjetaContenidoProps) {
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
}
