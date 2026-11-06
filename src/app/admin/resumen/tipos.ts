import React from "react";
import { User, Reel, Product, NavigationTab } from "../tipos";
export interface AdminViewProps {
 currentUser: User; users: User[]; reels: Reel[]; products: Product[];
 onRefreshAll: () => void; onCreatorClick: (creatorId: string) => void;
 onProductClick: (product: Product) => void; onReelClick: (reelId: string) => void;
 onNavigateToTab: (tab: NavigationTab) => void;
 setUsers: React.Dispatch<React.SetStateAction<User[]>>;
 setReels: React.Dispatch<React.SetStateAction<Reel[]>>;
 setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
 activePlatform?: "android" | "web"; onSwitchPlatform?: (platform: "android" | "web") => void;
}
export type AdminTab = "resumen" | "usuarios" | "reels" | "productos" | "publicar" | "ordenes" | "metrica" | "fotos_defecto" | "sistema";
export type DatosResumen = Record<string, any>;
