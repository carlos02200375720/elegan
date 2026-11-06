import React, { useEffect, useRef, useMemo } from "react";
import { Product } from "../../../../types";
import { AnimatePresence } from "motion/react";
import { navigateTo, parseRoute } from "../../../../router";
import ProductoIdTiendaView from "../producto/index";
import CarritoTiendaView from "../carrito/index";
import VerificasionTiendaView from "../verificasion/index";
import GraciaTiendaView from "../gracia/index";
import { ShopProps } from "./TiposCatalogo";
import { filtrarProductosCatalogo } from "./FuncionesCatalogo";
import { useEstadoCatalogo } from "./useEstadoCatalogo";
import CabeceraCatalogo from "./CabeceraCatalogo";
import CuadriculaProductos from "./CuadriculaProductos";

export default function Tienda(props: ShopProps) {
  const {
    products,
    cart,
    users,
    onAddToCart,
    onRemoveFromCart,
    onUpdateCartQuantity,
    onCreatorClick,
    onLoginSuccess,
    onNavigateToHistory,
    onStepChange,
    onRefreshProducts,
    savedReelIds = [],
    onToggleSave,
  } = props;

  const {
    activeStep,
    setActiveStep,
    selectedProduct,
    setSelectedProduct,
    showCartDrawer,
    setShowCartDrawer,
    favorites,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    displayCount,
    setDisplayCount,
    isLoadingMore,
    setIsLoadingMore,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    address,
    setAddress,
    country,
    setCountry,
    city,
    setCity,
    postalCode,
    setPostalCode,
    isFormValid,
    completedOrder,
    selectedCartIndices,
    toggleItemSelection,
    isAllCartSelected,
    toggleSelectAllCart,
    selectedCartItems,
    effectiveCheckoutItems,
    cartSubtotal,
    cartShippingTotal,
    cartTotal,
    cartItemCount,
    handleProductSelect,
    handleBackToCatalog,
    openCartDrawer,
    closeCartDrawer,
    startCheckout,
    executePayment,
  } = useEstadoCatalogo(props);

  const infiniteLoaderRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(
    () => filtrarProductosCatalogo(products, selectedCategory, searchQuery),
    [products, selectedCategory, searchQuery]
  );

  useEffect(() => {
    setDisplayCount(12);
  }, [selectedCategory, searchQuery, setDisplayCount]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (activeStep !== "catalog") return;

    const handleWindowScroll = () => {
      if (isLoadingMore || filteredProducts.length === 0) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 500;
      if (scrollPosition >= threshold) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayCount((prev) => prev + 8);
          setIsLoadingMore(false);
        }, 200);
      }
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    const target = infiniteLoaderRef.current;
    let observer: IntersectionObserver | null = null;

    if (target) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && filteredProducts.length > 0) {
            setIsLoadingMore(true);
            setTimeout(() => {
              setDisplayCount((prev) => prev + 8);
              setIsLoadingMore(false);
            }, 200);
          }
        },
        { threshold: 0, rootMargin: "600px" }
      );
      observer.observe(target);
    }

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      if (observer) observer.disconnect();
    };
  }, [activeStep, isLoadingMore, filteredProducts.length, setDisplayCount, setIsLoadingMore]);

  const displayedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return [];
    const result: Product[] = [];
    for (let i = 0; i < displayCount; i++) {
      result.push(filteredProducts[i % filteredProducts.length]);
    }
    return result;
  }, [filteredProducts, displayCount]);

  const isDetailSavedOrFavorite = Boolean(
    selectedProduct &&
      (savedReelIds.includes(selectedProduct.id) || favorites.includes(selectedProduct.id))
  );

  return (
    <div
      className="w-full min-h-screen bg-white relative flex flex-col no-scrollbar"
      id="shop-panel"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Shop Navigation Header */}
      <CabeceraCatalogo
        activeStep={activeStep}
        selectedProduct={selectedProduct}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        cartItemCount={cartItemCount}
        openCartDrawer={openCartDrawer}
        handleBackToCatalog={handleBackToCatalog}
        isSavedOrFavorite={isDetailSavedOrFavorite}
        onToggleSaveProduct={() => {
          if (!selectedProduct) return;
          if (onToggleSave) {
            onToggleSave(selectedProduct.id);
          } else {
            toggleFavorite(selectedProduct.id);
          }
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 p-0 relative">
        <AnimatePresence mode="wait">
          {/* 1. CATALOG STEP */}
          {activeStep === "catalog" && (
            <div
              className="flex flex-col space-y-4 p-3 sm:p-5 pt-3 pb-28 sm:pb-24"
              style={{
                paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <CuadriculaProductos
                products={products}
                displayedProducts={displayedProducts}
                filteredProductsCount={filteredProducts.length}
                users={users}
                savedReelIds={savedReelIds}
                favorites={favorites}
                isLoadingMore={isLoadingMore}
                infiniteLoaderRef={infiniteLoaderRef}
                onSelectProduct={handleProductSelect}
                onToggleSave={(id) => {
                  if (onToggleSave) {
                    onToggleSave(id);
                  } else {
                    toggleFavorite(id);
                  }
                }}
                onRefreshProducts={onRefreshProducts}
                onResetFilters={() => {
                  setSearchQuery("");
                  setSelectedCategory("todos");
                }}
              />
            </div>
          )}

          {/* 2. PRODUCT DETAIL STEP */}
          {activeStep === "detail" && (
            <ProductoIdTiendaView
              selectedProduct={selectedProduct}
              users={users}
              handleBackToCatalog={handleBackToCatalog}
              onCreatorClick={onCreatorClick}
              onAddToCart={onAddToCart}
              openCartDrawer={openCartDrawer}
              onProductViewsUpdated={(prodId, views) => {
                setSelectedProduct((prev) =>
                  prev && prev.id === prodId ? { ...prev, views } : prev
                );
              }}
            />
          )}

          {/* 3 & 4. CHECKOUT FORM & PAYMENT GATEWAY STEP */}
          {(activeStep === "checkout" || activeStep === "payment") && (
            <VerificasionTiendaView
              activeStep={activeStep}
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              address={address}
              setAddress={setAddress}
              country={country}
              setCountry={setCountry}
              city={city}
              setCity={setCity}
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              isFormValid={isFormValid}
              effectiveCheckoutItems={effectiveCheckoutItems}
              cartSubtotal={cartSubtotal}
              cartShippingTotal={cartShippingTotal}
              cartTotal={cartTotal}
              executePayment={executePayment}
            />
          )}

          {/* 5. THANK YOU STEP */}
          {activeStep === "thankyou" && (
            <GraciaTiendaView
              completedOrder={completedOrder}
              orderId={
                typeof window !== "undefined" && parseRoute(window.location.pathname).type === "thankyou"
                  ? (parseRoute(window.location.pathname) as any).orderId || completedOrder?.id
                  : completedOrder?.id
              }
              onLoginSuccess={onLoginSuccess}
              onContinueShopping={() => {
                setActiveStep("catalog");
                setSelectedProduct(null);
                navigateTo("/tienda/catalogo");
                onStepChange?.("catalog");
              }}
              onViewOrderHistory={() => {
                if (completedOrder?.autoCreatedUser?.user && onLoginSuccess) {
                  onLoginSuccess(completedOrder.autoCreatedUser.user);
                } else {
                  onNavigateToHistory();
                }
                setActiveStep("catalog");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Cart Slider Drawer */}
      <CarritoTiendaView
        showCartDrawer={showCartDrawer}
        closeCartDrawer={closeCartDrawer}
        cart={cart}
        cartItemCount={cartItemCount}
        selectedCartIndices={selectedCartIndices}
        isAllCartSelected={isAllCartSelected}
        toggleSelectAllCart={toggleSelectAllCart}
        toggleItemSelection={toggleItemSelection}
        onRemoveFromCart={onRemoveFromCart}
        onUpdateCartQuantity={onUpdateCartQuantity}
        onSelectProductFromCart={(prod) => {
          setShowCartDrawer(false);
          handleProductSelect(prod);
        }}
        selectedCartItems={selectedCartItems}
        cartSubtotal={cartSubtotal}
        cartShippingTotal={cartShippingTotal}
        cartTotal={cartTotal}
        startCheckout={startCheckout}
      />
    </div>
  );
}

export const Catalogo = Tienda;
export const CatalogoTiendaView = Tienda;
export const Shop = Tienda;
export const ShopView = Tienda;
export { Tienda };
