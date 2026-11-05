import React from "react";

import { getMediaUrl } from "../../../config";

interface SeccionCategoriasProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string) => void;
  getCategoryImage: (category: string) => string | undefined;
}

export default function SeccionCategorias({
  categories,
  selectedCategory,
  onSelectCategory,
  getCategoryImage,
}: SeccionCategoriasProps) {
  return (
    <section aria-label="Categorías" className="w-full px-3 pt-3 pb-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Categorías</h2>
        <span className="text-[10px] text-slate-500">Desliza para ver más</span>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const categoryImage = getCategoryImage(category);
          const isActive = (selectedCategory || "Todos").toLowerCase() === category.toLowerCase();
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              aria-pressed={isActive}
              className={`flex min-w-0 flex-[0_0_calc((100%-24px)/4)] flex-col items-center gap-1.5 rounded-xl px-1 py-1 transition-colors ${isActive ? "bg-amber-50" : "bg-transparent"}`}
            >
              <span className={`flex aspect-[9/19] w-full items-center justify-center overflow-hidden rounded-xl border-2 bg-slate-100 ${isActive ? "border-amber-500" : "border-slate-200"}`}>
                {categoryImage ? (
                  <img src={getMediaUrl(categoryImage)} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-slate-400">{category.charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span className="w-full truncate text-center text-[10px] font-semibold text-slate-700">{category}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
