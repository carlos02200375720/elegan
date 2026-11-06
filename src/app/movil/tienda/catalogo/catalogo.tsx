import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product, CartItem, Order } from "../../../../types";
import { navigateTo, getProductPath, parseRoute } from "../../enrutador";
import ProductoIdTiendaView from "../producto";
import CarritoTiendaView from "../carrito";
import VerificacionTiendaView from "../verificacion";
import GraciaTiendaView from "../gracia";
import {
  AndroidShopProps,
  AndroidCheckoutForm,
  DisplayProductItem,
} from "./TiposCatalogo";
import {
  buildCategoriesList,
  filterProducts,
  calculateCartSubtotal,
  calculateCartShippingTotal,
} from "./FuncionesCatalogo";
import { CabeceraCatalogo } from "./CabeceraCatalogo";
import { FiltrosCatalogo } from "./FiltrosCatalogo";
import { CuadriculaProductos } from "./CuadriculaProductos";

export default function Catalogo({
  products,
  onAddToCart,
  cart,
  currentUser,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  users,
  onSelectProduct,
  onCreatorClick,
  onOrderPlaced,
  initialSelectedProduct,
  selectedProductDirectly,
  clearDirectProduct,
  onClearInitialProduct,
  onCheckout,
  requiresLoginForCheckout = false,
  onLoginRequiredForCheckout,
  isLoading = false,
  onRefreshProducts,
  cartDrawerRequest = 0,
  onToggleDetailView,
  onToggleCart,
  initialStep,
  onClearInitialStep,
  initialSelectedCartIndices,
  savedReelIds = [],
  onToggleSave,
  onBackToCatalog,
  onNavigateToHistory,
  initialCategory,
}: AndroidShopProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory || "Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCategoryVisible, setIsCategoryVisible] = useState(true);
  const isCategoryVisibleRef = useRef(true);
  const infiniteLoaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialCategory]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (selectedProductDirectly || initialSelectedProduct) {
      return selectedProductDirectly || initialSelectedProduct || null;
    }
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "product" && Array.isArray(products)) {
        return (
          products.find(
            (p) =>
              p.id === parsed.productId ||
              (p as any)._id === parsed.productId ||
              (parsed.productSlug && p.id === parsed.productSlug)
          ) || null
        );
      }
    }
    return null;
  });

  // Asegurar que al abrir un producto el scroll se restablezca arriba
  useEffect(() => {
    if (selectedProduct) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const appLayout = document.getElementById("android-app-layout");
      if (appLayout) appLayout.scrollTop = 0;
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [selectedProduct?.id]);

  const [isCartOpen, setIsCartOpen] = useState(() => {
    if (initialStep === "cart") return true;
    if (
      typeof window !== "undefined" &&
      /^\/(?:tienda\/|shop\/)?(?:carrito|cart)$/i.test(window.location.pathname.replace(/\/+$/, ""))
    ) {
      return true;
    }
    return false;
  });

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCheckoutPage, setShowCheckoutPage] = useState(() => {
    if (initialStep === "checkout") return true;
    if (
      typeof window !== "undefined" &&
      /^\/(?:tienda\/|shop\/)?(?:verificacion|checkout)$/i.test(window.location.pathname.replace(/\/+$/, ""))
    ) {
      return true;
    }
    return false;
  });

  const [showThankYouPage, setShowThankYouPage] = useState(() => {
    if (initialStep === "thankyou") return true;
    if (
      typeof window !== "undefined" &&
      /^\/(?:tienda\/|shop\/)?(?:gracia|gracias|thankyou|thank-you)$/i.test(window.location.pathname.replace(/\/+$/, ""))
    ) {
      return true;
    }
    return false;
  });

  // Selección de items del carrito
  const [selectedCartIndices, setSelectedCartIndices] = useState<number[]>(() => {
    if (initialSelectedCartIndices && initialSelectedCartIndices.length > 0) {
      return initialSelectedCartIndices;
    }
    return (cart || []).map((_, i) => i);
  });

  useEffect(() => {
    if (initialSelectedCartIndices && initialSelectedCartIndices.length > 0) {
      setSelectedCartIndices(initialSelectedCartIndices);
    }
  }, [initialSelectedCartIndices]);

  useEffect(() => {
    setSelectedCartIndices((prev) => {
      if (!cart || cart.length === 0) return [];
      const valid = prev.filter((i) => i < cart.length);
      if (valid.length > 0) return valid;
      return cart.map((_, i) => i);
    });
  }, [cart?.length]);

  const toggleSelectCartItem = (idx: number) => {
    setSelectedCartIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const isAllCartSelected = cart.length > 0 && selectedCartIndices.length === cart.length;

  const toggleSelectAllCart = () => {
    if (isAllCartSelected) {
      setSelectedCartIndices([]);
    } else {
      setSelectedCartIndices(cart.map((_, i) => i));
    }
  };

  const selectedCartItems = useMemo(() => {
    return (cart || []).filter((_, idx) => selectedCartIndices.includes(idx));
  }, [cart, selectedCartIndices]);

  const effectiveCheckoutItems = useMemo(() => {
    return selectedCartItems.length > 0 ? selectedCartItems : cart || [];
  }, [selectedCartItems, cart]);

  // Ruta directa a checkout, cart o thankyou iniciada desde props
  useEffect(() => {
    if (initialStep === "checkout") {
      setIsCartOpen(false);
      setSelectedProduct(null);
      setShowThankYouPage(false);
      setShowCheckoutPage(true);
    } else if (initialStep === "cart") {
      setShowCheckoutPage(false);
      setShowThankYouPage(false);
      setIsCartOpen(true);
    } else if (initialStep === "thankyou") {
      setIsCartOpen(false);
      setSelectedProduct(null);
      setShowCheckoutPage(false);
      setShowThankYouPage(true);
    }
  }, [initialStep]);

  // Sincronización con popstate y app-route-change
  useEffect(() => {
    const syncStepFromUrl = () => {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "cart") {
        setIsCartOpen(true);
        setShowCheckoutPage(false);
        setShowThankYouPage(false);
      } else if (parsed.type === "checkout") {
        setIsCartOpen(false);
        setShowThankYouPage(false);
        setShowCheckoutPage(true);
      } else if (parsed.type === "thankyou") {
        setIsCartOpen(false);
        setShowCheckoutPage(false);
        setShowThankYouPage(true);
      } else if (parsed.type === "product") {
        setIsCartOpen(false);
        setShowCheckoutPage(false);
        setShowThankYouPage(false);
        const matched = (products || []).find(
          (p) =>
            p.id === parsed.productId ||
            (p as any)._id === parsed.productId ||
            (parsed.productSlug && p.id === parsed.productSlug)
        );
        if (matched) {
          setSelectedProduct(matched);
        }
      } else if (parsed.type === "shop") {
        setIsCartOpen(false);
        setShowCheckoutPage(false);
        setShowThankYouPage(false);
        setSelectedProduct(null);
      } else {
        setIsCartOpen(false);
        setShowCheckoutPage(false);
        setShowThankYouPage(false);
      }
    };
    window.addEventListener("popstate", syncStepFromUrl);
    window.addEventListener("app-route-change", syncStepFromUrl);
    return () => {
      window.removeEventListener("popstate", syncStepFromUrl);
      window.removeEventListener("app-route-change", syncStepFromUrl);
    };
  }, [products]);

  const openCartPage = () => {
    setIsCartOpen(true);
    navigateTo("/tienda/carrito");
  };

  const closeCartPage = () => {
    setIsCartOpen(false);
    if (selectedProduct) {
      navigateTo(getProductPath(selectedProduct));
    } else if (showCheckoutPage) {
      navigateTo("/tienda/verificacion");
    } else if (showThankYouPage) {
      navigateTo("/tienda/gracia");
    } else {
      navigateTo("/tienda/catalogo");
    }
  };

  useEffect(() => {
    onToggleCart?.(isCartOpen || showCheckoutPage || showThankYouPage);
  }, [isCartOpen, showCheckoutPage, showThankYouPage, onToggleCart]);

  useEffect(() => {
    onToggleDetailView?.(Boolean(selectedProduct));
  }, [selectedProduct, onToggleDetailView]);

  const [lastOrderItems, setLastOrderItems] = useState<CartItem[]>([]);
  const [lastDeliveryAddress, setLastDeliveryAddress] = useState("");
  const [lastShippingCost, setLastShippingCost] = useState(0);
  const [lastShippingCarrier, setLastShippingCarrier] = useState("");
  const [lastContactInfo, setLastContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [checkoutForm, setCheckoutForm] = useState<AndroidCheckoutForm>(() => ({
    fullName: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: (currentUser as any)?.phone || "",
    shippingAddress: (currentUser as any)?.shippingAddress || (currentUser as any)?.address || "",
    city: (currentUser as any)?.city || "",
    country: (currentUser as any)?.country || "República Dominicana",
    postalCode: (currentUser as any)?.postalCode || "",
  }));

  useEffect(() => {
    if (currentUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        phone: (currentUser as any)?.phone || "",
        shippingAddress: (currentUser as any)?.shippingAddress || (currentUser as any)?.address || "",
        city: (currentUser as any)?.city || "",
        country: (currentUser as any)?.country || "República Dominicana",
        postalCode: (currentUser as any)?.postalCode || "",
      }));
    }
  }, [currentUser]);

  // Animación shockwave del carrito
  const [isCartShockwave, setIsCartShockwave] = useState(false);
  const [shockwaveKey, setShockwaveKey] = useState(0);
  const shockwaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCartShockwave = () => {
    setShockwaveKey(Date.now());
    setIsCartShockwave(true);
    if (shockwaveTimerRef.current) clearTimeout(shockwaveTimerRef.current);
    shockwaveTimerRef.current = setTimeout(() => {
      setIsCartShockwave(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (shockwaveTimerRef.current) clearTimeout(shockwaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedProductDirectly) {
      setSelectedProduct(selectedProductDirectly);
      setIsCartOpen(false);
      setShowCheckoutPage(false);
      setShowThankYouPage(false);
      const targetPath = getProductPath(selectedProductDirectly);
      if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
        navigateTo(targetPath, { replace: true });
      }
    }
  }, [selectedProductDirectly]);

  const categoriesList = useMemo(() => {
    return buildCategoriesList(products || []);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return filterProducts(products, activeCategory, searchQuery, categoriesList);
  }, [products, activeCategory, searchQuery, categoriesList]);

  // Reiniciar conteo de paginación al cambiar filtros o búsqueda
  useEffect(() => {
    setDisplayCount(10);
  }, [activeCategory, searchQuery]);

  // Infinite Scroll Trigger
  useEffect(() => {
    if (isCartOpen || selectedProduct || showCheckoutPage || showThankYouPage) return;

    const triggerLoadMore = () => {
      if (isLoadingMore || filteredProducts.length === 0) return;
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount((prev) => prev + 8);
        setIsLoadingMore(false);
      }, 200);
    };

    const handleScroll = () => {
      if (isLoadingMore || filteredProducts.length === 0) return;
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 400;
      if (scrollPos >= threshold) {
        triggerLoadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const target = infiniteLoaderRef.current;
    let observer: IntersectionObserver | null = null;
    if (target) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && filteredProducts.length > 0) {
            triggerLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: "400px" }
      );
      observer.observe(target);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (observer) observer.disconnect();
    };
  }, [isLoadingMore, filteredProducts.length, isCartOpen, selectedProduct, showCheckoutPage, showThankYouPage]);

  // Mostrar / ocultar carrusel de categorías según dirección del scroll
  useEffect(() => {
    let lastScrollY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    let pivotY = lastScrollY;
    let scrollDirection: "up" | "down" | "none" = "none";
    let isLocked = false;
    let lockTimer: any = null;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;
        const currentY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);

        if (currentY <= 80) {
          pivotY = currentY;
          scrollDirection = "none";
          lastScrollY = currentY;
          if (!isCategoryVisibleRef.current) {
            isCategoryVisibleRef.current = true;
            setIsCategoryVisible(true);
          }
          return;
        }

        if (isLocked) {
          lastScrollY = currentY;
          pivotY = currentY;
          return;
        }

        const diff = currentY - lastScrollY;
        if (Math.abs(diff) < 3) return;

        if (diff > 0) {
          if (scrollDirection !== "down") {
            scrollDirection = "down";
            pivotY = currentY;
          }
          if (currentY - pivotY > 45 && currentY > 160) {
            if (isCategoryVisibleRef.current) {
              isCategoryVisibleRef.current = false;
              setIsCategoryVisible(false);
              isLocked = true;
              clearTimeout(lockTimer);
              lockTimer = setTimeout(() => {
                isLocked = false;
                const freshY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
                pivotY = freshY;
                lastScrollY = freshY;
              }, 320);
            }
          }
        } else if (diff < 0) {
          if (scrollDirection !== "up") {
            scrollDirection = "up";
            pivotY = currentY;
          }
          if (pivotY - currentY > 35) {
            if (!isCategoryVisibleRef.current) {
              isCategoryVisibleRef.current = true;
              setIsCategoryVisible(true);
            }
          }
        }

        lastScrollY = currentY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(lockTimer);
    };
  }, []);

  const displayedProducts = useMemo(() => {
    if (filteredProducts.length === 0) return [];
    const list: DisplayProductItem[] = [];
    for (let i = 0; i < displayCount; i++) {
      const prod = filteredProducts[i % filteredProducts.length];
      list.push({
        ...prod,
        _renderKey: `${prod.id}-android-inf-${i}`,
      });
    }
    return list;
  }, [filteredProducts, displayCount]);

  const cartSubtotal = useMemo(() => {
    return calculateCartSubtotal(effectiveCheckoutItems);
  }, [effectiveCheckoutItems]);

  const cartShippingTotal = useMemo(() => {
    return calculateCartShippingTotal(effectiveCheckoutItems);
  }, [effectiveCheckoutItems]);

  const cartTotal = useMemo(() => {
    return cartSubtotal + cartShippingTotal;
  }, [cartSubtotal, cartShippingTotal]);

  useEffect(() => {
    if (cartDrawerRequest > 0) {
      setIsCartOpen(true);
    }
  }, [cartDrawerRequest]);

  const handleItemRemove = (idx: number, item: CartItem) => {
    if (!onRemoveFromCart) return;
    if (onRemoveFromCart.length >= 2) {
      (onRemoveFromCart as any)(item.product.id, idx);
    } else {
      (onRemoveFromCart as any)(idx);
    }
  };

  const handleItemQtyChange = (idx: number, item: CartItem, newQty: number) => {
    if (!onUpdateCartQuantity) return;
    if (onUpdateCartQuantity.length >= 2) {
      (onUpdateCartQuantity as any)(item.product.id, newQty, idx);
    } else {
      (onUpdateCartQuantity as any)(idx, newQty);
    }
  };

  const finalizeOrder = (shippingAddress: string, itemsToCheckout: CartItem[]) => {
    const fullAddress = [
      shippingAddress || checkoutForm.shippingAddress,
      checkoutForm.city,
      checkoutForm.postalCode ? `C.P. ${checkoutForm.postalCode}` : "",
      checkoutForm.country,
    ].filter(Boolean).join(", ") || "Dirección Android Principal";
    setLastOrderItems(itemsToCheckout.map((item) => ({ ...item, product: { ...item.product } })));
    setLastDeliveryAddress(fullAddress);
    setLastShippingCost(cartShippingTotal);
    const carrierName = itemsToCheckout.find((it) => it.selectedCarrier)?.selectedCarrier || "";
    setLastShippingCarrier(carrierName);
    setLastContactInfo({
      fullName: checkoutForm.fullName || currentUser.name || "Cliente",
      email: checkoutForm.email || currentUser.email || `${currentUser.id || "cliente"}@android.mallsocial`,
      phone: checkoutForm.phone || (currentUser as any).phone || "Sin teléfono",
    });

    // Decrementar stock en producto seleccionado si fue comprado
    if (selectedProduct) {
      const purchasedMatch = itemsToCheckout.find((it) => it.product.id === selectedProduct.id);
      if (purchasedMatch) {
        const qty = purchasedMatch.quantity || 1;
        const currentStk = typeof selectedProduct.stock === "number" ? selectedProduct.stock : parseInt(String(selectedProduct.stock || 0), 10) || 0;
        setSelectedProduct((prev) => prev ? { ...prev, stock: Math.max(0, currentStk - qty) } : null);
      }
    }

    onClearCart?.();
    onOrderPlaced?.();
    setTimeout(() => {
      setIsCartOpen(false);
      setIsCheckingOut(false);
      setShowCheckoutPage(false);
      setShowThankYouPage(true);
      navigateTo("/tienda/gracia");
    }, 1500);
  };

  const handleCheckout = async (
    paypalOrderId: string,
    extraDetails?: { paymentMethod?: any; paymentReceiptUrl?: string | null; receiptFileName?: string; bankName?: string }
  ): Promise<boolean> => {
    if (effectiveCheckoutItems.length === 0 || isCheckingOut) return false;
    setIsCheckingOut(true);

    const shippingAddress = [
      checkoutForm.shippingAddress,
      checkoutForm.city,
      checkoutForm.country,
      checkoutForm.postalCode,
      checkoutForm.phone,
      checkoutForm.email,
    ].filter(Boolean).join(", ") || "Dirección Android Principal";

    if (onCheckout) {
      try {
        const succeeded = await onCheckout(
          shippingAddress,
          cartShippingTotal,
          (newOrder) => {
            try {
              if (newOrder) {
                const uId = currentUser.originalId || currentUser.id;
                const cacheKey = `mall_user_orders_${uId}`;
                const prevSaved = JSON.parse(localStorage.getItem(cacheKey) || "[]");
                const updated = [newOrder, ...prevSaved.filter((o: any) => o.id !== (newOrder as any).id)];
                localStorage.setItem(cacheKey, JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("mall_order_created", { detail: newOrder }));
              }
            } catch {}
            finalizeOrder(shippingAddress, effectiveCheckoutItems);
          },
          effectiveCheckoutItems,
          {
            buyerName: checkoutForm.fullName.trim(),
            buyerEmail: checkoutForm.email.trim().toLowerCase(),
            buyerPhone: checkoutForm.phone.trim(),
          },
          paypalOrderId,
          extraDetails
        );
        if (!succeeded) setIsCheckingOut(false);
        return succeeded;
      } catch (error) {
        setIsCheckingOut(false);
        throw error;
      }
    }

    setIsCheckingOut(false);
    return false;
  };

  // 1. Thank You Page
  if (showThankYouPage) {
    return (
      <GraciaTiendaView
        lastOrderItems={lastOrderItems}
        lastDeliveryAddress={lastDeliveryAddress}
        lastContactInfo={lastContactInfo}
        lastShippingCost={lastShippingCost}
        lastShippingCarrier={lastShippingCarrier}
        onContinueShopping={() => {
          setShowThankYouPage(false);
          setShowCheckoutPage(false);
          setSelectedProduct(null);
          setIsCartOpen(false);
          navigateTo("/tienda/catalogo");
        }}
        onNavigateToHistory={
          onNavigateToHistory
            ? () => {
                setShowThankYouPage(false);
                setShowCheckoutPage(false);
                setSelectedProduct(null);
                setIsCartOpen(false);
                onNavigateToHistory();
              }
            : undefined
        }
      />
    );
  }

  // 2. Checkout / Verificación Page
  if (showCheckoutPage) {
    return (
      <VerificacionTiendaView
        onBackToCart={() => {
          setShowCheckoutPage(false);
          openCartPage();
        }}
        checkoutForm={checkoutForm}
        setCheckoutForm={setCheckoutForm}
        effectiveCheckoutItems={effectiveCheckoutItems}
        cart={cart}
        cartSubtotal={cartSubtotal}
        cartShippingTotal={cartShippingTotal}
        cartTotal={cartTotal}
        handleCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />
    );
  }

  // 3. Cart Page
  if (isCartOpen) {
    return (
      <CarritoTiendaView
        cart={cart}
        selectedCartIndices={selectedCartIndices}
        isAllCartSelected={isAllCartSelected}
        toggleSelectAllCart={toggleSelectAllCart}
        toggleSelectCartItem={toggleSelectCartItem}
        selectedCartItems={selectedCartItems}
        cartSubtotal={cartSubtotal}
        cartShippingTotal={cartShippingTotal}
        cartTotal={cartTotal}
        handleItemRemove={handleItemRemove}
        handleItemQtyChange={handleItemQtyChange}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setIsCartOpen(false);
          if (onSelectProduct) {
            onSelectProduct(p);
          } else {
            navigateTo(getProductPath(p));
          }
        }}
        onProceedToCheckout={() => {
          if (requiresLoginForCheckout) {
            onLoginRequiredForCheckout?.(selectedCartItems);
            return;
          }
          setIsCartOpen(false);
          setShowCheckoutPage(true);
          navigateTo("/tienda/verificacion");
        }}
        onCloseCart={closeCartPage}
        onExploreProducts={() => {
          setIsCartOpen(false);
          setSelectedProduct(null);
          navigateTo("/tienda/catalogo");
        }}
      />
    );
  }

  // 4. Product Detail Page
  if (selectedProduct) {
    const liveProd = products.find((p) => p.id === selectedProduct.id) || selectedProduct;
    const currentDetailProduct = {
      ...selectedProduct,
      stock: liveProd.stock !== undefined ? liveProd.stock : selectedProduct.stock,
      price: liveProd.price !== undefined ? liveProd.price : selectedProduct.price,
    };
    return (
      <ProductoIdTiendaView
        selectedProduct={currentDetailProduct}
        onAddToCart={onAddToCart}
        cart={cart}
        users={users}
        onCreatorClick={onCreatorClick}
        onToggleSave={onToggleSave}
        savedReelIds={savedReelIds}
        onBackToCatalog={() => {
          setSelectedProduct(null);
          clearDirectProduct?.();
          onClearInitialProduct?.();
          if (onBackToCatalog) {
            onBackToCatalog();
          } else {
            navigateTo("/tienda/catalogo");
          }
        }}
        openCartPage={openCartPage}
        isCartShockwave={isCartShockwave}
        shockwaveKey={shockwaveKey}
        triggerCartShockwave={triggerCartShockwave}
      />
    );
  }

  // 5. Default Catalog View
  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none pb-24" id="android-shop-view">
      {/* Top Android Sticky Bar: Header + Collapsible Category Carousel */}
      <div className="sticky top-0 z-30 bg-white shadow-xs">
        <CabeceraCatalogo
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          openCartPage={openCartPage}
          cartCount={cart.reduce((s, i) => s + (i.quantity || 1), 0)}
          isCartShockwave={isCartShockwave}
          shockwaveKey={shockwaveKey}
        />

        <FiltrosCatalogo
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categoriesList={categoriesList}
          isCategoryVisible={isCategoryVisible}
        />
      </div>

      {/* Cuadrícula de productos con 4px de espaciado y 4px laterales */}
      <CuadriculaProductos
        isLoading={isLoading}
        totalProductsCount={products.length}
        filteredProductsCount={filteredProducts.length}
        displayedProducts={displayedProducts}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        savedReelIds={savedReelIds}
        onSelectProduct={(p) => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const appLayout = document.getElementById("android-app-layout");
          if (appLayout) appLayout.scrollTop = 0;
          const mainEl = document.querySelector("main");
          if (mainEl) mainEl.scrollTop = 0;

          setSelectedProduct(p);
          if (onSelectProduct) {
            onSelectProduct(p);
          } else {
            navigateTo(getProductPath(p));
          }
        }}
        onToggleSave={onToggleSave}
        onRefreshProducts={onRefreshProducts}
        isLoadingMore={isLoadingMore}
        infiniteLoaderRef={infiniteLoaderRef}
      />
    </div>
  );
}
