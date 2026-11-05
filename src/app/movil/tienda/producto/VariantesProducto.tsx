import React from "react";
import { AlertCircle } from "lucide-react";
import { Product } from "../../../../types";
import { getMediaUrl } from "../../../../config";
import { VariantGroup, VariantSwatch } from "./TiposProducto";

export interface VariantesProductoProps {
  selectedProduct: Product;
  effectiveVariantGroups: VariantGroup[];
  uniqueSwatches: VariantSwatch[];
  selectedVariants: { [key: string]: string };
  onSelectVariant: (groupName: string, optionValue: string) => void;
  selectedProductMediaUrl: string;
  onSelectMediaUrl: (url: string) => void;
  productGalleryMedia: string[];
  onScrollToGalleryIndex: (index: number) => void;
  optionsValidationError: string | null;
}

export const VariantesProducto: React.FC<VariantesProductoProps> = ({
  selectedProduct,
  effectiveVariantGroups,
  uniqueSwatches,
  selectedVariants,
  onSelectVariant,
  selectedProductMediaUrl,
  onSelectMediaUrl,
  productGalleryMedia,
  onScrollToGalleryIndex,
  optionsValidationError,
}) => {
  const hasOptionGroups = effectiveVariantGroups.length > 0;

  if (!hasOptionGroups && uniqueSwatches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5" id="android-product-variants-container">
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
              (selectedProduct.variants && selectedProduct.variants.length === 1 && uniqueSwatches.length > 0));

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
                    const imgUrl =
                      matchingSwatch?.imageUrl ||
                      (fallbackVariantItem?.imageUrl ? getMediaUrl(fallbackVariantItem.imageUrl) : undefined);
                    const isSelected =
                      selectedVariants[v.name] === opt ||
                      Boolean(imgUrl && selectedProductMediaUrl === imgUrl && !selectedVariants[v.name]);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        title={opt}
                        onClick={() => {
                          onSelectVariant(v.name, opt);
                          if (imgUrl) {
                            onSelectMediaUrl(imgUrl);
                            const gIdx = productGalleryMedia.indexOf(imgUrl);
                            if (gIdx !== -1) {
                              onScrollToGalleryIndex(gIdx);
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
                        onSelectVariant(v.name, opt);
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
                    onSelectMediaUrl(swatch.imageUrl);
                    onSelectVariant("Color", swatch.name);
                    const gIdx = productGalleryMedia.indexOf(swatch.imageUrl);
                    if (gIdx !== -1) {
                      onScrollToGalleryIndex(gIdx);
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
    </div>
  );
};

export default VariantesProducto;
