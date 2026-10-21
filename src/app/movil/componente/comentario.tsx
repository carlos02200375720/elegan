import React from "react";
import { MessageCircle } from "lucide-react";

export interface ComentarioProps {
  reelId?: string;
  id?: string;
  count?: number;
  commentsCount?: number;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
}

export function ComentarioButton({
  reelId,
  id,
  count,
  commentsCount,
  onClick,
  className = "",
  iconClassName = "",
}: ComentarioProps) {
  const totalComments = count ?? commentsCount ?? 0;
  const buttonId = id || (reelId ? `android-reel-comment-btn-${reelId}` : undefined);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors ${className}`}
      id={buttonId}
      aria-label={`Comentar, ${totalComments}`}
    >
      <MessageCircle className={`h-5 w-5 text-slate-700 ${iconClassName}`} />
      <span className="text-slate-700 font-semibold">{totalComments}</span>
    </button>
  );
}

export default ComentarioButton;
