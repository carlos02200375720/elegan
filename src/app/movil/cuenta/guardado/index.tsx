import { Product, Reel } from "../../../types";
import { useGuardadoPerfil } from "./useGuardadoPerfil";
import FiltrosGuardado from "./FiltrosGuardado";
import TarjetaProductoGuardado from "./TarjetaProductoGuardado";
import TarjetaPublicacionGuardada from "./TarjetaPublicacionGuardada";
import GuardadoVacio from "./GuardadoVacio";

export interface GuardadoPerfilProps {
  savedProducts?: Product[];
  savedReels?: Reel[];
  products?: Product[];
  reels?: Reel[];
  savedReelIds?: string[];
  onSelectProduct?: (product: Product) => void;
  onSelectReel?: (reel: Reel | string) => void;
  onToggleSaveReel?: (id: string) => void;
  onOpenFeed?: (reelId: string) => void;
}

export function GuardadoPerfilView({
  savedProducts: propSavedProducts,
  savedReels: propSavedReels,
  products = [],
  reels = [],
  savedReelIds = [],
  onSelectProduct,
  onSelectReel,
  onToggleSaveReel,
  onOpenFeed,
}: GuardadoPerfilProps) {
  const {
    savedSubTab,
    setSavedSubTab,
    resolvedSavedReels,
    resolvedSavedProducts,
    unifiedSavedItems,
    totalSavedCount,
  } = useGuardadoPerfil({
    savedProducts: propSavedProducts,
    savedReels: propSavedReels,
    products,
    reels,
    savedReelIds,
  });

  const handleReelClick = (reel: Reel) => {
    onSelectReel?.(reel);
    onOpenFeed?.(reel.id);
  };

  return (
    <div className="space-y-3" id="android-profile-saved-section">
      <FiltrosGuardado
        activeTab={savedSubTab}
        total={totalSavedCount}
        reels={resolvedSavedReels.length}
        products={resolvedSavedProducts.length}
        onChange={setSavedSubTab}
      />

      {totalSavedCount === 0 ? (
        <GuardadoVacio />
      ) : (
        <>
          {savedSubTab === "all" && (
            <div className="grid grid-cols-2 gap-2.5">
              {unifiedSavedItems.map((item, index) =>
                item.kind === "product" ? (
                  <TarjetaProductoGuardado
                    key={`saved-unified-p-${item.data.id}-${index}`}
                    product={item.data}
                    onSelect={onSelectProduct}
                    onUnsave={onToggleSaveReel}
                  />
                ) : (
                  <TarjetaPublicacionGuardada
                    key={`saved-unified-r-${item.data.id}-${index}`}
                    reel={item.data}
                    onSelect={handleReelClick}
                    onUnsave={onToggleSaveReel}
                  />
                ),
              )}
            </div>
          )}

          {savedSubTab === "reels" && (
            resolvedSavedReels.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No tienes publicaciones guardadas en tu perfil.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {resolvedSavedReels.map((reel, index) => (
                  <TarjetaPublicacionGuardada
                    key={`reel-tab-${reel.id}-${index}`}
                    reel={reel}
                    onSelect={handleReelClick}
                    onUnsave={onToggleSaveReel}
                  />
                ))}
              </div>
            )
          )}

          {savedSubTab === "products" && (
            resolvedSavedProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No tienes productos guardados en tu perfil.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {resolvedSavedProducts.map((product, index) => (
                  <TarjetaProductoGuardado
                    key={`prod-tab-${product.id}-${index}`}
                    product={product}
                    categoryLabel={product.category || "Producto"}
                    onSelect={onSelectProduct}
                    onUnsave={onToggleSaveReel}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

export { GuardadoPerfilView as Guardado };
export default GuardadoPerfilView;
