import React, { useRef, useEffect } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Product } from "../../tipos";
import { AndroidVideoPlayer } from "../../componente/videoplay";
import { getProductImageUrl } from "../productMedia";
import { checkIsVideo } from "./FuncionesProducto";

export interface GaleriaProductoProps {
  productGalleryMedia: string[];
  selectedProduct: Product;
  detailGalleryIndex: number;
  onSelectMediaIndex: (idx: number) => void;
  isGalleryVideoMuted: boolean;
  onToggleVideoMute: () => void;
  playingGalleryVideoIndex: number | null;
  setPlayingGalleryVideoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  gallerySliderRef: React.RefObject<HTMLDivElement | null>;
  galleryVideoRefs: React.MutableRefObject<{ [key: number]: HTMLVideoElement | null }>;
}

export const GaleriaProducto: React.FC<GaleriaProductoProps> = ({
  productGalleryMedia,
  selectedProduct,
  detailGalleryIndex,
  onSelectMediaIndex,
  isGalleryVideoMuted,
  onToggleVideoMute,
  playingGalleryVideoIndex,
  setPlayingGalleryVideoIndex,
  gallerySliderRef,
  galleryVideoRefs,
}) => {
  const thumbnailTrackRef = useRef<HTMLDivElement | null>(null);
  const thumbnailItemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const handleGalleryScroll = () => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(gallerySliderRef.current.scrollLeft / width);
      if (newIdx !== detailGalleryIndex && newIdx >= 0 && newIdx < productGalleryMedia.length) {
        onSelectMediaIndex(newIdx);
      }
    }
  };

  const scrollToGalleryIndex = (index: number) => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    gallerySliderRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    onSelectMediaIndex(index);
  };

  // Sync thumbnail container scroll with active gallery index
  useEffect(() => {
    const thumbEl = thumbnailItemRefs.current[detailGalleryIndex];
    if (thumbEl && thumbnailTrackRef.current) {
      const container = thumbnailTrackRef.current;
      const thumbLeft = thumbEl.offsetLeft;
      const thumbWidth = thumbEl.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = thumbLeft - containerWidth / 2 + thumbWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [detailGalleryIndex]);

  const currentMediaUrl = productGalleryMedia[detailGalleryIndex];
  const isCurrentVideo = checkIsVideo(currentMediaUrl, selectedProduct);

  return (
    <>
      {/* Main Media Viewer - Horizontal Scroll Gallery Slider */}
      <div className="w-full h-[360px] sm:h-[440px] overflow-hidden border-b border-slate-200/80 bg-white relative group/gallery shadow-xs">
        <div
          ref={gallerySliderRef}
          onScroll={handleGalleryScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pan-y",
          }}
        >
          {productGalleryMedia.map((mediaUrl, idx) => {
            const isVideo = checkIsVideo(mediaUrl, selectedProduct);
            return (
              <div
                key={idx}
                className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-black overflow-hidden group/vid"
              >
                {isVideo && mediaUrl.includes(".m3u8") ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    <AndroidVideoPlayer
                      hlsUrl={mediaUrl}
                      poster={getProductImageUrl(selectedProduct)}
                      autoPlay={false}
                      loop={true}
                      muted={isGalleryVideoMuted}
                      isCurrent={true}
                      onPlay={() => setPlayingGalleryVideoIndex(idx)}
                      onPause={() =>
                        setPlayingGalleryVideoIndex((current) => (current === idx ? null : current))
                      }
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                ) : (
                  <img
                    src={mediaUrl}
                    alt={`${selectedProduct.name} - ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover p-0 m-0 bg-white"
                  />
                )}
                {isVideo && playingGalleryVideoIndex !== idx && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <span className="w-14 h-14 rounded-full bg-black/45 flex items-center justify-center shadow-lg">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Image Counter Badge in Bottom-Left Corner */}
        {productGalleryMedia.length > 0 && (
          <div
            className="absolute bottom-3 left-3 z-20 px-2 py-0.5 text-white font-mono text-xs font-bold tracking-wider flex items-center space-x-1 pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            id="android-detail-image-counter"
          >
            <span className="text-amber-400 font-extrabold">{detailGalleryIndex + 1}</span>
            <span className="text-white/80">/</span>
            <span className="text-white">{productGalleryMedia.length}</span>
          </div>
        )}

        {/* Audio Toggle Button for Video */}
        {isCurrentVideo && (
          <button
            type="button"
            id="android-gallery-video-mute-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVideoMute();
            }}
            className="absolute bottom-3 right-3 z-20 p-2 text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            title={isGalleryVideoMuted ? "Activar audio" : "Silenciar audio"}
          >
            {isGalleryVideoMuted ? (
              <VolumeX className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            ) : (
              <Volume2 className="w-5 h-5 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            )}
          </button>
        )}
      </div>

      {/* Media Thumbnails list */}
      {productGalleryMedia.length > 1 && (
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 bg-white">
          <div
            ref={thumbnailTrackRef}
            className="flex space-x-2 overflow-x-auto py-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
          >
            {productGalleryMedia.map((url, idx) => {
              const isVideo = checkIsVideo(url, selectedProduct);
              const isSelected = detailGalleryIndex === idx;
              return (
                <button
                  key={`thumb-${idx}`}
                  ref={(el) => {
                    thumbnailItemRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => scrollToGalleryIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 relative cursor-pointer transition-all ${
                    isSelected
                      ? "border-slate-950 scale-105 shadow-xs"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  {isVideo ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                      <img
                        src={
                          getProductImageUrl(selectedProduct) ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80"
                        }
                        className="w-full h-full object-cover opacity-75"
                        referrerPolicy="no-referrer"
                        alt=""
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-3.5 h-3.5 text-white fill-white drop-shadow-xs" />
                      </div>
                      <span className="absolute bottom-0.5 right-0.5 bg-amber-500 text-slate-950 font-black text-[7px] px-1 rounded-xs uppercase tracking-tight">
                        VIDEO
                      </span>
                    </div>
                  ) : (
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default GaleriaProducto;
