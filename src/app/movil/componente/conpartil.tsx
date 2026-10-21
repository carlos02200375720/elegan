import React from "react";
import { Share2 } from "lucide-react";

export interface ConpartilProps {
  reelId?: string;
  id?: string;
  shares?: number;
  sharesCount?: number;
  onClick?: () => void;
  onShare?: () => void;
  className?: string;
  iconClassName?: string;
}

export function ConpartilButton({
  reelId,
  id,
  shares,
  sharesCount,
  onClick,
  onShare,
  className = "",
  iconClassName = "",
}: ConpartilProps) {
  const handleClick = onClick || onShare;
  const totalShares = shares ?? sharesCount ?? 0;
  const buttonId = id || (reelId ? `android-reel-share-btn-${reelId}` : undefined);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors ${className}`}
      id={buttonId}
      aria-label={`Compartir, ${totalShares}`}
    >
      <Share2 className={`h-5 w-5 text-slate-700 ${iconClassName}`} />
      <span className="text-slate-700 font-semibold">{totalShares}</span>
    </button>
  );
}

export { ConpartilButton as CompartirButton };
export default ConpartilButton;
