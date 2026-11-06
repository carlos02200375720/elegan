import React, { useState, useEffect, useRef, useMemo } from "react";
import { CATEGORIES } from "./ConstantesCatalogo";

interface CarruselCategoriasProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function CarruselCategorias({
  selectedCategory,
  onSelectCategory,
}: CarruselCategoriasProps) {
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const isCategoryInteractingRef = useRef(false);
  const categoryHasMovedRef = useRef(false);
  const categoryResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [categoryStartX, setCategoryStartX] = useState(0);
  const [categoryScrollLeft, setCategoryScrollLeft] = useState(0);

  // Duplicated list of categories for seamless infinite loop
  const infiniteCategories = useMemo(() => [...CATEGORIES, ...CATEGORIES], []);

  // Smooth infinite horizontal continuous motion
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const speed = 0.5;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const track = categoryTrackRef.current;
      if (
        track &&
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
    };
  }, [isCategoryDragging, isCategoryHovered]);

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

  const selectedCatObj = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="w-full relative group/categories border-t border-slate-50/80 pt-0.5 pb-1">
      {selectedCategory !== "todos" && (
        <div className="flex items-center justify-end mb-0.5 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => onSelectCategory("todos")}
            className="text-[9.5px] font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
          >
            Limpiar filtro ({selectedCatObj?.name})
          </button>
        </div>
      )}

      <div
        ref={categoryTrackRef}
        onMouseEnter={() => setIsCategoryHovered(true)}
        onMouseDown={handleCategoryMouseDown}
        onMouseLeave={handleCategoryMouseLeave}
        onMouseUp={handleCategoryMouseUp}
        onMouseMove={handleCategoryMouseMove}
        onWheel={handleCategoryWheel}
        onTouchStart={handleCategoryTouchStart}
        onTouchEnd={handleCategoryTouchEnd}
        className={`flex items-center space-x-2.5 sm:space-x-3.5 overflow-x-auto pb-0.5 pt-0.5 px-3 sm:px-5 select-none no-scrollbar ${
          isCategoryDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          height: "56px",
        }}
      >
        {infiniteCategories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={`${cat.id}-${idx}`}
              type="button"
              onClick={() => {
                if (categoryHasMovedRef.current) return;
                onSelectCategory(cat.id);
              }}
              className="flex flex-col items-center space-y-1 shrink-0 outline-none group focus:outline-none cursor-pointer select-none"
              style={{ width: "52px" }}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-[1.5px] transition-all relative flex items-center justify-center bg-white ${
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/20 scale-105 shadow-xs"
                    : "border-slate-100 group-hover:border-slate-300"
                }`}
              >
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <span
                className={`text-[8.5px] sm:text-[9.5px] leading-tight text-center font-bold tracking-tight line-clamp-1 w-full transition-colors ${
                  isSelected
                    ? "text-amber-600 font-extrabold"
                    : "text-slate-500 group-hover:text-slate-800"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { CarruselCategorias };
