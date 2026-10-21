import React from "react";
import { Heart } from "lucide-react";

export interface LikeProps {
  reelId?: string;
  id?: string;
  likes?: number;
  isLiked?: boolean;
  onClick?: () => void;
  onLike?: () => void;
  className?: string;
  iconClassName?: string;
}

export function LikeButton({
  reelId,
  id,
  likes = 0,
  isLiked = false,
  onClick,
  onLike,
  className = "",
  iconClassName = "",
}: LikeProps) {
  const handleClick = onClick || onLike;
  const buttonId = id || (reelId ? `android-reel-like-btn-${reelId}` : undefined);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors ${className}`}
      id={buttonId}
      aria-label={`Me gusta, ${likes}`}
    >
      <Heart
        className={`h-5 w-5 transition-colors duration-150 ${
          isLiked ? "text-red-600 fill-red-600" : "text-slate-700 fill-none"
        } ${iconClassName}`}
      />
      <span className="text-slate-700 font-semibold">{likes}</span>
    </button>
  );
}

export default LikeButton;
