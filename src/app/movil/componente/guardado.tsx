import React from "react";
import { Bookmark } from "lucide-react";

export interface GuardadoProps {
  reelId?: string;
  id?: string;
  saves?: number;
  savesCount?: number;
  isSaved?: boolean;
  onClick?: () => void;
  onToggleSave?: () => void;
  className?: string;
  iconClassName?: string;
}

export function GuardadoButton({
  reelId,
  id,
  saves,
  savesCount,
  isSaved = false,
  onClick,
  onToggleSave,
  className = "",
  iconClassName = "",
}: GuardadoProps) {
  const handleClick = onClick || onToggleSave;
  const totalSaves = saves ?? savesCount ?? 0;
  const buttonId = id || (reelId ? `android-reel-save-btn-${reelId}` : undefined);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors ${className}`}
      id={buttonId}
      aria-label={`Guardar, ${totalSaves}`}
    >
      <Bookmark
        className={`h-5 w-5 transition-colors duration-150 ${
          isSaved ? "text-amber-500 fill-amber-500" : "text-slate-700 fill-none"
        } ${iconClassName}`}
      />
      <span className="text-slate-700 font-semibold">{totalSaves}</span>
    </button>
  );
}

export default GuardadoButton;
