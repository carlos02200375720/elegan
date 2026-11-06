import React from "react";
import { AlertCircle, ShoppingCart } from "lucide-react";
import type { Product, User } from "../../../../types";
import type { GrupoVariante, ShippingOptionItem } from "./tipos";
import { getManualShippingOptions } from "./envios";
import { formatPrice } from "../../utilidades/moneda";

interface OpcionesProductoProps {
  selectedProduct: Product;
  onCreatorClick: (creatorId: string) => void;
  getSellerInfo: (sellerId: string) => User | { name: string; avatar: string };
  effectiveVariantGroups: GrupoVariante[];
  shippingOptions: ShippingOptionItem[];
  selectedVariants: { [key: string]: string };
  setSelectedVariants: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  optionsValidationError: string | null;
  setOptionsValidationError: React.Dispatch<React.SetStateAction<string | null>>;
  selectedProductMediaUrl: string;
  setSelectedProductMediaUrl: React.Dispatch<React.SetStateAction<string>>;
  selectedShippingOption: ShippingOptionItem | null;
  setSelectedShippingOption: React.Dispatch<React.SetStateAction<ShippingOptionItem | null>>;
  productGalleryMedia: string[];
  scrollToGalleryIndex: (index: number) => void;
  getMissingOptions: (product: Product | null, selected: { [key: string]: string }) => string[];
  onAddToCart: (product: Product) => void;
  openCartDrawer: () => void;
}

export function OpcionesProducto({
  selectedProduct, onCreatorClick, getSellerInfo, effectiveVariantGroups,
  shippingOptions, selectedVariants, setSelectedVariants, optionsValidationError,
  setOptionsValidationError, selectedProductMediaUrl, setSelectedProductMediaUrl,
  selectedShippingOption, setSelectedShippingOption, productGalleryMedia,
  scrollToGalleryIndex, getMissingOptions, onAddToCart, openCartDrawer,
}: OpcionesProductoProps) {
  return (
    <div className="flex flex-col justify-between px-4 md:px-0">
          <div>
            {/* Seller Header clickable */}
            <div
              onClick={() => onCreatorClick(selectedProduct.sellerId)}
              className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 cursor-pointer transition-colors"
            >
              <img
                src={
                  getSellerInfo(selectedProduct.sellerId).avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                }
                alt="Creator"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover"
              />
              <span>
                Tienda de @
                {getSellerInfo(selectedProduct.sellerId).name.toLowerCase().replace(/\s+/g, "")}
              </span>
              <span className="text-[10px] text-amber-600 font-medium ml-1">Ver perfil →</span>
            </div>

            <h1 className="font-display font-extrabold text-xs sm:text-[15px] text-slate-900 mt-4 leading-tight">
              {selectedProduct.name}
            </h1>

            {/* Rating Stars & Price Section */}
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <span
                  className="text-2xl sm:text-3xl font-black font-mono text-slate-950 tracking-tight"
                  id="product-detail-price"
                >
                  {formatPrice(selectedProduct.price)}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    selectedProduct.stock > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : "bg-rose-50 text-rose-700 border-rose-200/80"
                  }`}
                >
                  {selectedProduct.stock > 0
                    ? `En Stock: ${selectedProduct.stock} ${selectedProduct.stock === 1 ? "disponible" : "disponibles"}`
                    : "Agotado"}
                </span>
              </div>
            </div>

            {/* Product Options & Shipping Selection */}
            {(() => {
              const swatchesMap = new Map<
                string,
                { name: string; color?: string; imageUrl: string }
              >();
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
                shippingOptions.length > 0
                  ? shippingOptions
                  : getManualShippingOptions(selectedProduct);

              return (
                <div
                  className="mt-6 space-y-4 border-t border-slate-100 pt-4"
                  id="product-options-section"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Selecciona tus opciones:</span>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200/60 lowercase">
                        (requerido)
                      </span>
                    </p>
                  </div>

                  {/* Options Validation Error Notice */}
                  {optionsValidationError && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2.5 animate-bounce shadow-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{optionsValidationError}</span>
                    </div>
                  )}

                  {/* If we have option groups (e.g. Color, Talla) */}
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
                          <div key={idx} className="space-y-2 text-left">
                            <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                              <span className="text-slate-600">{v.name}:</span>
                            </div>

                            {/* Horizontal Carousel of Color Cards */}
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x">
                              {v.options.map((opt, oIdx) => {
                                const matchingSwatch = uniqueSwatches.find(
                                  (s) =>
                                    s.name.toLowerCase() === opt.toLowerCase() ||
                                    (s.color && s.color.toLowerCase() === opt.toLowerCase()) ||
                                    s.name.toLowerCase().includes(opt.toLowerCase())
                                );
                                const imgUrl = matchingSwatch?.imageUrl;
                                const isSelected = selectedVariants[v.name] === opt;

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    title={opt}
                                    onClick={() => {
                                      const nextVariants = { ...selectedVariants, [v.name]: opt };
                                      setSelectedVariants(nextVariants);
                                      setOptionsValidationError(null);
                                      let resolvedImg = imgUrl;
                                      if (!resolvedImg && selectedProduct.variantList) {
                                        const match = selectedProduct.variantList.find(
                                          (vItem) =>
                                            (vItem.name &&
                                              vItem.name
                                                .toLowerCase()
                                                .includes(opt.toLowerCase())) ||
                                            (vItem.color &&
                                              vItem.color
                                                .toLowerCase()
                                                .includes(opt.toLowerCase()))
                                        );
                                        if (match && match.imageUrl) {
                                          resolvedImg = match.imageUrl;
                                        }
                                      }
                                      if (resolvedImg) {
                                        setSelectedProductMediaUrl(resolvedImg);
                                        const gIdx = productGalleryMedia.indexOf(resolvedImg);
                                        if (gIdx >= 0) {
                                          scrollToGalleryIndex(gIdx);
                                        }
                                      }
                                    }}
                                    className={`group snap-start flex flex-col items-center justify-between p-1 overflow-hidden rounded-xl border transition-all cursor-pointer shrink-0 relative ${
                                      imgUrl ? "w-18" : "px-3.5 py-2"
                                    } ${
                                      isSelected
                                        ? "bg-slate-950 text-white border-slate-950 shadow-md scale-[1.03]"
                                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs"
                                    }`}
                                  >
                                    {imgUrl ? (
                                      <>
                                        <div className="w-16 h-14 rounded-lg overflow-hidden relative bg-slate-100">
                                          <img
                                            src={imgUrl}
                                            alt={opt}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                        <span
                                          className={`text-[10px] font-extrabold truncate max-w-full mt-1 px-0.5 leading-tight ${
                                            isSelected ? "text-white" : "text-slate-700"
                                          }`}
                                        >
                                          {opt}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xs font-extrabold whitespace-nowrap">
                                        {opt}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // Standard non-color option buttons (e.g. Talla)
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
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-slate-950 text-white border-slate-950 shadow-sm"
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
                    <div className="space-y-2 text-left">
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                        <span className="text-slate-600">Color:</span>
                      </div>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x">
                        {uniqueSwatches.map((swatch, sIdx) => {
                          const isSelected =
                            selectedVariants["Color"] === swatch.name ||
                            selectedProductMediaUrl === swatch.imageUrl;
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
                                if (gIdx >= 0) {
                                  scrollToGalleryIndex(gIdx);
                                }
                              }}
                              className={`group snap-start flex flex-col items-center justify-between p-1 overflow-hidden rounded-xl border transition-all cursor-pointer w-18 shrink-0 relative ${
                                isSelected
                                  ? "bg-slate-950 text-white border-slate-950 shadow-md scale-[1.03]"
                                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs"
                              }`}
                            >
                              <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-100">
                                <img
                                  src={swatch.imageUrl}
                                  alt={swatch.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <span
                                className={`text-[10px] font-extrabold truncate max-w-full mt-1 px-0.5 leading-tight ${
                                  isSelected ? "text-white" : "text-slate-700"
                                }`}
                              >
                                {swatch.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Shipping Options as Buttons (like Size/Color) */}
                  <div className="space-y-1.5 text-left" id="product-shipping-options-group">
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
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex flex-wrap items-center gap-1.5 ${
                              isSelected
                                ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <span>{option.carrier}:</span>
                            <span
                              className={`font-mono ${
                                isSelected ? "text-amber-400" : "text-emerald-700"
                              }`}
                            >
                              {option.shippingCost === 0
                                ? "GRATIS ($0.00 USD)"
                                : formatPrice(option.shippingCost)}
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
                </div>
              );
            })()}

            {/* Add to Cart button integrated directly in product detail page */}
            <div
              className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-1.5 pb-[1px] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] mt-0 md:static md:z-auto md:bg-transparent md:backdrop-blur-none md:shadow-none md:px-0 md:pt-4 md:pb-0 md:mt-6 md:border-t md:border-slate-100"
              id="shipping-calculation-section"
            >
              <div className="w-full m-0 p-0">
                {(() => {
                  const missingOpts = getMissingOptions(selectedProduct, selectedVariants);
                  const hasMissingOpts = missingOpts.length > 0;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProduct.stock > 0) {
                          const currentMissing = getMissingOptions(
                            selectedProduct,
                            selectedVariants
                          );
                          if (currentMissing.length > 0 || !selectedShippingOption) {
                            setOptionsValidationError(
                              `Por favor selecciona tu ${currentMissing.join(
                                " y "
                              )} antes de añadir al carrito.`
                            );
                            document
                              .getElementById("product-options-section")
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                            return;
                          }

                          const variantStr = Object.entries(selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ");

                          const activeImageUrl =
                            selectedProductMediaUrl || selectedProduct.imageUrl;

                          const customizedProduct: Product = {
                            ...selectedProduct,
                            imageUrl: activeImageUrl,
                            name: variantStr
                              ? `${selectedProduct.name} (${variantStr})`
                              : selectedProduct.name,
                            shippingCost: selectedShippingOption.shippingCost,
                            selectedCarrier: selectedShippingOption.aging
                              ? `${selectedShippingOption.carrier} (${selectedShippingOption.aging})`
                              : selectedShippingOption.carrier,
                            selectedDeliveryTime: selectedShippingOption.aging,
                          };

                          onAddToCart(customizedProduct);
                          openCartDrawer();
                        }
                      }}
                      disabled={selectedProduct.stock <= 0}
                      className={`w-full py-3 sm:py-3.5 px-6 rounded-xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md active:scale-98 text-center ${
                        selectedProduct.stock <= 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : hasMissingOpts
                          ? "bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-500/20"
                          : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25"
                      }`}
                      id="add-to-cart-detail-btn"
                    >
                      {selectedProduct.stock <= 0 ? (
                        <span>Agotado</span>
                      ) : hasMissingOpts ? (
                        <>
                          <AlertCircle className="w-5 h-5 shrink-0 text-slate-950" />
                          <span className="whitespace-nowrap">
                            {missingOpts.length === 1
                              ? `Elegir ${missingOpts[0]}`
                              : "Elegir opciones"}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 shrink-0 text-slate-950" />
                          <span className="whitespace-nowrap">Añadir al Carrito</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
  );
}
