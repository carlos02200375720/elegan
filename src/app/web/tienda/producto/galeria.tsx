import React from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import type { Product } from "../../../../types";
import { NativeVideoPlayer } from "../../components/VideoPlayer";

interface GaleriaProductoProps {
  selectedProduct: Product;
  productGalleryMedia: string[];
  gallerySliderRef: React.RefObject<HTMLDivElement>;
  galleryVideoRefs: React.MutableRefObject<{ [key: number]: HTMLVideoElement | null }>;
  thumbnailTrackRef: React.RefObject<HTMLDivElement>;
  thumbnailItemRefs: React.MutableRefObject<{ [key: number]: HTMLButtonElement | null }>;
  activeGalleryIndex: number;
  isGalleryVideoPlaying: boolean;
  isGalleryVideoMuted: boolean;
  setIsGalleryVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  checkIsVideo: (url: string) => boolean;
  handleGalleryScroll: () => void;
  scrollToGalleryIndex: (index: number) => void;
}

export function GaleriaProducto({
  selectedProduct, productGalleryMedia, gallerySliderRef, galleryVideoRefs,
  thumbnailTrackRef, thumbnailItemRefs, activeGalleryIndex, isGalleryVideoMuted,
  setIsGalleryVideoMuted, checkIsVideo, handleGalleryScroll, scrollToGalleryIndex,
}: GaleriaProductoProps) {
  return (
    <div className="space-y-4">
          {/* Main Media Viewer - Horizontal Scroll Gallery Slider */}
          <div className="w-full h-[360px] sm:h-[440px] md:h-[500px] rounded-none md:rounded-2xl overflow-hidden border-b md:border border-slate-200/80 bg-white relative group/gallery shadow-xs">
            {/* Horizontal Scroll Track */}
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
                const isVideo = checkIsVideo(mediaUrl);
                return (
                  <div
                    key={idx}
                    className="w-full h-full flex-shrink-0 snap-center relative flex items-center justify-center bg-black overflow-hidden group/vid"
                  >
                    {isVideo && mediaUrl.includes(".m3u8") ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-black">
                        <NativeVideoPlayer
                          src=""
                          hlsUrl={mediaUrl}
                          poster={selectedProduct.imageUrl || selectedProduct.images?.[0]}
                          autoPlay={false}
                          loop={true}
                          muted={isGalleryVideoMuted}
                          preload="auto"
                          isCurrent={true}
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
                  </div>
                );
              })}
            </div>

            {/* Image Counter Badge in Bottom-Left Corner */}
            {productGalleryMedia.length > 0 && (
              <div
                className="absolute bottom-3 left-3 z-20 px-2 py-0.5 text-white font-mono text-xs font-bold tracking-wider flex items-center space-x-1 pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                id="detail-image-counter"
              >
                <span className="text-amber-400 font-extrabold">{activeGalleryIndex + 1}</span>
                <span className="text-white/80">/</span>
                <span className="text-white">{productGalleryMedia.length}</span>
              </div>
            )}

            {/* Audio Toggle Button in Bottom-Right Corner (for active video) */}
            {checkIsVideo(productGalleryMedia[activeGalleryIndex]) && (
              <button
                type="button"
                id="gallery-video-mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGalleryVideoMuted((prev) => {
                    const nextMuted = !prev;
                    const currentVideo = galleryVideoRefs.current[activeGalleryIndex];
                    if (currentVideo) {
                      currentVideo.muted = nextMuted;
                    }
                    return nextMuted;
                  });
                }}
                className="absolute bottom-3 right-3 z-20 p-2 text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                title={isGalleryVideoMuted ? "Activar audio" : "Silenciar audio"}
                aria-label={isGalleryVideoMuted ? "Activar audio" : "Silenciar audio"}
              >
                {isGalleryVideoMuted ? (
                  <VolumeX className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                ) : (
                  <Volume2 className="w-5 h-5 text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                )}
              </button>
            )}
          </div>

          {/* Media Thumbnails list (including photos and videos) */}
          {productGalleryMedia.length > 1 && (
            <div className="px-4 md:px-0 space-y-4">
              <div
                ref={thumbnailTrackRef}
                className="flex space-x-2 overflow-x-auto py-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
              >
                {productGalleryMedia.map((url, idx) => {
                  const isVideo = checkIsVideo(url);
                  const isSelected = activeGalleryIndex === idx;
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
                              selectedProduct.imageUrl ||
                              selectedProduct.images?.[0] ||
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
                        <img
                          src={url}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          alt=""
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
  );
}
