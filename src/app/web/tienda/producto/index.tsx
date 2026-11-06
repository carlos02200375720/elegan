import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../../../../types";
import { apiFetch } from "../../../../config";
import type { ProductoIdTiendaViewProps, GrupoVariante, ShippingOptionItem } from "./tipos";
import { getManualShippingOptions } from "./envios";
import { GaleriaProducto } from "./galeria";
import { OpcionesProducto } from "./opciones_producto";
import { PieProducto } from "./pie_producto";

export function ProductoIdTiendaView({
  selectedProduct,
  users,
  handleBackToCatalog,
  onCreatorClick,
  onAddToCart,
  openCartDrawer,
  onProductViewsUpdated,
}: ProductoIdTiendaViewProps) {
  const [selectedProductMediaUrl, setSelectedProductMediaUrl] = useState<string>(
    () => selectedProduct?.imageUrl || ""
  );
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [optionsValidationError, setOptionsValidationError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionItem[]>(() =>
    getManualShippingOptions(selectedProduct)
  );
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOptionItem | null>(
    null
  );

  const gallerySliderRef = useRef<HTMLDivElement>(null);
  const galleryVideoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const thumbnailTrackRef = useRef<HTMLDivElement>(null);
  const thumbnailItemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryVideoPlaying, setIsGalleryVideoPlaying] = useState<boolean>(true);
  const [isGalleryVideoMuted, setIsGalleryVideoMuted] = useState<boolean>(true);

  const getSellerInfo = (sellerId: string) => {
    return users.find((u) => u.id === sellerId) || { name: "Vendedor Destacado", avatar: "" };
  };

  // Normalize variants for detail rendering
  const effectiveVariantGroups = React.useMemo<GrupoVariante[]>(() => {
    if (!selectedProduct) return [];
    if (Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0) {
      return selectedProduct.variants;
    }
    const list = Array.isArray(selectedProduct.variantList) ? selectedProduct.variantList : [];
    const groups = new Map<string, Set<string>>();
    for (const item of list) {
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

  const productGalleryMedia = React.useMemo(() => {
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

    return list.length ? list : [selectedProduct.imageUrl].filter(Boolean);
  }, [selectedProduct]);

  // Reset state when switching products
  useEffect(() => {
    if (selectedProduct) {
      setSelectedProductMediaUrl(selectedProduct.imageUrl);
      setSelectedVariants({});
      setOptionsValidationError(null);
      setShippingOptions(getManualShippingOptions(selectedProduct));
      setSelectedShippingOption(null);
      setActiveGalleryIndex(0);
      setIsGalleryVideoPlaying(true);
      setIsGalleryVideoMuted(true);
      if (gallerySliderRef.current) {
        gallerySliderRef.current.scrollLeft = 0;
      }
    }
  }, [selectedProduct?.id]);

  // Track and count views when a product's detail page is visited
  useEffect(() => {
    if (selectedProduct?.id) {
      const prodId = selectedProduct.id;
      apiFetch(`/api/products/${encodeURIComponent(prodId)}/view`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.views === "number") {
            onProductViewsUpdated?.(prodId, data.views);
          }
        })
        .catch(() => {});
    }
  }, [selectedProduct?.id]);

  // Cleanup all gallery videos on unmount to prevent ghost background audio
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
    };
  }, []);

  // Sync video playback with active gallery slide
  useEffect(() => {
    productGalleryMedia.forEach((mediaUrl, idx) => {
      const isVideo = checkIsVideo(mediaUrl);
      const videoEl = galleryVideoRefs.current[idx];
      if (isVideo && videoEl) {
        if (idx === activeGalleryIndex) {
          videoEl.muted = isGalleryVideoMuted;
          if (isGalleryVideoPlaying) {
            videoEl.play().catch((err) => {
              console.log("Gallery video playback paused or blocked:", err);
              setIsGalleryVideoPlaying(false);
            });
          } else {
            videoEl.pause();
          }
        } else {
          videoEl.pause();
          videoEl.muted = true;
        }
      }
    });
  }, [activeGalleryIndex, productGalleryMedia, isGalleryVideoPlaying, isGalleryVideoMuted]);

  // Sync thumbnail container scroll with active gallery index
  useEffect(() => {
    const thumbEl = thumbnailItemRefs.current[activeGalleryIndex];
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
  }, [activeGalleryIndex]);

  const handleGalleryScroll = () => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(gallerySliderRef.current.scrollLeft / width);
      if (
        newIdx !== activeGalleryIndex &&
        newIdx >= 0 &&
        newIdx < productGalleryMedia.length
      ) {
        setActiveGalleryIndex(newIdx);
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
    setActiveGalleryIndex(index);
    if (productGalleryMedia[index]) {
      setSelectedProductMediaUrl(productGalleryMedia[index]);
    }
  };

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
      const hasSwatches = product.variantList.some(
        (item) => item.imageUrl || item.color || item.name
      );
      if (hasSwatches && !selected["Color"] && !selected["Opción"]) {
        missing.push("Color");
      }
    }

    if (!selectedShippingOption) {
      missing.push("Envío");
    }

    return missing;
  };

  if (!selectedProduct) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando detalles del producto...</p>
        <button
          type="button"
          onClick={handleBackToCatalog}
          className="mt-2 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al catálogo
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        key="detail"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 p-0 md:p-6 pb-4 md:pb-12"
      >
        <GaleriaProducto
          selectedProduct={selectedProduct}
          productGalleryMedia={productGalleryMedia}
          gallerySliderRef={gallerySliderRef}
          galleryVideoRefs={galleryVideoRefs}
          thumbnailTrackRef={thumbnailTrackRef}
          thumbnailItemRefs={thumbnailItemRefs}
          activeGalleryIndex={activeGalleryIndex}
          isGalleryVideoPlaying={isGalleryVideoPlaying}
          isGalleryVideoMuted={isGalleryVideoMuted}
          setIsGalleryVideoMuted={setIsGalleryVideoMuted}
          checkIsVideo={checkIsVideo}
          handleGalleryScroll={handleGalleryScroll}
          scrollToGalleryIndex={scrollToGalleryIndex}
        />
        <OpcionesProducto
          selectedProduct={selectedProduct}
          onCreatorClick={onCreatorClick}
          getSellerInfo={getSellerInfo}
          effectiveVariantGroups={effectiveVariantGroups}
          shippingOptions={shippingOptions}
          selectedVariants={selectedVariants}
          setSelectedVariants={setSelectedVariants}
          optionsValidationError={optionsValidationError}
          setOptionsValidationError={setOptionsValidationError}
          selectedProductMediaUrl={selectedProductMediaUrl}
          setSelectedProductMediaUrl={setSelectedProductMediaUrl}
          selectedShippingOption={selectedShippingOption}
          setSelectedShippingOption={setSelectedShippingOption}
          productGalleryMedia={productGalleryMedia}
          scrollToGalleryIndex={scrollToGalleryIndex}
          getMissingOptions={getMissingOptions}
          onAddToCart={onAddToCart}
          openCartDrawer={openCartDrawer}
        />
      </motion.div>
      <PieProducto selectedProduct={selectedProduct} />
    </>
  );
}

export const ProductoId = ProductoIdTiendaView;
export default ProductoIdTiendaView;

export { getManualShippingOptions } from "./envios";
