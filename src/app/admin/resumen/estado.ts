import React, { useState, useEffect, useMemo } from "react";
import { User, Order } from "../tipos";
import { apiFetch } from "../config";
import { sesionAdmin } from "../sesion";
import { isSuperAdmin } from "../superAdmin";
import { navigateToAdmin as navigateTo } from "../enrutador";
import { getDefaultAvatar, getDefaultCoverPhoto, setDefaultAssetsCache, FALLBACK_DEFAULT_AVATAR, FALLBACK_DEFAULT_COVER } from "../utilidades/activosPredeterminados";
import { AdminViewProps, AdminTab } from "./tipos";
import { parseAdminTabFromPath } from "./rutas";

export function useEstadoAdmin(props: AdminViewProps) {
  const { currentUser, users, reels, products, onRefreshAll, onCreatorClick, onProductClick, onReelClick, onNavigateToTab, setUsers, setReels, setProducts, activePlatform = 'web', onSwitchPlatform } = props;
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      return parseAdminTabFromPath(window.location.pathname);
    }
    return 'resumen';
  });

  const handleSelectAdminTab = (tab: AdminTab) => {
    setActiveAdminTab(tab);
    const routeSegment =
      tab === 'productos'
        ? 'producto'
        : tab === 'ordenes'
        ? 'pedidos'
        : tab;
    navigateTo(`/admin/${routeSegment}`);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncTabFromUrl = () => {
      const nextTab = parseAdminTabFromPath(window.location.pathname);
      setActiveAdminTab((prev) => (prev === nextTab ? prev : nextTab));
    };
    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('app-route-change', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('app-route-change', syncTabFromUrl);
    };
  }, []);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [publishInitialTab, setPublishInitialTab] = useState<"video" | "image" | "carousel" | "product">("product");

  // Filter & Search states
  const [userSearch, setUserSearch] = useState("");
  const [reelSearch, setReelSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  // Deletion modal states
  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'user' | 'reel' | 'product';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingPermissionId, setUpdatingPermissionId] = useState<string | null>(null);

  // Order editing modal states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderNewStatus, setOrderNewStatus] = useState<string>("processing");
  const [orderNewCarrier, setOrderNewCarrier] = useState<string>("");
  const [orderNewTracking, setOrderNewTracking] = useState<string>("");
  const [orderNewNotes, setOrderNewNotes] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Default Assets State (Avatar & Cover Banner)
  const [defaultAvatar, setDefaultAvatar] = useState<string>(getDefaultAvatar());
  const [defaultCoverPhoto, setDefaultCoverPhoto] = useState<string>(getDefaultCoverPhoto());
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [isResettingDefaults, setIsResettingDefaults] = useState(false);
  const [avatarTabMode, setAvatarTabMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [coverTabMode, setCoverTabMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');

  // Platform switcher state (app/web <-> app/movil)
  const [currentPlatform, setCurrentPlatform] = useState<'android' | 'web'>(() => {
    return activePlatform || (sessionState.getPlatform() as 'android' | 'web') || 'web';
  });

  useEffect(() => {
    if (activePlatform) {
      setCurrentPlatform(activePlatform);
    }
  }, [activePlatform]);

  const handlePlatformChange = (target: 'android' | 'web') => {
    setCurrentPlatform(target);
    sessionState.setPlatform(target);
    if (onSwitchPlatform) {
      onSwitchPlatform(target);
    } else {
      window.location.reload();
    }
  };

  // System status
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    server: string;
    mongoConnected: boolean;
    uptime?: number;
    timestamp?: string;
  } | null>(null);

  // Fetch orders, default assets and system health on mount
  const fetchOrdersAndHealth = async () => {
    setIsLoadingOrders(true);
    try {
      // 1. Fetch orders
      const ordersRes = await apiFetch("/api/orders");
      const ordersData = await ordersRes.json().catch(() => []);
      if (Array.isArray(ordersData)) {
        setAllOrders(ordersData);
      } else if (ordersData && Array.isArray(ordersData.orders)) {
        setAllOrders(ordersData.orders);
      }

      // 2. Fetch health
      const healthRes = await apiFetch("/api/health").catch(() => null);
      if (healthRes) {
        const healthData = await healthRes.json().catch(() => null);
        if (healthData) {
          setSystemHealth(healthData);
        }
      }

      // 3. Fetch default assets
      const defaultsRes = await apiFetch("/api/admin/default-assets").catch(() => null);
      if (defaultsRes && defaultsRes.ok) {
        const defaultsData = await defaultsRes.json().catch(() => null);
        if (defaultsData) {
          if (defaultsData.defaultAvatar) setDefaultAvatar(defaultsData.defaultAvatar);
          if (defaultsData.defaultCoverPhoto) setDefaultCoverPhoto(defaultsData.defaultCoverPhoto);
          setDefaultAssetsCache(defaultsData.defaultAvatar, defaultsData.defaultCoverPhoto);
        }
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSaveDefaultAssets = async () => {
    setIsSavingDefaults(true);
    try {
      const res = await apiFetch("/api/admin/default-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultAvatar,
          defaultCoverPhoto
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        if (data.defaultAvatar) setDefaultAvatar(data.defaultAvatar);
        if (data.defaultCoverPhoto) setDefaultCoverPhoto(data.defaultCoverPhoto);
        setDefaultAssetsCache(data.defaultAvatar, data.defaultCoverPhoto);
        setStatusMessage({
          type: 'success',
          text: '¡Fotos por defecto guardadas con éxito! Se aplicarán a todas las cuentas nuevas y perfiles sin fotos personalizadas.'
        });
      } else {
        throw new Error(data.error || "Error al actualizar imágenes");
      }
    } catch (err: any) {
      console.error("Error saving default assets:", err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar imágenes por defecto' });
    } finally {
      setIsSavingDefaults(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleResetDefaultAssets = async () => {
    if (!window.confirm("¿Restablecer las fotos de perfil y portada por defecto a los valores originales de fábrica?")) return;
    setIsResettingDefaults(true);
    try {
      const res = await apiFetch("/api/admin/default-assets/reset", {
        method: "POST"
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setDefaultAvatar(data.defaultAvatar || FALLBACK_DEFAULT_AVATAR);
        setDefaultCoverPhoto(data.defaultCoverPhoto || FALLBACK_DEFAULT_COVER);
        setDefaultAssetsCache(data.defaultAvatar, data.defaultCoverPhoto);
        setStatusMessage({
          type: 'success',
          text: 'Fotos por defecto restablecidas a los valores originales de fábrica.'
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al restablecer imágenes' });
    } finally {
      setIsResettingDefaults(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor selecciona una imagen válida (JPG, PNG, WEBP).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDefaultAvatar(reader.result);
        setStatusMessage({ type: 'info', text: 'Nueva foto de perfil cargada. Haz clic en "Guardar Cambios" para confirmar.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor selecciona una imagen válida (JPG, PNG, WEBP).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDefaultCoverPhoto(reader.result);
        setStatusMessage({ type: 'info', text: 'Nueva foto de portada cargada. Haz clic en "Guardar Cambios" para confirmar.' });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyCustomAvatarUrl = () => {
    const trimmed = customAvatarUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
      setStatusMessage({ type: 'error', text: 'El enlace debe ser una URL web válida (http:// o https://).' });
      return;
    }
    setDefaultAvatar(trimmed);
    setCustomAvatarUrl('');
    setStatusMessage({ type: 'info', text: 'URL de avatar aplicada. Haz clic en "Guardar Cambios" para confirmar.' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const applyCustomCoverUrl = () => {
    const trimmed = customCoverUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
      setStatusMessage({ type: 'error', text: 'El enlace debe ser una URL web válida (http:// o https://).' });
      return;
    }
    setDefaultCoverPhoto(trimmed);
    setCustomCoverUrl('');
    setStatusMessage({ type: 'info', text: 'URL de portada aplicada. Haz clic en "Guardar Cambios" para confirmar.' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  useEffect(() => {
    fetchOrdersAndHealth();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchOrdersAndHealth(),
      Promise.resolve(onRefreshAll())
    ]);
    setIsRefreshing(false);
    setStatusMessage({ type: 'success', text: 'Datos administrativos actualizados exitosamente' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Aggregated KPIs
  const totalUsersCount = users.length;
  const totalReelsCount = reels.length;
  const totalProductsCount = products.length;
  const totalOrdersCount = allOrders.length;
  
  const totalPlatformRevenue = useMemo(() => {
    return allOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  }, [allOrders]);

  const totalReelViews = useMemo(() => {
    return reels.reduce((sum, r) => sum + (Number(r.views) || 0), 0);
  }, [reels]);

  const totalReelLikes = useMemo(() => {
    return reels.reduce((sum, r) => sum + (Number(r.likes) || 0), 0);
  }, [reels]);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

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

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return allOrders;
    return allOrders.filter((o) => o.status === orderStatusFilter);
  }, [allOrders, orderStatusFilter]);

  // Execute Deletion
  const confirmDeleteTarget = async () => {
    if (!deletingTarget) return;
    setIsDeleting(true);

    try {
      if (deletingTarget.type === 'reel') {
        const res = await apiFetch(`/api/reels/${deletingTarget.id}`, { method: 'DELETE' });
        if (res) {
          setReels(prev => prev.filter(r => r.id !== deletingTarget.id));
          setStatusMessage({ type: 'success', text: `Reel "${deletingTarget.name}" eliminado del sistema.` });
        }
      } else if (deletingTarget.type === 'product') {
        const res = await apiFetch(`/api/products/${deletingTarget.id}`, { method: 'DELETE' });
        if (res) {
          setProducts(prev => prev.filter(p => p.id !== deletingTarget.id));
          setStatusMessage({ type: 'success', text: `Producto "${deletingTarget.name}" eliminado del catálogo.` });
        }
      } else if (deletingTarget.type === 'user') {
        const res = await apiFetch(`/api/users/${deletingTarget.id}`, { method: 'DELETE' });
        if (res) {
          setUsers(prev => prev.filter(u => u.id !== deletingTarget.id));
          setStatusMessage({ type: 'success', text: `Usuario @${deletingTarget.name} eliminado de la base de datos.` });
        }
      }
    } catch (err: any) {
      console.error("Error deleting target in admin:", err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al procesar la eliminación' });
    } finally {
      setIsDeleting(false);
      setDeletingTarget(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleToggleSellerPermission = async (user: User) => {
    if (user.id === currentUser.id || updatingPermissionId) return;
    const nextCanSell = user.canSell !== true;
    setUpdatingPermissionId(user.id);
    try {
      const res = await apiFetch(`/api/users/${encodeURIComponent(user.id)}/permission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canSell: nextCanSell })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success !== true) throw new Error(data.error || "No se pudo actualizar el permiso.");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, canSell: data.canSell === true } : u));
      setStatusMessage({ type: "success", text: nextCanSell ? `${user.name} ahora tiene permisos de vendedor.` : `Se retiraron los permisos de vendedor de ${user.name}.` });
    } catch (err: any) {
      console.error("Error updating seller permission:", err);
      setStatusMessage({ type: "error", text: err.message || "Error al actualizar el permiso." });
    } finally {
      setUpdatingPermissionId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };
  // Save Order Tracking Updates
  const handleSaveOrderUpdate = async () => {
    if (!editingOrder) return;
    setIsUpdatingOrder(true);
    try {
      const payload = {
        status: orderNewStatus,
        carrier: orderNewCarrier,
        trackingNumber: orderNewTracking,
        sellerNotes: orderNewNotes
      };
      const res = await apiFetch(`/api/orders/${editingOrder.id}/update-tracking`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data: any = await res.json().catch(() => ({}));

      if (data && data.order) {
        setAllOrders(prev => prev.map(o => o.id === editingOrder.id ? data.order : o));
        setStatusMessage({ type: 'success', text: `Pedido ${editingOrder.id} actualizado correctamente a "${orderNewStatus}".` });
      }
      setEditingOrder(null);
    } catch (err: any) {
      console.error("Error updating order:", err);
      setStatusMessage({ type: 'error', text: err.message || "Error al actualizar pedido" });
    } finally {
      setIsUpdatingOrder(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return { currentUser, users, reels, products, onRefreshAll, onCreatorClick, onProductClick, onReelClick, onNavigateToTab, setUsers, setReels, setProducts, activePlatform, onSwitchPlatform, activeAdminTab, setActiveAdminTab, handleSelectAdminTab, allOrders, setAllOrders, isLoadingOrders, isRefreshing, statusMessage, setStatusMessage, isPublishOpen, setIsPublishOpen, publishInitialTab, setPublishInitialTab, userSearch, setUserSearch, reelSearch, setReelSearch, productSearch, setProductSearch, orderStatusFilter, setOrderStatusFilter, deletingTarget, setDeletingTarget, isDeleting, updatingPermissionId, editingOrder, setEditingOrder, orderNewStatus, setOrderNewStatus, orderNewCarrier, setOrderNewCarrier, orderNewTracking, setOrderNewTracking, orderNewNotes, setOrderNewNotes, isUpdatingOrder, defaultAvatar, setDefaultAvatar, defaultCoverPhoto, setDefaultCoverPhoto, isSavingDefaults, isResettingDefaults, avatarTabMode, setAvatarTabMode, coverTabMode, setCoverTabMode, customAvatarUrl, setCustomAvatarUrl, customCoverUrl, setCustomCoverUrl, currentPlatform, systemHealth, fetchOrdersAndHealth, handleSaveDefaultAssets, handleResetDefaultAssets, handleAvatarFileUpload, handleCoverFileUpload, applyCustomAvatarUrl, applyCustomCoverUrl, handleManualRefresh, totalUsersCount, totalReelsCount, totalProductsCount, totalOrdersCount, totalPlatformRevenue, totalReelViews, totalReelLikes, filteredUsers, filteredReels, filteredProducts, filteredOrders, confirmDeleteTarget, handleToggleSellerPermission, handleSaveOrderUpdate };
}