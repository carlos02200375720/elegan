import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product, CartItem, User, Order, Reel } from "../../../types";
import {
  ShoppingBag,
  Search,
  X,
  Sparkles,
  RefreshCw,
  Bookmark,
} from "lucide-react";
import { androidApiFetch } from "../api";
import { navigateTo, getProductPath, parseRoute } from "../../../router";
import ProductoIdTiendaView, { getManualShippingOptions } from "./productoid";
import CarritoTiendaView from "./carrito";
import VerificacionTiendaView, { AndroidCheckoutForm } from "./verificacion";
import GraciaTiendaView from "./gracia";
import { formatPrice } from "../../../utils/currency";

export interface AndroidShopProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: Record<string, string>,
    selectedVariantVid?: string
  ) => void;
  cart: CartItem[];
  currentUser: User;
  onUpdateCartQuantity?: (param1: any, param2: any, param3?: any) => void;
  onRemoveFromCart?: (param1: any, param2?: any) => void;
  onClearCart?: () => void;
  users: User[];
  onSelectProduct?: (product: Product) => void;
  onSelectUser?: (user: User) => void;
  onCreatorClick?: (creatorId: string) => void;
  onOrderPlaced?: () => void;
  onOpenSocial?: () => void;
  unreadCount?: number;
  initialSelectedProduct?: Product | null;
  selectedProductDirectly?: Product | null;
  clearDirectProduct?: () => void;
  onClearInitialProduct?: () => void;
  onBackToCatalog?: () => void;
  reels?: Reel[];
  orders?: Order[];
  onUpdateOrders?: (orders: Order[]) => void;
  onCheckout?: (
    address: string,
    shippingCost: number,
    onComplete: (newOrder: Order) => void,
    itemsToCheckout?: CartItem[],
    buyerInfo?: { buyerName?: string; buyerEmail?: string; buyerPhone?: string },
    paypalOrderId?: string,
    extraPaymentDetails?: {
      paymentMethod?: string;
      paymentReceiptUrl?: string | null;
      receiptFileName?: string;
      bankName?: string;
    }
  ) => Promise<boolean>;
  requiresLoginForCheckout?: boolean;
  onLoginRequiredForCheckout?: (itemsToCheckout: CartItem[]) => void;
  onNavigateToHistory?: () => void;
  onToggleDetailView?: (open: boolean) => void;
  onToggleCart?: (open: boolean) => void;
  initialStep?: "catalog" | "detail" | "cart" | "checkout" | "payment" | "thankyou";
  initialSelectedCartIndices?: number[];
  onClearInitialStep?: () => void;
  isLoading?: boolean;
  onRefreshProducts?: () => void;
  cartDrawerRequest?: number;
  savedReelIds?: string[];
  onToggleSave?: (productId: string) => void;
  initialCategory?: string;
}

export type AndroidShopViewProps = AndroidShopProps;

export interface AndroidCategory {
  id: string;
  name: string;
  queryTerm?: string;
  imageUrl: string;
}

export const CATEGORIES_WITH_IMAGES: AndroidCategory[] = [
  {
    id: "todos",
    name: "Todos",
    queryTerm: "",
    imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "ropa_femenina",
    name: "Ropa Femenina",
    queryTerm: "femenina",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "ropa_masculina",
    name: "Ropa Masculina",
    queryTerm: "masculina",
    imageUrl: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "mascota",
    name: "Mascotas",
    queryTerm: "mascota",
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "hogar",
    name: "Hogar",
    queryTerm: "neon",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "salud",
    name: "Salud",
    queryTerm: "yoga",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "joya",
    name: "Joyas",
    queryTerm: "joya",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "bolso",
    name: "Bolsos",
    queryTerm: "bolso",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "sapato",
    name: "Zapatos",
    queryTerm: "zapato",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "juguete",
    name: "Juguetes",
    queryTerm: "juguete",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "deportes",
    name: "Deportes",
    queryTerm: "yoga",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "electronica",
    name: "Electrónica",
    queryTerm: "synth",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "automotriz",
    name: "Automotriz",
    queryTerm: "automotriz",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "telefono",
    name: "Teléfonos",
    queryTerm: "telefono",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=150&q=80",
  },
  {
    id: "informatica",
    name: "Informática",
    queryTerm: "informatica",
    imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=150&q=80",
  },
];

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

  // Asegurar que al abrir un producto el scroll se restablezca arriba en la galería
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

  // Cart selection state: allows customer to choose specific products to buy
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

  // Route directly to checkout, cart, or thankyou if initiated from outside
  useEffect(() => {
    if (initialStep === "checkout") {
      setIsCartOpen(false);
      setSelectedProduct(null);
      setShowThankYouPage(false);
      setShowCheckoutPage(true);
      onClearInitialStep?.();
    } else if (initialStep === "cart") {
      setShowCheckoutPage(false);
      setShowThankYouPage(false);
      setIsCartOpen(true);
      onClearInitialStep?.();
    } else if (initialStep === "thankyou") {
      setIsCartOpen(false);
      setSelectedProduct(null);
      setShowCheckoutPage(false);
      setShowThankYouPage(true);
      onClearInitialStep?.();
    }
  }, [initialStep, onClearInitialStep]);

  // Synchronize Product Detail, Cart, Checkout, and Thank You page state with browser URL
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

  // Synchronize cart & detail view visibility with Android navigation bar
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

  // Sincronizar automáticamente los datos guardados en el perfil para autocompletar el checkout
  useEffect(() => {
    if (currentUser) {
      setCheckoutForm((prev) => ({
        ...prev,
        fullName: currentUser.name || prev.fullName || "",
        email: currentUser.email || prev.email || "",
        phone: (currentUser as any)?.phone || prev.phone || "",
        shippingAddress: (currentUser as any)?.shippingAddress || (currentUser as any)?.address || prev.shippingAddress || "",
        city: (currentUser as any)?.city || prev.city || "",
        country: (currentUser as any)?.country || prev.country || "República Dominicana",
        postalCode: (currentUser as any)?.postalCode || prev.postalCode || "",
      }));
    }
  }, [currentUser]);

  // Cart Shockwave state
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

  // Sync selectedProduct if selectedProductDirectly changes
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
    const list: AndroidCategory[] = [...CATEGORIES_WITH_IMAGES];

    (products || []).forEach((p) => {
      if (p.category && p.category.trim()) {
        const catName = p.category.trim();
        const exists = list.some(
          (c) =>
            c.name.toLowerCase() === catName.toLowerCase() ||
            c.id.toLowerCase() === catName.toLowerCase()
        );
        if (!exists) {
          list.push({
            id: catName.toLowerCase().replace(/\s+/g, "_"),
            name: catName,
            queryTerm: catName.toLowerCase(),
            imageUrl:
              p.imageUrl ||
              "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80",
          });
        }
      }
    });

    return list;
  }, [products]);

  // Category track drag & horizontal continuous animation
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const [isCategoryDragging, setIsCategoryDragging] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const isCategoryInteractingRef = useRef(false);
  const categoryHasMovedRef = useRef(false);
  const categoryResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [categoryStartX, setCategoryStartX] = useState(0);
  const [categoryScrollLeft, setCategoryScrollLeft] = useState(0);

  const infiniteCategories = useMemo(() => {
    if (categoriesList.length === 0) return [];
    return [...categoriesList, ...categoriesList];
  }, [categoriesList]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const speed = 0.45;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 16.67, 2);
      lastTime = now;

      const track = categoryTrackRef.current;
      if (
        track &&
        isCategoryVisible &&
        !isCategoryDragging &&
        !isCategoryHovered &&
        !isCategoryInteractingRef.current
      ) {
        track.scrollLeft += speed * delta;
        const singleSetWidth = track.scrollWidth / 2;
        if (singleSetWidth > 0 && track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        } else if (track.scrollLeft <= 0) {
          track.scrollLeft += singleSetWidth;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (categoryResumeTimeoutRef.current) {
        clearTimeout(categoryResumeTimeoutRef.current);
      }
    };
  }, [isCategoryDragging, isCategoryHovered, isCategoryVisible]);

  const handleCategoryMouseDown = (e: React.MouseEvent) => {
    if (!categoryTrackRef.current) return;
    setIsCategoryDragging(true);
    categoryHasMovedRef.current = false;
    setCategoryStartX(e.pageX - categoryTrackRef.current.offsetLeft);
    setCategoryScrollLeft(categoryTrackRef.current.scrollLeft);
  };

  const handleCategoryMouseLeave = () => {
    setIsCategoryDragging(false);
    setIsCategoryHovered(false);
  };

  const handleCategoryMouseUp = () => {
    setIsCategoryDragging(false);
    setTimeout(() => {
      categoryHasMovedRef.current = false;
    }, 60);
  };

  const handleCategoryMouseMove = (e: React.MouseEvent) => {
    if (!isCategoryDragging || !categoryTrackRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryTrackRef.current.offsetLeft;
    const walk = (x - categoryStartX) * 1.5;
    if (Math.abs(walk) > 4) {
      categoryHasMovedRef.current = true;
    }
    categoryTrackRef.current.scrollLeft = categoryScrollLeft - walk;
  };

  const handleCategoryWheel = (e: React.WheelEvent) => {
    if (!categoryTrackRef.current) return;
    if (e.deltaY !== 0 || e.deltaX !== 0) {
      categoryTrackRef.current.scrollLeft += e.deltaY || e.deltaX;
      isCategoryInteractingRef.current = true;
      if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
      categoryResumeTimeoutRef.current = setTimeout(() => {
        isCategoryInteractingRef.current = false;
      }, 1200);
    }
  };

  const handleCategoryTouchStart = () => {
    isCategoryInteractingRef.current = true;
    if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
  };

  const handleCategoryTouchEnd = () => {
    if (categoryResumeTimeoutRef.current) clearTimeout(categoryResumeTimeoutRef.current);
    categoryResumeTimeoutRef.current = setTimeout(() => {
      isCategoryInteractingRef.current = false;
    }, 1500);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchCat = activeCategory === "Todos" || activeCategory === "todos";
      if (!matchCat) {
        const activeCatObj = categoriesList.find(
          (c) =>
            c.name.toLowerCase() === activeCategory.toLowerCase() ||
            c.id.toLowerCase() === activeCategory.toLowerCase()
        );
        if (p.category) {
          matchCat =
            p.category.toLowerCase().trim() ===
            (activeCatObj ? activeCatObj.name.toLowerCase() : activeCategory.toLowerCase().trim());
        } else if (activeCatObj?.queryTerm) {
          const term = activeCatObj.queryTerm.toLowerCase();
          matchCat =
            p.name.toLowerCase().includes(term) ||
            Boolean(p.description && p.description.toLowerCase().includes(term));
        }
      }

      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(p.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery, categoriesList]);

  // Reset infinite scroll count when filter or search changes
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

  // Show/hide category carousel based on scroll direction
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
    const list: (Product & { _renderKey: string })[] = [];
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
    return effectiveCheckoutItems.reduce(
      (sum, item) => sum + item.product.price * (item.quantity || 1),
      0
    );
  }, [effectiveCheckoutItems]);

  const cartShippingTotal = useMemo(() => {
    return effectiveCheckoutItems.reduce((sum, item) => {
      const fee =
        item.selectedShippingCost !== undefined
          ? Number(item.selectedShippingCost)
          : item.product.shippingCost !== undefined
          ? Number(item.product.shippingCost)
          : 0;
      return sum + (Number.isNaN(fee) ? 0 : fee) * (item.quantity || 1);
    }, 0);
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
      checkoutForm.country,
    ].filter(Boolean).join(", ") || "Dirección Android Principal";
    setLastOrderItems(itemsToCheckout.map((item) => ({ ...item, product: { ...item.product } })));
    setLastDeliveryAddress(fullAddress);
    setLastShippingCost(cartShippingTotal);
    const carrierName = itemsToCheckout.find((it) => it.selectedCarrier)?.selectedCarrier || "";
    setLastShippingCarrier(carrierName);
    setLastContactInfo({
      fullName: checkoutForm.fullName || currentUser.name || "Cliente",
      email: checkoutForm.email || currentUser.email || `${currentUser.username}@android.mallsocial`,
      phone: checkoutForm.phone || (currentUser as any).phone || "Sin teléfono",
    });

    // Decrement stock in selectedProduct if purchased
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

  // 2. Checkout / Verificacion Page
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

  // 5. Catalog View (Default)
  return (
    <div className="w-full min-h-screen bg-white text-slate-900 flex flex-col font-sans select-none pb-24" id="android-shop-view">
      {/* Top Android Sticky Bar: Header + Collapsible Category Carousel */}
      <div className="sticky top-0 z-30 bg-white shadow-xs">
        {/* Integrated Search and Cart Header */}
        <div
          id="android-shop-search-header"
          className="px-3 pb-2.5 flex items-center gap-2 bg-white"
          style={{
            paddingTop: "max(14px, calc(env(safe-area-inset-top, 0px) + 10px))",
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={openCartPage}
            className="relative p-2 text-slate-900 active:scale-95 transition-transform shrink-0"
            aria-label="Carrito de compras"
          >
            <ShoppingBag
              className={`w-5 h-5 transition-all duration-300 ${
                isCartShockwave ? "text-amber-600 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "text-amber-500"
              }`}
            />
            {(cart.length > 0 || isCartShockwave) && (
              <span
                key={`main-cart-counter-${shockwaveKey}`}
                className={`absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow transition-all duration-300 ${
                  isCartShockwave
                    ? "scale-125 ring-2 ring-amber-300 bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.95)]"
                    : "scale-100"
                }`}
              >
                {Math.max(1, cart.reduce((s, i) => s + (i.quantity || 1), 0))}

                {isCartShockwave && (
                  <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-amber-400 animate-cart-shockwave" />
                    <span className="absolute inset-0 rounded-full border-2 border-amber-300 animate-cart-shockwave-2" />
                    <span className="absolute inset-0 rounded-full border border-amber-200 animate-cart-shockwave-3" />
                  </span>
                )}
              </span>
            )}
          </button>
        </div>

        {/* Category Carousel with Images (Collapsible on scroll) */}
        <div
          id="android-category-carousel-container"
          style={{ overflowAnchor: "none" }}
          className={`w-full bg-white overflow-hidden transition-all duration-300 ease-out border-b will-change-[max-height,opacity] ${
            isCategoryVisible
              ? "max-h-20 opacity-100 border-slate-100 pointer-events-auto"
              : "max-h-0 opacity-0 pointer-events-none border-transparent"
          }`}
        >
          <div className="py-1 px-2 flex items-center gap-1.5" id="android-category-carousel-inner">
            {activeCategory !== "Todos" && activeCategory !== "todos" && (
              <button
                type="button"
                onClick={() => setActiveCategory("Todos")}
                className="shrink-0 z-10 flex items-center space-x-1 px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-full text-[8.5px] font-bold border border-amber-500/30 active:scale-95 transition-all shadow-xs"
                title="Restablecer filtro a Todos"
              >
                <span className="truncate max-w-[55px]">
                  {categoriesList.find((c) => c.name.toLowerCase() === activeCategory.toLowerCase() || c.id === activeCategory)?.name || activeCategory}
                </span>
                <X className="w-2.5 h-2.5 shrink-0" />
              </button>
            )}
            <div
              ref={categoryTrackRef}
              onMouseDown={handleCategoryMouseDown}
              onMouseLeave={handleCategoryMouseLeave}
              onMouseUp={handleCategoryMouseUp}
              onMouseMove={handleCategoryMouseMove}
              onMouseEnter={() => setIsCategoryHovered(true)}
              onWheel={handleCategoryWheel}
              onTouchStart={handleCategoryTouchStart}
              onTouchEnd={handleCategoryTouchEnd}
              onTouchCancel={handleCategoryTouchEnd}
              className={`flex-1 flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 select-none ${
                isCategoryDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {infiniteCategories.map((cat, idx) => {
                const isSelected =
                  activeCategory.toLowerCase() === cat.name.toLowerCase() ||
                  activeCategory.toLowerCase() === cat.id.toLowerCase();
                return (
                  <button
                    key={`${cat.id || cat.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (!categoryHasMovedRef.current) {
                        setActiveCategory(cat.name);
                      }
                    }}
                    className="flex flex-col items-center shrink-0 outline-none group focus:outline-none cursor-pointer select-none active:scale-95 transition-transform w-[42px]"
                  >
                    <div
                      className={`w-7 h-7 rounded-full overflow-hidden border-[1.5px] transition-all relative flex items-center justify-center bg-slate-50 ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-500/25 scale-105 shadow-xs"
                          : "border-slate-200 group-hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-200 group-hover:scale-110"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80";
                        }}
                      />
                    </div>
                    <span
                      className={`text-[8px] leading-tight text-center truncate w-full mt-0.5 transition-colors ${
                        isSelected
                          ? "text-amber-600 font-bold"
                          : "text-slate-600 font-medium group-hover:text-slate-900"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid con separación de 4px entre tarjetas y 4px en laterales */}
      <div className="px-[4px] py-2 grid grid-cols-2 gap-[4px] flex-1">
        {isLoading && products.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col animate-pulse">
              <div className="w-full aspect-square bg-slate-800 rounded-xl mb-3" />
              <div className="h-3.5 bg-slate-800 rounded w-3/4 mb-2" />
              <div className="h-2.5 bg-slate-800 rounded w-1/2 mb-3" />
              <div className="h-5 bg-slate-800 rounded mt-auto" />
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-2 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-amber-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-200">
              {searchQuery || activeCategory !== "Todos"
                ? "No se encontraron productos en esta categoría."
                : "No se encontraron productos en este catálogo."}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {searchQuery || activeCategory !== "Todos"
                ? "Prueba seleccionando otra categoría o cambiando la búsqueda."
                : "Comprueba tu conexión o reintenta sincronizar con el catálogo."}
            </p>
            {onRefreshProducts && (
              <button
                type="button"
                onClick={onRefreshProducts}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-transform shadow-lg shadow-amber-500/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar conexión</span>
              </button>
            )}
          </div>
        ) : (
          displayedProducts.map((p, pIdx) => {
            const isSaved = (savedReelIds || []).includes(p.id);
            return (
              <div
                key={`${p._renderKey || p.id}-${pIdx}`}
                onClick={() => {
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
                className="bg-white rounded-2xl overflow-hidden flex flex-col justify-between active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-slate-100">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>

                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                  {p.category && (
                    <p className="text-[10px] font-bold text-amber-600 line-clamp-1 mt-0.5">
                      {p.category}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-0 px-2.5 pb-2.5 pt-1 gap-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-amber-500">{formatPrice(p.price)}</span>
                    {Boolean(p.freeShipping) && (
                      <span className="text-[9px] font-bold text-emerald-700">
                        Envío Gratis
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    id={`android-save-product-btn-${p.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave?.(p.id);
                    }}
                    className="p-1 active:scale-90 transition-transform cursor-pointer flex items-center justify-center bg-transparent border-0"
                    title={isSaved ? "Guardado en publicaciones" : "Guardar en publicaciones"}
                    aria-label={isSaved ? "Quitar de publicaciones guardadas" : "Guardar en publicaciones"}
                  >
                    <Bookmark
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isSaved ? "fill-amber-500 stroke-amber-500 scale-105" : "text-slate-400 hover:text-slate-600 stroke-[2.2]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Infinite Scroll Loader & Sentinel */}
      {filteredProducts.length > 0 && (
        <div ref={infiniteLoaderRef} className="w-full py-5 flex flex-col items-center justify-center">
          {isLoadingMore ? (
            <div className="flex items-center space-x-2 bg-slate-100/95 border border-slate-200 px-4 py-2 rounded-full shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span className="text-[11px] font-semibold text-slate-600">Cargando más productos...</span>
            </div>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          )}
        </div>
      )}
    </div>
  );
}
