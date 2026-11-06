import { useMemo, useState } from "react";
import { Reel } from "../tipos";
import { apiFetch } from "../config";
import { EstadoReels, ReelEliminar } from "./tipos";

interface Props {
  reels: Reel[];
  setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  onStatusMessage?: (msg: { type: "success" | "error" | "info"; text: string } | null) => void;
}

export function useEstadoReels({ reels, setReels, onStatusMessage }: Props): EstadoReels {
  const [reelSearch, setReelSearch] = useState("");
  const [localDeletingReel, setLocalDeletingReel] = useState<ReelEliminar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const notify = (msg: { type: "success" | "error" | "info"; text: string }) => {
    if (onStatusMessage) {
      onStatusMessage(msg);
      setTimeout(() => onStatusMessage(null), 4000);
    }
  };

  const filteredReels = useMemo(() => {
    const q = reelSearch.toLowerCase().trim();
    if (!q) return reels;
    return reels.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.creatorName.toLowerCase().includes(q) ||
        (r.creatorUsername && r.creatorUsername.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q)
    );
  }, [reels, reelSearch]);

  const confirmLocalDeleteReel = async () => {
    if (!localDeletingReel) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/reels/${localDeletingReel.id}`, { method: "DELETE" });
      if (res) {
        setReels((prev) => prev.filter((r) => r.id !== localDeletingReel.id));
        notify({
          type: "success",
          text: `Reel "${localDeletingReel.name}" eliminado del sistema.`,
        });
      }
    } catch (err: any) {
      console.error("Error deleting reel in admin:", err);
      notify({
        type: "error",
        text: err.message || "Error al procesar la eliminación",
      });
    } finally {
      setIsDeleting(false);
      setLocalDeletingReel(null);
    }
  };

  return {
    reelSearch,
    setReelSearch,
    filteredReels,
    localDeletingReel,
    setLocalDeletingReel,
    isDeleting,
    confirmLocalDeleteReel,
  };
}
