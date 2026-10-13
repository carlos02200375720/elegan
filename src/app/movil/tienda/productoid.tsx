import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingBag,
  ArrowRight,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
  ShieldCheck,
  Truck,
  Star,
  AlertCircle,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { Product, CartItem, User } from "../../../types";
import { AndroidVideoPlayer } from "../components/videoplay";
import { StatusBar, Style } from "@capacitor/status-bar";

export interface ShippingOptionItem {
  carrier: string;
  aging: string;
  shippingCost: number;
}

export function getManualShippingOptions(prod: Product | null): ShippingOptionItem[] {
  if (!prod) {
    return [{ carrier: "Envío Gratis", aging: "1-5 días hábiles", shippingCost: 0 }];
  }

  const opts: ShippingOptionItem[] = [];
  const seenLabels = new Set<string>();

  if (Array.isArray(prod.shippingOptions) && prod.shippingOptions.length > 0) {
    prod.shippingOptions.forEach((opt) => {
      if (!opt || !opt.label || !String(opt.label).trim()) return;
      const cleanLabel = String(opt.label).trim();
      seenLabels.add(cleanLabel.toLowerCase());
      opts.push({
        carrier: cleanLabel,
        aging: String(opt.deliveryTime || "3-7 días hábiles").trim(),
        shippingCost: Math.max(0, Number(opt.price ?? 0) || 0),
      });
    });
  }

  const capCost = Math.max(0, Number(prod.shippingCapital ?? 0) || 0);
  const provCost = Math.max(0, Number(prod.shippingProvince ?? 0) || 0);
  const baseCost = Math.max(0, Number(prod.shippingCost ?? 0) || 0);

  if (capCost > 0 && !seenLabels.has("envío a la capital")) {
    opts.push({
      carrier: "Envío a la Capital",
      aging: "1-3 días hábiles",
      shippingCost: capCost,
    });
  }
  if (provCost > 0 && !seenLabels.has("envío a provincia")) {
    opts.push({
      carrier: "Envío a Provincia",
      aging: "3-5 días hábiles",
      shippingCost: provCost,
    });
  }
  if (prod.freeShipping && !opts.some((o) => o.shippingCost === 0)) {
    opts.push({
      carrier: "Envío Gratis",
      aging: "1-5 días hábiles",
      shippingCost: 0,
    });
  }

  if (opts.length === 0) {
    if (baseCost > 0) {
      opts.push({
        carrier: "Envío a la Capital",
        aging: "1-3 días hábiles",
        shippingCost: baseCost,
      });
    } else {
      opts.push({
        carrier: "Envío Gratis",
        aging: "1-5 días hábiles",
        shippingCost: 0,
      });
    }
  }

  return opts;
}

export interface AndroidProductoIdProps {
  selectedProduct: Product;
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: Record<string, string>,
    selectedVariantVid?: string
  ) => void;
  cart: CartItem[];
  users: User[];
  onCreatorClick?: (creatorId: string) => void;
  onToggleSave?: (productId: string) => void;
  savedReelIds?: string[];
  onBackToCatalog: () => void;
  openCartPage: () => void;
  isCartShockwave: boolean;
  shockwaveKey: number;
  triggerCartShockwave: () => void;
}

export function ProductoIdTiendaView({
  selectedProduct,
  onAddToCart,
  cart,
  users,
  onCreatorClick,
  onToggleSave,
  savedReelIds = [],
  onBackToCatalog,
  openCartPage,
  isCartShockwave,
  shockwaveKey,
  triggerCartShockwave,
}: AndroidProductoIdProps) {
  const [detailGalleryIndex, setDetailGalleryIndex] = useState(0);
  const [selectedProductMediaUrl, setSelectedProductMediaUrl] = useState<string>(
    selectedProduct.imageUrl || ""
  );
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [optionsValidationError, setOptionsValidationError] = useState<string | null>(null);
  const [isGalleryVideoMuted, setIsGalleryVideoMuted] = useState(true);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionItem[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOptionItem | null>(null);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  const gallerySliderRef = useRef<HTMLDivElement | null>(null);
  const galleryVideoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const thumbnailTrackRef = useRef<HTMLDivElement | null>(null);
  const thumbnailItemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const addedSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fixedBottomBarRef = useRef<HTMLDivElement | null>(null);
  const [fixedBottomBarHeight, setFixedBottomBarHeight] = useState<number>(60);

  useEffect(() => {
    if (!fixedBottomBarRef.current) return;
    const updateBarHeight = () => {
      if (fixedBottomBarRef.current) {
        setFixedBottomBarHeight(fixedBottomBarRef.current.offsetHeight);
      }
    };
    updateBarHeight();
    const observer = new ResizeObserver(updateBarHeight);
    observer.observe(fixedBottomBarRef.current);
    return () => observer.disconnect();
  }, []);

  // Set native status bar to white with dark icons while viewing product detail
  useEffect(() => {
    try {
      StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    } catch {}

    const metaTags = document.querySelectorAll('meta[name="theme-color"]');
    const prevThemeColors: { el: Element; val: string | null }[] = [];
    metaTags.forEach((el) => {
      prevThemeColors.push({ el, val: el.getAttribute("content") });
      el.setAttribute("content", "#ffffff");
    });

    return () => {
      try {
        StatusBar.setBackgroundColor({ color: "#000000" }).catch(() => {});
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      } catch {}
      prevThemeColors.forEach(({ el, val }) => {
        if (val !== null) {
          el.setAttribute("content", val);
        } else {
          el.setAttribute("content", "#000000");
        }
      });
    };
  }, []);

  // Normalize variants for the product detail UI
  const effectiveVariantGroups = useMemo(() => {
    if (!selectedProduct) return [];
    if (Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0) {
      return selectedProduct.variants;
    }
    const groups = new Map<string, Set<string>>();
    for (const item of Array.isArray(selectedProduct.variantList) ? selectedProduct.variantList : []) {
      const color = typeof item.color === "string" ? item.color.trim() : "";
      const size = typeof item.size === "string" ? item.size.trim() : "";
      const name = typeof item.name === "string" ? item.name.trim() : "";
      if (color) {
        if (!groups.has("Color")) groups.set("Color", new Set());
        groups.get("Color")!.add(color);
      }
      if (size) {
        if (!groups.has("Talla")) groups.set("Talla", new Set());
        groups.get("Talla")!.add(size);
      }
      if (!color && !size && name) {
        if (!groups.has("Opción")) groups.set("Opción", new Set());
        groups.get("Opción")!.add(name);
      }
    }
    return Array.from(groups.entries()).map(([name, options]) => ({
      name,
      options: Array.from(options),
    }));
  }, [selectedProduct]);

  const checkIsVideo = (url: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      Boolean(
        selectedProduct?.videos &&
          selectedProduct.videos.some((v) => v === url || lower.includes(v.toLowerCase()))
      ) ||
      lower.includes(".m3u8") ||
      lower.includes("video") ||
      lower.startsWith("data:video") ||
      lower.startsWith("blob:")
    );
  };

  const productGalleryMedia = useMemo(() => {
    if (!selectedProduct) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    const push = (u?: string) => {
      if (!u || seen.has(u)) return;
      seen.add(u);
      list.push(u);
    };

    push(selectedProduct.imageUrl);
    (selectedProduct.images || []).forEach(push);
    (selectedProduct.videos || []).forEach(push);
    (selectedProduct.variantList || []).forEach((variant) => push(variant.imageUrl));

    return list.length ? list : [selectedProduct.imageUrl];
  }, [selectedProduct]);

  const getMissingOptions = (product: Product | null, selected: { [key: string]: string }) => {
    if (!product) return [];
    const missing: string[] = [];
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (!selected[v.name] || !selected[v.name].trim()) {
          missing.push(v.name);
        }
      });
    } else if (product.variantList && product.variantList.length > 0) {
      const hasSwatches = product.variantList.some((item) => item.imageUrl || item.color || item.name);
      if (hasSwatches && !selected["Color"] && !selected["Opción"]) {
        missing.push("Color");
      }
    }
    if (!selectedShippingOption) {
      missing.push("Envío");
    }
    return missing;
  };

  const getSellerInfo = (sellerId?: string) => {
    if (!sellerId) return { name: "Vendedor Oficial", avatar: "" };
    return users.find((u) => u.id === sellerId) || { name: "Vendedor Oficial", avatar: "" };
  };

  const handleGalleryScroll = () => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(gallerySliderRef.current.scrollLeft / width);
      if (newIdx !== detailGalleryIndex && newIdx >= 0 && newIdx < productGalleryMedia.length) {
        setDetailGalleryIndex(newIdx);
        if (productGalleryMedia[newIdx]) {
          setSelectedProductMediaUrl(productGalleryMedia[newIdx]);
        }
      }
    }
  };

  const scrollToGalleryIndex = (index: number) => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    gallerySliderRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    setDetailGalleryIndex(index);
    if (productGalleryMedia[index]) {
      setSelectedProductMediaUrl(productGalleryMedia[index]);
    }
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

  // Reset product details state when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setDetailGalleryIndex(0);
      setSelectedProductMediaUrl(selectedProduct.imageUrl || "");
      setSelectedVariants({});
      setOptionsValidationError(null);
      const opts = getManualShippingOptions(selectedProduct);
      setShippingOptions(opts);
      setSelectedShippingOption(null);
    }
  }, [selectedProduct?.id]);

  // Cleanup video references on unmount
  useEffect(() => {
    return () => {
      Object.keys(galleryVideoRefs.current).forEach((key) => {
        const videoEl = galleryVideoRefs.current[Number(key)];
        if (videoEl) {
          try {
            videoEl.pause();
            videoEl.muted = true;
          } catch {}
        }
      });
      if (addedSuccessTimerRef.current) clearTimeout(addedSuccessTimerRef.current);
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none relative">
      {/* Barra de estado nativa en blanco */}
      <div
        className="w-full bg-white shrink-0 z-40 fixed top-0 inset-x-0 pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Cabecera 100% transparente fija */}
      <header
        id="android-detail-fixed-header"
        className="fixed top-0 inset-x-0 z-50 bg-transparent pointer-events-none"
        style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}
      >
        <div className="max-w-md mx-auto w-full px-3.5 py-2.5 flex items-center justify-between pointer-events-none">
          {/* Botón de regreso - 100% transparente, sin fondo negro ni sombra */}
          <button
            type="button"
            id="android-detail-back-btn"
            onClick={onBackToCatalog}
            className="pointer-events-auto p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group"
            title="Volver a la tienda"
          >
            <ArrowRight className="w-6 h-6 rotate-180 text-black group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex-1" />

          {/* Botón Guardar producto en publicaciones */}
          <button
            type="button"
            id="android-detail-save-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSave && selectedProduct) {
                onToggleSave(selectedProduct.id);
              }
            }}
            className="pointer-events-auto relative p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group mr-1"
            title={
              (savedReelIds || []).includes(selectedProduct.id)
                ? "Guardado en publicaciones"
                : "Guardar en publicaciones"
            }
            aria-label="Guardar producto en publicaciones"
          >
            <Bookmark
              className={`w-6 h-6 transition-all duration-200 ${
                (savedReelIds || []).includes(selectedProduct.id)
                  ? "fill-black text-black scale-105"
                  : "text-black group-hover:text-neutral-700"
              }`}
            />
          </button>

          {/* Icono del carrito - 100% transparente, sin fondo negro ni sombra */}
          <button
            type="button"
            id="android-detail-cart-btn"
            onClick={openCartPage}
            className="pointer-events-auto relative p-2 bg-transparent text-black active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 shadow-none outline-none group"
            title="Ver carrito"
          >
            <ShoppingBag
              className={`w-6 h-6 text-black group-hover:scale-110 transition-all duration-300 ${
                isCartShockwave ? "scale-115 !text-black" : ""
              }`}
            />
            {(cart.length > 0 || isCartShockwave) && (
              <span
                key={`detail-cart-counter-${shockwaveKey}`}
                className={`absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                  isCartShockwave
                    ? "scale-125 ring-2 ring-amber-300 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                    : "scale-100"
                }`}
              >
                {Math.max(1, cart.reduce((s, i) => s + (i.quantity || 1), 0))}

                {/* Onda expansiva emitida desde el contador del carrito */}
                {isCartShockwave && (
                  <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-amber-400 animate-cart-shockwave" />
                    <span className="absolute inset-0 rounded-full border-2 border-amber-300 animate-cart-shockwave-2" />
                    <span className="absolute inset-0 rounded-full border border-amber-200 animate-cart-shockwave-3" />
                  </span>
                )}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Scrollable Body - Inicia después de la barra de estado del celular */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: `${fixedBottomBarHeight}px`,
        }}
      >
        {/* Main Media Viewer - Horizontal Scroll Gallery Slider */}
        <div className="w-full h-[340px] sm:h-[420px] overflow-hidden border-b border-slate-200/80 bg-white relative group/gallery shadow-xs">
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
                      <AndroidVideoPlayer
                        hlsUrl={mediaUrl}
                        poster={selectedProduct.imageUrl || selectedProduct.images?.[0]}
                        autoPlay={false}
                        loop={true}
                        muted={isGalleryVideoMuted}
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
              id="android-detail-image-counter"
            >
              <span className="text-amber-400 font-extrabold">{detailGalleryIndex + 1}</span>
              <span className="text-white/80">/</span>
              <span className="text-white">{productGalleryMedia.length}</span>
            </div>
          )}

          {/* Audio Toggle Button for Video */}
          {checkIsVideo(productGalleryMedia[detailGalleryIndex]) && (
            <button
              type="button"
              id="android-gallery-video-mute-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsGalleryVideoMuted((prev) => {
                  const nextMuted = !prev;
                  const currentVideo = galleryVideoRefs.current[detailGalleryIndex];
                  if (currentVideo) {
                    currentVideo.muted = nextMuted;
                  }
                  return nextMuted;
                });
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
          <div
            ref={thumbnailTrackRef}
            className="flex space-x-2 overflow-x-auto py-2 px-3 no-scrollbar scroll-smooth bg-white border-b border-slate-100"
          >
            {productGalleryMedia.map((url, idx) => {
              const isVideo = checkIsVideo(url);
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
                      ? "border-black scale-105 shadow-xs"
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
                    <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Product Details Section - Contenedor con margen de 3px hacia la barra inferior fija */}
        <div
          id="android-product-details-container"
          className="px-3 sm:px-4 pt-3 pb-0 space-y-3 mb-[3px]"
          style={{ marginBottom: "3px" }}
        >

          {/* Product Title */}
          <h1 className="font-display font-extrabold text-[11px] text-slate-900 leading-snug">
            {selectedProduct.name}
          </h1>

          {/* Price Section */}
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex-wrap">
            <span
              className="text-2xl font-black font-mono text-slate-950 tracking-tight"
              id="android-product-detail-price"
            >
              ${selectedProduct.price.toFixed(2)}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                selectedProduct.stock > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                  : "bg-rose-50 text-rose-700 border-rose-200/80"
              }`}
            >
              {selectedProduct.stock > 0 ? "En Stock" : "Agotado"}
            </span>
          </div>

          {/* Product Options & Shipping Selection */}
          {(() => {
            const swatchesMap = new Map<string, { name: string; color?: string; imageUrl: string }>();
            if (selectedProduct.variantList) {
              selectedProduct.variantList.forEach((vItem) => {
                if (!vItem.imageUrl) return;
                const key = (vItem.color || vItem.name || vItem.imageUrl).trim().toLowerCase();
                if (!swatchesMap.has(key)) {
                  swatchesMap.set(key, {
                    name: vItem.color || vItem.name || "Color",
                    color: vItem.color,
                    imageUrl: vItem.imageUrl,
                  });
                }
              });
            }
            const uniqueSwatches = Array.from(swatchesMap.values());
            const hasOptionGroups = effectiveVariantGroups.length > 0;
            const configuredShippingButtons =
              shippingOptions.length > 0 ? shippingOptions : getManualShippingOptions(selectedProduct);

            return (
              <div className="mt-4 space-y-3.5 border-t border-slate-100 pt-3" id="android-product-options-section">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Selecciona tus opciones:</span>
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200/60 lowercase">
                      (requerido)
                    </span>
                  </p>
                </div>

                {optionsValidationError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2 shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{optionsValidationError}</span>
                  </div>
                )}

                {hasOptionGroups ? (
                  effectiveVariantGroups.map((v, idx) => {
                    const groupNameLower = v.name.toLowerCase().trim();
                    const isSizeGroup =
                      groupNameLower.includes("talla") ||
                      groupNameLower.includes("size") ||
                      groupNameLower.includes("medida") ||
                      groupNameLower.includes("dimension");
                    const isColorGroup =
                      !isSizeGroup &&
                      (groupNameLower.includes("color") ||
                        groupNameLower.includes("estilo") ||
                        groupNameLower.includes("style") ||
                        groupNameLower.includes("opción") ||
                        groupNameLower.includes("option") ||
                        groupNameLower.includes("modelo") ||
                        (selectedProduct.variants!.length === 1 && uniqueSwatches.length > 0));

                    if (isColorGroup) {
                      return (
                        <div key={idx} className="space-y-1.5 text-left">
                          <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                            <span className="text-slate-600">{v.name}:</span>
                          </div>

                          <div className="flex flex-wrap items-start gap-2.5 pb-1 pt-0.5">
                            {v.options.map((opt, oIdx) => {
                              const matchingSwatch = uniqueSwatches.find(
                                (s) =>
                                  s.name.toLowerCase() === opt.toLowerCase() ||
                                  (s.color && s.color.toLowerCase() === opt.toLowerCase()) ||
                                  s.name.toLowerCase().includes(opt.toLowerCase())
                              );
                              const fallbackVariantItem =
                                !matchingSwatch && selectedProduct.variantList
                                  ? selectedProduct.variantList.find(
                                      (vItem) =>
                                        (vItem.color && vItem.color.toLowerCase() === opt.toLowerCase()) ||
                                        (vItem.name && vItem.name.toLowerCase() === opt.toLowerCase()) ||
                                        (vItem.color && vItem.color.toLowerCase().includes(opt.toLowerCase())) ||
                                        (vItem.name && vItem.name.toLowerCase().includes(opt.toLowerCase()))
                                    )
                                  : undefined;
                              const imgUrl = matchingSwatch?.imageUrl || fallbackVariantItem?.imageUrl;
                              const isSelected =
                                selectedVariants[v.name] === opt ||
                                Boolean(imgUrl && selectedProductMediaUrl === imgUrl && !selectedVariants[v.name]);

                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  title={opt}
                                  onClick={() => {
                                    setSelectedVariants({ ...selectedVariants, [v.name]: opt });
                                    setOptionsValidationError(null);
                                    if (imgUrl) {
                                      setSelectedProductMediaUrl(imgUrl);
                                      const gIdx = productGalleryMedia.indexOf(imgUrl);
                                      if (gIdx !== -1) {
                                        scrollToGalleryIndex(gIdx);
                                      }
                                    }
                                  }}
                                  className={`group flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer relative text-center min-w-[64px] max-w-[76px] ${
                                    isSelected
                                      ? "bg-slate-950 text-white border-black ring-2 ring-black shadow-md scale-[1.02]"
                                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs"
                                  }`}
                                >
                                  {imgUrl ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 bg-slate-100">
                                      <img
                                        src={imgUrl}
                                        alt={opt}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  ) : null}
                                  <span
                                    className={`text-[11px] font-bold capitalize mt-1.5 line-clamp-1 text-center w-full px-0.5 leading-tight ${
                                      !imgUrl ? "py-1 px-1.5" : ""
                                    }`}
                                  >
                                    {opt}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} className="space-y-1.5 text-left">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                          <span className="text-slate-600">{v.name}:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt, oIdx) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => {
                                  setSelectedVariants({ ...selectedVariants, [v.name]: opt });
                                  setOptionsValidationError(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-slate-950 text-white border-black shadow-sm ring-2 ring-black"
                                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : uniqueSwatches.length > 0 ? (
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                      <span className="text-slate-600">Color:</span>
                    </div>
                    <div className="flex flex-wrap items-start gap-2.5 pb-1 pt-0.5">
                      {uniqueSwatches.map((swatch, sIdx) => {
                        const isSelected =
                          selectedProductMediaUrl === swatch.imageUrl ||
                          selectedVariants["Color"] === swatch.name;
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            title={swatch.name}
                            onClick={() => {
                              setSelectedProductMediaUrl(swatch.imageUrl);
                              setSelectedVariants((prev) => ({ ...prev, Color: swatch.name }));
                              setOptionsValidationError(null);
                              const gIdx = productGalleryMedia.indexOf(swatch.imageUrl);
                              if (gIdx !== -1) {
                                scrollToGalleryIndex(gIdx);
                              }
                            }}
                            className={`group flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer relative text-center min-w-[64px] max-w-[76px] ${
                              isSelected
                                ? "bg-slate-950 text-white border-black ring-2 ring-black shadow-md scale-[1.02]"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs"
                            }`}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 bg-slate-100">
                              <img
                                src={swatch.imageUrl}
                                alt={swatch.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[11px] font-bold capitalize mt-1.5 line-clamp-1 text-center w-full px-0.5 leading-tight">
                              {swatch.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Shipping Options as Buttons */}
                <div className="space-y-1.5 text-left" id="android-product-shipping-options-group">
                  <div className="flex items-center flex-wrap gap-1.5 text-[11px] font-bold">
                    <span className="text-slate-600">Envío:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {configuredShippingButtons.map((option, sIdx) => {
                      const isSelected =
                        selectedShippingOption?.carrier === option.carrier &&
                        selectedShippingOption?.shippingCost === option.shippingCost;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setSelectedShippingOption(option);
                            setOptionsValidationError(null);
                            if (selectedProduct) {
                              selectedProduct.shippingCost = option.shippingCost;
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-wrap items-center gap-1.5 ${
                            isSelected
                              ? "bg-slate-950 text-white border-black shadow-sm ring-2 ring-black"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{option.carrier}:</span>
                          <span
                            className={`font-mono ${
                              isSelected ? "text-emerald-400 font-extrabold" : "text-emerald-700"
                            }`}
                          >
                            {option.shippingCost === 0
                              ? "GRATIS ($0.00)"
                              : `$${option.shippingCost.toFixed(2)}`}
                          </span>
                          {option.aging && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? "bg-slate-800 text-slate-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              ⏱ {option.aging}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description - Debajo del contenedor de envío */}
                {selectedProduct.description && (
                  <div className="border-t border-slate-100 pt-3 text-left" id="android-product-description-container">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Security Badges - Al pie de la página */}
          <div className="bg-slate-50 rounded-xl p-3 mt-4 border border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-semibold">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mb-1" />
              <span>Pago Seguro</span>
            </div>
            <div className="flex flex-col items-center border-x border-slate-200/60">
              <Truck className="w-5 h-5 text-amber-500 mb-1" />
              <span>Envío Rápido</span>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 mb-1" />
              <span>Garantía Oficial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div
        ref={fixedBottomBarRef}
        id="android-product-fixed-bottom-bar"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2 px-3 sm:px-5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "max(0.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))" }}
      >
        <div className="max-w-md mx-auto w-full flex items-center justify-center min-h-[38px]">
          {(() => {
            const missingOpts = getMissingOptions(selectedProduct, selectedVariants);
            const hasMissingOpts = missingOpts.length > 0;

            return (
              <button
                type="button"
                onClick={() => {
                  if (selectedProduct.stock <= 0) return;

                  const currentMissing = getMissingOptions(selectedProduct, selectedVariants);
                  if (currentMissing.length > 0) {
                    setOptionsValidationError(
                      `Por favor selecciona tu ${currentMissing.join(" y ")} antes de añadir al carrito.`
                    );
                    document
                      .getElementById("android-product-options-section")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                    return;
                  }

                  const variantStr = Object.entries(selectedVariants)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ");

                  const activeImageUrl = selectedProductMediaUrl || selectedProduct.imageUrl;
                  const effectiveShippingFee = selectedShippingOption
                    ? selectedShippingOption.shippingCost
                    : Number(selectedProduct.shippingCost ?? 0);
                  const effectiveCarrier = selectedShippingOption
                    ? selectedShippingOption.carrier
                    : "Envío Estándar del Vendedor";

                  const customizedProduct: Product = {
                    ...selectedProduct,
                    imageUrl: activeImageUrl,
                    name: variantStr ? `${selectedProduct.name} (${variantStr})` : selectedProduct.name,
                    shippingCost: effectiveShippingFee,
                    selectedCarrier: effectiveCarrier,
                  };

                  onAddToCart(customizedProduct, 1, selectedVariants);
                  triggerCartShockwave();
                  setIsAddedSuccess(true);
                  if (addedSuccessTimerRef.current) clearTimeout(addedSuccessTimerRef.current);
                  addedSuccessTimerRef.current = setTimeout(() => {
                    setIsAddedSuccess(false);
                  }, 2400);
                }}
                disabled={selectedProduct.stock <= 0}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 text-center ${
                  selectedProduct.stock <= 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : hasMissingOpts
                    ? "bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-500/20"
                    : isAddedSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 scale-[1.01]"
                    : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25"
                }`}
                id="android-add-to-cart-detail-btn"
              >
                {selectedProduct.stock <= 0 ? (
                  <span>Agotado</span>
                ) : hasMissingOpts ? (
                  <>
                    <AlertCircle className="w-4 h-4 shrink-0 text-slate-950" />
                    <span className="whitespace-nowrap">
                      {missingOpts.length === 1 ? `Elegir ${missingOpts[0]}` : "Elegir opciones"}
                    </span>
                  </>
                ) : isAddedSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-white animate-bounce" />
                    <span className="whitespace-nowrap font-black">¡Añadido con éxito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 shrink-0 text-slate-950" />
                    <span className="whitespace-nowrap">
                      Añadir al Carrito • ${selectedProduct.price.toFixed(2)}
                    </span>
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default ProductoIdTiendaView;
