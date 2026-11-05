import React from "react";
import { User, Reel, Product } from "../../../types";
import AndroidUserPublicationsFeed from "../componente/Feedperfil";
import AndroidPublishView from "../publicasion";
import ConfigPerfilView from "./config";
import ModalEliminarPublicacion from "./ModalEliminarPublicacion";

interface ModalesPerfilProps {
  selectedFeedReelId: string | null;
  onCloseFeed: () => void;
  activeUser: User;
  userReels: Reel[];
  products: Product[];
  currentUser: User;
  onSelectProduct?: (product: Product) => void;
  onDeleteReel: (reelId: string) => void;
  savedReelIds: string[];
  onToggleSaveReel?: (reelId: string) => void;
  isPublishingOpen: boolean;
  onClosePublishing: () => void;
  onPublishSuccess?: () => void;
  userProducts: Product[];
  isEditProfileOpen: boolean;
  onProfileUpdate?: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onLogout: () => void;
  onCloseConfig: () => void;
  publicationToDelete: Reel | null;
  isDeletingPublication: boolean;
  deleteErrorMessage: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: (reel: Reel) => void;
}

export default function ModalesPerfil(props: ModalesPerfilProps) {
  const {
    selectedFeedReelId, onCloseFeed, activeUser, userReels, products, currentUser,
    onSelectProduct, onDeleteReel, savedReelIds, onToggleSaveReel,
    isPublishingOpen, onClosePublishing, onPublishSuccess, userProducts,
    isEditProfileOpen, onProfileUpdate, onUpdateUser, onLogout, onCloseConfig,
    publicationToDelete, isDeletingPublication, deleteErrorMessage,
    onCancelDelete, onConfirmDelete,
  } = props;

  return (
            {/* Publications Feed Modal */}
            {selectedFeedReelId && (
              <AndroidUserPublicationsFeed
                user={activeUser}
                reels={userReels}
                products={products}
                initialReelId={selectedFeedReelId}
                currentUser={currentUser}
                onClose={() => setSelectedFeedReelId(null)}
                onSelectProduct={onSelectProduct}
                onDeleteReel={handleDeletePublication}
                savedReelIds={savedReelIds}
                onToggleSaveReel={onToggleSaveReel}
              />
            )}
      
            {/* Standalone Publish Modal for Android */}
            {isPublishingOpen && (
              <AndroidPublishView
                currentUser={currentUser}
                onBack={() => setIsPublishingOpen(false)}
                onSuccess={() => {
                  setIsPublishingOpen(false);
                  onPublishSuccess?.();
                }}
                userProducts={userProducts}
              />
            )}
      
            {/* Edit Profile Sheet (Imported from ./config) */}
            <ConfigPerfilView
              isOpen={isEditProfileOpen}
              activeUser={activeUser}
              currentUser={currentUser}
              onProfileUpdate={onProfileUpdate}
              onUpdateUser={onUpdateUser}
              onLogout={onLogout}
              onClose={() => {
                setIsEditProfileOpen(false);
                navigateTo(getProfilePath(activeUser));
              }}      />
      
            <ModalEliminarPublicacion
              publication={publicationToDelete}
              isDeleting={isDeletingPublication}
              errorMessage={deleteErrorMessage}
              onCancel={() => setPublicationToDelete(null)}
              onConfirm={executeDeletePublication}
            />
      
  );
}
