import React, { useRef, useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { AndroidCategory } from "./TiposCatalogo";

export interface FiltrosCatalogoProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categoriesList: AndroidCategory[];
  isCategoryVisible: boolean;
}

export const FiltrosCatalogo: React.FC<FiltrosCatalogoProps> = ({
  activeCategory,
  setActiveCategory,
  categoriesList,
  isCategoryVisible,
}) => {
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const isCategoryInteractingRef = useRef(false);
  const categoryHasMovedRef = useRef(false);
  const categoryResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [categoryStartX, setCategoryStartX] = useState(0);
  const [categoryScrollLeft, setCategoryScrollLeft] = useState(0);

  const infiniteCategories = useMemo(() => {
    if (categoriesList.length === 0) return [];
    return [...categoriesList, ...categoriesList];
  }, [categoriesList]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const speed = 0.45;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const track = categoryTrackRef.current;
      if (
        track &&
        isCategoryVisible &&
        !isCategoryDragging &&
        !isCategoryHovered &&
        !isCategoryInteractingRef.current
      ) {
        track.scrollLeft += speed * delta;
        const singleSetWidth = track.scrollWidth / 2;
        if (singleSetWidth > 0 && track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        } else if (track.scrollLeft <= 0) {
          track.scrollLeft += singleSetWidth;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (categoryResumeTimeoutRef.current) {
        clearTimeout(categoryResumeTimeoutRef.current);
      }
    };
  }, [isCategoryDragging, isCategoryHovered, isCategoryVisible]);

  const handleCategoryMouseDown = (e: React.MouseEvent) => {
    if (!categoryTrackRef.current) return;
    setIsCategoryDragging(true);
    categoryHasMovedRef.current = false;
    setCategoryStartX(e.pageX - categoryTrackRef.current.offsetLeft);
    setCategoryScrollLeft(categoryTrackRef.current.scrollLeft);
  };

  const handleCategoryMouseLeave = () => {
    setIsCategoryDragging(false);
    setIsCategoryHovered(false);
  };

  const handleCategoryMouseUp = () => {
    setIsCategoryDragging(false);
    setTimeout(() => {
      categoryHasMovedRef.current = false;
    }, 60);
  };

  const handleCategoryMouseMove = (e: React.MouseEvent) => {
    if (!isCategoryDragging || !categoryTrackRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryTrackRef.current.offsetLeft;
    const walk = (x - categoryStartX) * 1.5;
    if (Math.abs(walk) > 4) {
      categoryHasMovedRef.current = true;
    }
    categoryTrackRef.current.scrollLeft = categoryScrollLeft - walk;
  };

  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (!categoryTrackRef.current) return;
    if (e.deltaY !== 0 || e.deltaX !== 0) {
      categoryTrackRef.current.scrollLeft += e.deltaY || e.deltaX;
      isCategoryInteractingRef.current = true;
      if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
      categoryResumeTimeoutRef.current = setTimeout(() => {
        isCategoryInteractingRef.current = false;
      }, 1200);
    }
  };

  const handleCategoryTouchStart = () => {
    isCategoryInteractingRef.current = true;
    if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
  };

  const handleCategoryTouchEnd = () => {
    if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
    categoryResumeTimeoutRef.current = setTimeout(() => {
      isCategoryInteractingRef.current = false;
    }, 1500);
  };

  return (
    <div
      id="android-category-carousel-container"
      style={{ overflowAnchor: "none" }}
      className={`w-full bg-white overflow-hidden transition-all duration-300 ease-out border-b will-change-[max-height,opacity] ${
        isCategoryVisible
          ? "max-h-20 opacity-100 border-slate-100 pointer-events-auto"
          : "max-h-0 opacity-0 pointer-events-none border-transparent"
      }`}
    >
      <div className="py-1 px-2 flex items-center gap-1.5" id="android-category-carousel-inner">
        {activeCategory !== "Todos" && activeCategory !== "todos" && (
          <button
            type="button"
            onClick={() => setActiveCategory("Todos")}
            className="shrink-0 z-10 flex items-center space-x-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-full text-[8.5px] font-bold border border-amber-500/30 active:scale-95 transition-all shadow-xs"
            title="Restablecer filtro a Todos"
          >
            <span className="truncate max-w-[55px]">
              {categoriesList.find(
                (c) => c.name.toLowerCase() === activeCategory.toLowerCase() || c.id === activeCategory
              )?.name || activeCategory}
            </span>
            <X className="w-2.5 h-2.5 shrink-0" />
          </button>
        )}
        <div
          ref={categoryTrackRef}
          onMouseDown={handleCategoryMouseDown}
          onMouseLeave={handleCategoryMouseLeave}
          onMouseUp={handleCategoryMouseUp}
          onMouseMove={handleCategoryMouseMove}
          onMouseEnter={() => setIsCategoryHovered(true)}
          onWheel={handleCategoryWheel}
          onTouchStart={handleCategoryTouchStart}
          onTouchEnd={handleCategoryTouchEnd}
          onTouchCancel={handleCategoryTouchEnd}
          className={`flex-1 flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 select-none ${
            isCategoryDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {infiniteCategories.map((cat, idx) => {
            const isSelected =
              activeCategory.toLowerCase() === cat.name.toLowerCase() ||
              activeCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={`${cat.id || cat.name}-${idx}`}
                type="button"
                onClick={() => {
                  if (!categoryHasMovedRef.current) {
                    setActiveCategory(cat.name);
                  }
                }}
                className="flex flex-col items-center shrink-0 outline-none group focus:outline-none cursor-pointer select-none active:scale-95 transition-transform w-[42px]"
              >
                <div
                  className={`w-7 h-7 rounded-full overflow-hidden border-[1.5px] transition-all relative flex items-center justify-center bg-slate-50 ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/25 scale-105 shadow-xs"
                      : "border-slate-200 group-hover:border-slate-300"
                  }`}
                >
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-200 group-hover:scale-110"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80";
                    }}
                  />
                </div>
                <span
                  className={`text-[8px] leading-tight text-center truncate w-full mt-0.5 transition-colors ${
                    isSelected
                      ? "text-amber-600 font-bold"
                      : "text-slate-600 font-medium group-hover:text-slate-900"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FiltrosCatalogo;
