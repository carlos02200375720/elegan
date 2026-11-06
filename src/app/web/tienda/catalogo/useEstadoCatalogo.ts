import React, { useState, useEffect, useMemo } from "react";
import { Product, CartItem, Order, isGuestUser } from "../../tipos";
import { getProductPath, getThankYouPath, navigateTo, parseRoute } from "../../enrutador";
import { apiFetch } from "../../config";
import { DEST_COUNTRIES } from "../verificasion/index";
import { trackFunnelStep } from "../../analitica";
import { ShopProps, PasoTienda } from "./TiposCatalogo";

export function useEstadoCatalogo(props: ShopProps) {
  const {
    products,
    cart,
    currentUser,
    onCheckout,
    selectedProductDirectly,
    clearDirectProduct,
    onToggleDetailView,
    initialStep,
    initialSelectedCartIndices,
    onProductSelect,
    onBackToCatalog,
    onStepChange,
    onRefreshProducts,
  } = props;

  const [activeStep, setActiveStep] = useState<PasoTienda>(() => {
    if (initialStep && initialStep !== "cart") return initialStep;
    if (typeof window !== "undefined") {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "checkout") return "checkout";
      if (parsed.type === "thankyou") return "thankyou";
      if (parsed.type === "product") return "detail";
    }
    if (selectedProductDirectly) return "detail";
    return "catalog";
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (selectedProductDirectly) return selectedProductDirectly;
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

  const [showCartDrawer, setShowCartDrawer] = useState(() => {
    if (initialStep === "cart") return true;
    if (
      typeof window !== "undefined" &&
      /^\/(?:tienda\/|shop\/)?(?:carrito|cart)$/i.test(window.location.pathname.replace(/\/+$/, ""))
    ) {
      return true;
    }
    return false;
  });

  // Auto-retry fetching products if array is initially empty
  useEffect(() => {
    if (products.length === 0 && onRefreshProducts) {
      const timer = setTimeout(() => {
        onRefreshProducts();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [products.length, onRefreshProducts]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [displayCount, setDisplayCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Delivery details state
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState(currentUser?.shippingAddress || currentUser?.address || "");
  const [country, setCountry] = useState("República Dominicana 🇩🇴");
  const [city, setCity] = useState(currentUser?.city || "");
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || "");
  const [isFormValid, setIsFormValid] = useState(true);

  useEffect(() => {
    if (isGuestUser(currentUser)) {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCountry("República Dominicana 🇩🇴");
      setCity("");
      setPostalCode("");
      return;
    }

    const savedCountry = String(currentUser?.country || "").trim().toLowerCase();
    const matchedCountry = DEST_COUNTRIES.find((option) => {
      const plainName = option.name.slice(0, option.name.lastIndexOf(" ")).trim().toLowerCase();
      return option.name.trim().toLowerCase() === savedCountry || plainName === savedCountry;
    });

    setName(currentUser?.name || "");
    setEmail(currentUser?.email || "");
    setPhone(currentUser?.phone || "");
    setAddress(currentUser?.shippingAddress || currentUser?.address || "");
    setCountry(matchedCountry?.name || "República Dominicana 🇩🇴");
    setCity(currentUser?.city || "");
    setPostalCode(currentUser?.postalCode || "");
  }, [currentUser]);

  // Success Order State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Notify parent component about detail/checkout view
  useEffect(() => {
    if (onToggleDetailView) {
      onToggleDetailView(
        (activeStep === "detail" && !!selectedProduct) ||
          activeStep === "checkout" ||
          activeStep === "payment"
      );
    }
    if (activeStep === "detail") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [activeStep, selectedProduct, onToggleDetailView]);

  // Track sales funnel steps in real time
  useEffect(() => {
    if (showCartDrawer) {
      trackFunnelStep("carrito", { path: "/tienda/carrito" });
      return;
    }
    if (activeStep === "catalog") {
      trackFunnelStep("tienda", { path: "/tienda/catalogo" });
    } else if (activeStep === "detail" && selectedProduct) {
      trackFunnelStep("producto_id", {
        path: getProductPath(selectedProduct),
        productId: selectedProduct.id,
      });
    } else if (activeStep === "checkout") {
      trackFunnelStep("verificacion", { path: "/tienda/verificacion" });
    } else if (activeStep === "thankyou") {
      trackFunnelStep("gracia", { path: getThankYouPath(completedOrder?.id) });
    }
  }, [activeStep, selectedProduct, showCartDrawer, completedOrder?.id]);

  // Sync direct product clicks from reels or routes
  useEffect(() => {
    if (selectedProductDirectly) {
      setSelectedProduct(selectedProductDirectly);
      setActiveStep("detail");
      const targetPath = getProductPath(selectedProductDirectly);
      if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
        navigateTo(targetPath, { replace: true });
      }
    }
  }, [selectedProductDirectly]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setActiveStep("detail");
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      navigateTo(getProductPath(product));
    }
    onStepChange?.("detail");
  };

  const handleBackToCatalog = () => {
    setActiveStep("catalog");
    setSelectedProduct(null);
    clearDirectProduct?.();
    if (onBackToCatalog) {
      onBackToCatalog();
    } else {
      navigateTo("/tienda/catalogo");
    }
    onStepChange?.("catalog");
  };

  // Cart selection state
  const [selectedCartIndices, setSelectedCartIndices] = useState<number[]>([]);

  // Respond to initialStep or initialSelectedCartIndices from external navigation
  useEffect(() => {
    if (initialStep === "cart") {
      setShowCartDrawer(true);
    } else if (initialStep && initialStep !== "catalog") {
      setShowCartDrawer(false);
      setActiveStep(initialStep);
      if (initialSelectedCartIndices && initialSelectedCartIndices.length > 0) {
        setSelectedCartIndices(initialSelectedCartIndices);
      }
    }
  }, [initialStep, initialSelectedCartIndices]);

  // Synchronize Product Detail, Cart Drawer, Checkout, and Thank You step with browser URL
  useEffect(() => {
    const syncStepFromUrl = () => {
      const parsed = parseRoute(window.location.pathname);
      if (parsed.type === "cart") {
        setShowCartDrawer(true);
      } else if (parsed.type === "checkout") {
        setShowCartDrawer(false);
        setActiveStep("checkout");
      } else if (parsed.type === "thankyou") {
        setShowCartDrawer(false);
        setActiveStep("thankyou");
        if (parsed.orderId && (!completedOrder || completedOrder.id !== parsed.orderId)) {
          apiFetch(`/api/orders/${encodeURIComponent(parsed.orderId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.id) {
                setCompletedOrder(data);
              }
            })
            .catch(() => {});
        }
      } else if (parsed.type === "product") {
        setShowCartDrawer(false);
        setActiveStep("detail");
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
        setShowCartDrawer(false);
        setActiveStep("catalog");
        setSelectedProduct(null);
      } else {
        setShowCartDrawer(false);
      }
    };
    window.addEventListener("popstate", syncStepFromUrl);
    window.addEventListener("app-route-change", syncStepFromUrl);
    return () => {
      window.removeEventListener("popstate", syncStepFromUrl);
      window.removeEventListener("app-route-change", syncStepFromUrl);
    };
  }, [products, completedOrder]);

  const openCartDrawer = () => {
    setShowCartDrawer(true);
    navigateTo("/tienda/carrito");
  };

  const closeCartDrawer = () => {
    setShowCartDrawer(false);
    if (activeStep === "detail" && selectedProduct) {
      navigateTo(getProductPath(selectedProduct));
    } else if (activeStep === "checkout") {
      navigateTo("/tienda/verificacion");
    } else if (activeStep === "thankyou") {
      navigateTo(getThankYouPath(completedOrder?.id));
    } else {
      navigateTo("/tienda/catalogo");
    }
  };

  // Automatically sync cart selections when cart items change
  useEffect(() => {
    setSelectedCartIndices((prev) => {
      if (cart.length === 0) return [];
      if (prev.length === 0) return cart.map((_, i) => i);
      const valid = prev.filter((i) => i < cart.length);
      return valid.length > 0 ? valid : cart.map((_, i) => i);
    });
  }, [cart.length]);

  const toggleItemSelection = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCartIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
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

  const selectedCartItems = useMemo(
    () => cart.filter((_, idx) => selectedCartIndices.includes(idx)),
    [cart, selectedCartIndices]
  );
  const effectiveCheckoutItems = selectedCartItems.length > 0 ? selectedCartItems : cart;

  const cartSubtotal = useMemo(
    () =>
      effectiveCheckoutItems.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
      ),
    [effectiveCheckoutItems]
  );

  const cartShippingTotal = useMemo(
    () =>
      effectiveCheckoutItems.reduce((acc, item) => {
        const shippingFee =
          item.selectedShippingCost !== undefined
            ? item.selectedShippingCost
            : item.product.shippingCost !== undefined
            ? item.product.shippingCost
            : 0;
        return acc + shippingFee * item.quantity;
      }, 0),
    [effectiveCheckoutItems]
  );

  const cartTotal = cartSubtotal + cartShippingTotal;
  const cartItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const startCheckout = () => {
    if (effectiveCheckoutItems.length === 0) return;
    setShowCartDrawer(false);
    setActiveStep("checkout");
    navigateTo("/tienda/verificacion");
    onStepChange?.("checkout");
  };

  const executePayment = async (
    paypalOrderId: string,
    extraPaymentDetails: {
      paymentMethod?: "transferencia" | "tarjeta" | "contra_entrega";
      paymentReceiptUrl?: string | null;
      receiptFileName?: string;
      bankName?: string;
    }
  ): Promise<boolean> => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !country.trim() ||
      !postalCode.trim()
    ) {
      setIsFormValid(false);
      return false;
    }
    setIsFormValid(true);
    const fullShippingAddress = `${address}, ${city}, ${country}${
      postalCode ? `, C.P. ${postalCode}` : ""
    } (Tel: ${phone}, Email: ${email})`;
    const totalShippingCost = effectiveCheckoutItems.reduce((acc, item) => {
      const shippingFee =
        item.selectedShippingCost !== undefined
          ? item.selectedShippingCost
          : item.product.shippingCost !== undefined
          ? item.product.shippingCost
          : 0;
      return acc + (shippingFee || 0) * item.quantity;
    }, 0);
    const result = await onCheckout(
      fullShippingAddress,
      totalShippingCost,
      (newOrder) => {
        setCompletedOrder(newOrder);
        setActiveStep("thankyou");
        navigateTo(getThankYouPath(newOrder.id));
        onStepChange?.("thankyou", newOrder.id);
      },
      effectiveCheckoutItems,
      {
        buyerName: name.trim(),
        buyerEmail: email.trim().toLowerCase(),
        buyerPhone: phone.trim(),
      },
      paypalOrderId,
      extraPaymentDetails
    );
    return result !== false;
  };

  return {
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
    setCompletedOrder,
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
  };
}
