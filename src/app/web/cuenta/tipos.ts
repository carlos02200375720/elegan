import { User, Product } from "../../../types";

export interface PerfilProps {
  currentUser: User;
  selectedCreatorId: string | null; // Null means we view our own profile
  users: User[];
  products?: Product[];
  savedReelIds?: string[];
  onToggleSave?: (id: string) => void;
  onBackToSelf: () => void;
  onOpenDirectChat: (user: User) => void;
  onSelectProduct: (product: Product) => void;
  onSelectReel: (reelId: string) => void;
  onProfileUpdate?: (updatedUser: User) => void;
  onRefreshUsers?: () => void;
  onPublishSuccess?: () => void;
  onLogout?: () => void;
  socket?: WebSocket | null;
  initialSubTab?: "saved" | "orders" | "edit";
  onClearInitialSubTab?: () => void;
}

export type ProfileViewProps = PerfilProps;

