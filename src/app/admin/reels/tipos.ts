import React from "react";
import { Reel } from "../../../types";

export interface ReelsAdminProps {
  reels: Reel[];
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  onReelClick: (reelId: string) => void;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
  onRequestDeleteReel?: (target: { type: "reel"; id: string; name: string }) => void;
}

export interface ReelEliminar {
  id: string;
  name: string;
}

export interface EstadoReels {
  reelSearch: string;
  setReelSearch: (value: string) => void;
  filteredReels: Reel[];
  localDeletingReel: ReelEliminar | null;
  setLocalDeletingReel: (value: ReelEliminar | null) => void;
  isDeleting: boolean;
  confirmLocalDeleteReel: () => Promise<void>;
}
