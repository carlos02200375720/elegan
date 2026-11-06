import React from "react";
import { User, Product, Reel } from "../tipos";
import UserPublicationsFeed from "../components/UserPublicationsFeed";
import { apiFetch } from "../config";
import { AnimatePresence } from "motion/react";

interface FeedPublicacionesProps {
  activeFeedReelId: string | null;
  profileUser: User | null;
  currentUser: User;
  isSelf: boolean;
  activeSubTab: "saved" | "orders" | "edit";
  savedReels: Reel[];
  userReels: Reel[];
  products: Product[];
  setUserReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  setSavedReels: React.Dispatch<React.SetStateAction<Reel[]>>;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onPublishSuccess?: () => void;
}

export default function FeedPublicaciones(props: FeedPublicacionesProps) {
  const {
    activeFeedReelId, profileUser, currentUser, isSelf, activeSubTab,
    savedReels, userReels, products, setUserReels, setSavedReels,
    onClose, onSelectProduct, onPublishSuccess,
  } = props;

  return (
    <>
      {/* COMPONENTE EXCLUSIVO PARA MOSTRAR LA LISTA DE PUBLICACIONES DE UN USUARIO */}
      <AnimatePresence>
        {activeFeedReelId && (
          <UserPublicationsFeed
            user={profileUser || currentUser}
            reels={
              (isSelf && activeSubTab === "saved" ? savedReels : userReels).some((r) => r.id === activeFeedReelId)
                ? isSelf && activeSubTab === "saved"
                  ? savedReels
                  : userReels
                : userReels.some((r) => r.id === activeFeedReelId)
                ? userReels
                : savedReels.some((r) => r.id === activeFeedReelId)
                ? savedReels
                : [...userReels, ...savedReels.filter((sr) => !userReels.some((ur) => ur.id === sr.id))]
            }
            products={products}
            initialReelId={activeFeedReelId}
            currentUser={currentUser}
            onClose={() => onClose()}
            onSelectProduct={onSelectProduct}
            onDeleteReel={(reelId) => {
              setUserReels((prev) => prev.filter((r) => r.id !== reelId));
              if (onPublishSuccess) onPublishSuccess();
            }}
            onUpdateReels={(updatedReels) => {
              if (activeSubTab === "saved") {
                setSavedReels(updatedReels);
              } else {
                setUserReels(updatedReels);
              }
            }}
            savedReelIds={currentUser.savedReelIds || []}
            onToggleSaveReel={(reelId) => {
              apiFetch(`/api/users/${currentUser.id}/save-reel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reelId }),
              }).catch(() => {});
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
