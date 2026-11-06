import React, { useState, useMemo, useRef, useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Product } from "../../tipos";
import { getProductGalleryMedia, getProductImageUrl } from "../productMedia";
import {
  AndroidProductoIdProps,
  ShippingOptionItem,
  PolicyType,
} from "./TiposProducto";
import {
  getManualShippingOptions,
  normalizeVariantGroups,
  extractVariantSwatches,
  getMissingOptions,
  getAvailableStock,
} from "./FuncionesProducto";
import { GaleriaProducto } from "./GaleriaProducto";
import { InformacionProducto, DescripcionProducto } from "./InformacionProducto";
import { VariantesProducto } from "./VariantesProducto";
import { EnvioProducto } from "./EnvioProducto";
import { PoliticasProducto } from "./PoliticasProducto";
import { AccionesProducto } from "./AccionesProducto";
import { CabeceraProducto } from "./CabeceraProducto";

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
    getProductImageUrl(selectedProduct)
  );
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  const [optionsValidationError, setOptionsValidationError] = useState<string | null>(null);
  const [isGalleryVideoMuted, setIsGalleryVideoMuted] = useState(true);
  const [playingGalleryVideoIndex, setPlayingGalleryVideoIndex] = useState<number | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionItem[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOptionItem | null>(null);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [activePolicySheet, setActivePolicySheet] = useState<PolicyType>(null);

  const availableStock = getAvailableStock(selectedProduct);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePolicySheet) {
        setActivePolicySheet(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePolicySheet]);

  const gallerySliderRef = useRef<HTMLDivElement | null>(null);
  const galleryVideoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rootContainerRef = useRef<HTMLDivElement | null>(null);

  // Asegurar que al entrar a la página de detalle, la vista inicie siempre arriba en la galería
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      if (rootContainerRef.current) {
        rootContainerRef.current.scrollTop = 0;
      }

      const appLayout = document.getElementById("android-app-layout");
      if (appLayout) appLayout.scrollTop = 0;
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
      const shopView = document.getElementById("android-shop-view");
      if (shopView) shopView.scrollTop = 0;

      if (gallerySliderRef.current) {
        gallerySliderRef.current.scrollLeft = 0;
      }
      setDetailGalleryIndex(0);
    };

    scrollToTop();
    const f1 = requestAnimationFrame(scrollToTop);
    const f2 = requestAnimationFrame(() => requestAnimationFrame(scrollToTop));
    const timer = setTimeout(scrollToTop, 60);

    return () => {
      cancelAnimationFrame(f1);
      cancelAnimationFrame(f2);
      clearTimeout(timer);
    };
  }, [selectedProduct?.id]);

  // Barra de estado nativa en blanco con iconos oscuros durante la vista de detalle
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

  const effectiveVariantGroups = useMemo(() => {
    return normalizeVariantGroups(selectedProduct);
  }, [selectedProduct]);

  const uniqueSwatches = useMemo(() => {
    return extractVariantSwatches(selectedProduct);
  }, [selectedProduct]);

  const productGalleryMedia = useMemo(
    () => getProductGalleryMedia(selectedProduct),
    [selectedProduct]
  );

  const missingOpts = useMemo(() => {
    return getMissingOptions(selectedProduct, selectedVariants, selectedShippingOption);
  }, [selectedProduct, selectedVariants, selectedShippingOption]);

  const scrollToGalleryIndex = (index: number) => {
    if (!gallerySliderRef.current) return;
    const width = gallerySliderRef.current.clientWidth;
    gallerySliderRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    setDetailGalleryIndex(index);
    if (productGalleryMedia[index]) {
      setSelectedProductMediaUrl(productGalleryMedia[index]);
    }
  };

  // Restablecer el estado al cambiar de producto seleccionado
  useEffect(() => {
    if (selectedProduct) {
      setDetailGalleryIndex(0);
      setSelectedProductMediaUrl(getProductImageUrl(selectedProduct));
      setSelectedVariants({});
      setOptionsValidationError(null);
      const opts = getManualShippingOptions(selectedProduct);
      setShippingOptions(opts);
      setSelectedShippingOption(null);
    }
  }, [selectedProduct?.id]);

  // Limpieza de referencias de video
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

  const handleAddToCartClick = () => {
    if (availableStock <= 0) return;

    if (missingOpts.length > 0) {
      setOptionsValidationError(
        `Por favor selecciona tu ${missingOpts.join(" y ")} antes de añadir al carrito.`
      );
      document
        .getElementById("android-product-options-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const variantStr = Object.entries(selectedVariants)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const activeImageUrl = selectedProductMediaUrl || getProductImageUrl(selectedProduct);
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
  };

  const isSaved = (savedReelIds || []).includes(selectedProduct.id);

  return (
    <div
      ref={rootContainerRef}
      className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none relative"
    >
      {/* Cabecera superior fija y transparente */}
      <CabeceraProducto
        onBackToCatalog={onBackToCatalog}
        isSaved={isSaved}
        onToggleSave={() => onToggleSave?.(selectedProduct.id)}
        openCartPage={openCartPage}
        cart={cart}
        isCartShockwave={isCartShockwave}
        shockwaveKey={shockwaveKey}
      />

      {/* Contenedor principal con scroll */}
      <div
        ref={scrollContainerRef}
        id="android-product-detail-scroll-container"
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: `${fixedBottomBarHeight}px`,
        }}
      >
        {/* Galería multimedia */}
        <GaleriaProducto
          productGalleryMedia={productGalleryMedia}
          selectedProduct={selectedProduct}
          detailGalleryIndex={detailGalleryIndex}
          onSelectMediaIndex={(idx) => {
            setDetailGalleryIndex(idx);
            if (productGalleryMedia[idx]) {
              setSelectedProductMediaUrl(productGalleryMedia[idx]);
            }
          }}
          isGalleryVideoMuted={isGalleryVideoMuted}
          onToggleVideoMute={() => {
            setIsGalleryVideoMuted((prev) => {
              const nextMuted = !prev;
              const currentVideo = galleryVideoRefs.current[detailGalleryIndex];
              if (currentVideo) {
                currentVideo.muted = nextMuted;
              }
              return nextMuted;
            });
          }}
          playingGalleryVideoIndex={playingGalleryVideoIndex}
          setPlayingGalleryVideoIndex={setPlayingGalleryVideoIndex}
          gallerySliderRef={gallerySliderRef}
          galleryVideoRefs={galleryVideoRefs}
        />

        {/* Sección de detalles comerciales, variantes y envío */}
        <div
          id="android-product-details-container"
          className="px-3 sm:px-4 pt-3 pb-0 space-y-3 flow-root"
        >
          {/* Título y Precio con Badge de Stock */}
          <InformacionProducto
            name={selectedProduct.name}
            price={selectedProduct.price}
            availableStock={availableStock}
          />

          {/* Opciones de Variantes y Envío */}
          <div className="mt-4 space-y-3.5 border-t border-slate-100 pt-3" id="android-product-options-section">
            <VariantesProducto
              selectedProduct={selectedProduct}
              effectiveVariantGroups={effectiveVariantGroups}
              uniqueSwatches={uniqueSwatches}
              selectedVariants={selectedVariants}
              onSelectVariant={(groupName, optVal) => {
                setSelectedVariants((prev) => ({ ...prev, [groupName]: optVal }));
                setOptionsValidationError(null);
              }}
              selectedProductMediaUrl={selectedProductMediaUrl}
              onSelectMediaUrl={setSelectedProductMediaUrl}
              productGalleryMedia={productGalleryMedia}
              onScrollToGalleryIndex={scrollToGalleryIndex}
              optionsValidationError={optionsValidationError}
            />

            <EnvioProducto
              shippingOptions={shippingOptions}
              selectedShippingOption={selectedShippingOption}
              onSelectShippingOption={(option) => {
                setSelectedShippingOption(option);
                setOptionsValidationError(null);
                if (selectedProduct) {
                  selectedProduct.shippingCost = option.shippingCost;
                }
              }}
            />

            {/* Descripción del producto */}
            <DescripcionProducto description={selectedProduct.description} />
          </div>

          {/* Badges y Bottom Sheet de Políticas */}
          <PoliticasProducto
            activePolicySheet={activePolicySheet}
            setActivePolicySheet={setActivePolicySheet}
          />
        </div>
      </div>

      {/* Barra fija inferior de acciones */}
      <AccionesProducto
        availableStock={availableStock}
        missingOpts={missingOpts}
        isAddedSuccess={isAddedSuccess}
        price={selectedProduct.price}
        onAddToCartClick={handleAddToCartClick}
        fixedBottomBarRef={fixedBottomBarRef}
      />
    </div>
  );
}

export default ProductoIdTiendaView;
