import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Eye,
  ShoppingCart,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { User, Reel, Product, Order } from "../tipos";
import {
  fetchFunnelAnalytics,
  FunnelAnalyticsData,
  getLocalFunnelCounts,
  fetchDailyVisitorAnalytics,
  DailyVisitorAnalyticsData,
} from "../../../utils/analyticsTracker";


import ResumenMetrica from "./resumen";
import EmbudoMetrica from "./embudo";
import VentasMetrica from "./ventas";
import VideosMetrica from "./videos";
import CreadoresMetrica from "./creadores";
import { calcularDatosEmbudo, crearCapasEmbudo } from "./calculos-embudo";
import { calcularReelsDestacados, calcularProductosDestacados, calcularCreadoresDestacados } from "./calculos-rendimiento";

export interface MetricaAdminProps {
  users: User[];
  reels: Reel[];
  products: Product[];
  orders: Order[];
  onCreatorClick?: (creatorId: string) => void;
  onProductClick?: (product: Product) => void;
  onReelClick?: (reelId: string) => void;
}

type MetricSection = "all" | "embudo" | "ventas" | "reels" | "creadores";
type FunnelTimePeriod = "day" | "week" | "month" | "year" | "all";

export default function MetricaAdminView({
  users,
  reels,
  products,
  orders,
  onCreatorClick,
  onProductClick,
  onReelClick,
}: MetricaAdminProps) {
  const [activeSection, setActiveSection] = useState<MetricSection>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("embudo")) return "embudo";
    }
    return "all";
  });

  const [selectedFunnelPeriod, setSelectedFunnelPeriod] = useState<FunnelTimePeriod>("year");
  const [funnelApiData, setFunnelApiData] = useState<FunnelAnalyticsData | null>(null);
  const [localRefreshTick, setLocalRefreshTick] = useState(0);
  const [tokenSearchFilter, setTokenSearchFilter] = useState("");
  const [tokenLayerFilter, setTokenLayerFilter] = useState<number | "all">("all");
  const [dailyVisitorData, setDailyVisitorData] = useState<DailyVisitorAnalyticsData | null>(null);
  const [dailyVisitorLoading, setDailyVisitorLoading] = useState(false);
  const [dailyVisitorError, setDailyVisitorError] = useState("");

  const refreshDailyVisitors = async () => {
    setDailyVisitorLoading(true);
    const data = await fetchDailyVisitorAnalytics(7);
    setDailyVisitorData(data);
    setDailyVisitorError(data ? "" : "No se pudieron cargar las visitas diarias. Verifica la conexión con el servidor.");
    setDailyVisitorLoading(false);
  };

  useEffect(() => {
    void refreshDailyVisitors();
    const refreshInterval = window.setInterval(() => {
      void refreshDailyVisitors();
    }, 60000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadFunnel = async () => {
      const data = await fetchFunnelAnalytics();
      if (mounted && data) {
        setFunnelApiData(data);
      }
    };
    loadFunnel();

    const handleLocalUpdate = () => {
      setLocalRefreshTick((t) => t + 1);
      loadFunnel();
    };

    window.addEventListener("funnel-analytics-updated", handleLocalUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("funnel-analytics-updated", handleLocalUpdate);
    };
  }, []);

  // --- 1. E-Commerce & Revenue Metrics ---
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [orders]
  );

  const totalShippingRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.shippingCost) || 0), 0),
    [orders]
  );

  const avgOrderValue = useMemo(
    () => (orders.length > 0 ? totalRevenue / orders.length : 0),
    [orders.length, totalRevenue]
  );

  const totalItemsSold = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum +
          (Array.isArray(o.items)
            ? o.items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)
            : 0),
        0
      ),
    [orders]
  );

  const orderStatusBreakdown = useMemo(() => {
    const counts = {
      delivered: 0,
      shipped: 0,
      processing: 0,
      pending: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      const st = (o.status || "pending") as keyof typeof counts;
      if (counts[st] !== undefined) {
        counts[st] += 1;
      } else {
        counts.pending += 1;
      }
    });
    return counts;
  }, [orders]);

  // --- 2. Reels & Content Engagement Metrics ---
  const totalReelViews = useMemo(
    () => reels.reduce((sum, r) => sum + (Number(r.views) || 0), 0),
    [reels]
  );

  const totalReelLikes = useMemo(
    () => reels.reduce((sum, r) => sum + (Number(r.likes) || 0), 0),
    [reels]
  );

  const totalReelComments = useMemo(
    () =>
      reels.reduce(
        (sum, r) => sum + (Array.isArray(r.comments) ? r.comments.length : 0),
        0
      ),
    [reels]
  );

  const totalReelSaves = useMemo(
    () => reels.reduce((sum, r) => sum + (Number(r.saves) || 0), 0),
    [reels]
  );

  const engagementRate = useMemo(() => {
    if (totalReelViews <= 0) return 0;
    const interactions = totalReelLikes + totalReelComments + totalReelSaves;
    return Math.min(100, (interactions / totalReelViews) * 100);
  }, [totalReelViews, totalReelLikes, totalReelComments, totalReelSaves]);

  // --- 3. Catalog & Community Metrics ---
  const totalProductViews = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.views) || 0), 0),
    [products]
  );

  const totalInventoryUnits = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0),
    [products]
  );

  const totalInventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
        0
      ),
    [products]
  );

  const onlineUsersCount = useMemo(
    () => users.filter((u) => u.isOnline).length,
    [users]
  );

  const activeSellersCount = useMemo(
    () => users.filter((u) => u.canSell || u.isAdmin || u.role === "superadmin").length,
    [users]
  );

  // --- 4. Sales Funnel (Embudo de Venta) & Page Visits Computation (100% Real Data: Visits + Unique Users) ---
  const computedFunnelData = useMemo(() => calcularDatosEmbudo(funnelApiData, orders), [funnelApiData, orders, localRefreshTick]);

  const activeFunnelMetrics =
    computedFunnelData.funnelByPeriod[selectedFunnelPeriod] ||
    computedFunnelData.funnelByPeriod.year;

  const funnelLayers = useMemo(() => crearCapasEmbudo(activeFunnelMetrics, products), [activeFunnelMetrics, products]);

  // --- 5. Rankings ---
  const topReels = useMemo(() => {
    return [...reels]
      .sort((a, b) => {
        const scoreB = (Number(b.views) || 0) + (Number(b.likes) || 0) * 3;
        const scoreA = (Number(a.views) || 0) + (Number(a.likes) || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [reels]);

  const topProducts = useMemo(() => {
    const salesByProduct: Record<string, { units: number; revenue: number }> = {};
    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item) => {
        const pid = item.productId || item.name;
        if (!pid) return;
        if (!salesByProduct[pid]) {
          salesByProduct[pid] = { units: 0, revenue: 0 };
        }
        const qty = Number(item.quantity) || 1;
        salesByProduct[pid].units += qty;
        salesByProduct[pid].revenue += (Number(item.price) || 0) * qty;
      });
    });

    return products
      .map((prod) => {
        const stats = salesByProduct[prod.id] || salesByProduct[prod.name] || {
          units: 0,
          revenue: 0,
        };
        return {
          product: prod,
          unitsSold: stats.units,
          revenue: stats.revenue,
          views: Number(prod.views) || 0,
        };
      })
      .sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
        return b.views - a.views;
      })
      .slice(0, 6);
  }, [products, orders]);

  const topCreators = useMemo(() => {
    return users
      .map((u) => {
        const userReels = reels.filter(
          (r) =>
            r.creatorId === u.id ||
            (r.creatorUsername &&
              u.username &&
              r.creatorUsername.toLowerCase() === u.username.toLowerCase())
        );
        const userProducts = products.filter(
          (p) =>
            p.sellerId === u.id ||
            (p.sellerUsername &&
              u.username &&
              p.sellerUsername.toLowerCase() === u.username.toLowerCase())
        );
        const creatorViews = userReels.reduce(
          (acc, r) => acc + (Number(r.views) || 0),
          0
        );
        const creatorLikes = userReels.reduce(
          (acc, r) => acc + (Number(r.likes) || 0),
          0
        );
        return {
          user: u,
          reelsCount: userReels.length,
          productsCount: userProducts.length,
          totalViews: creatorViews,
          totalLikes: creatorLikes,
        };
      })
      .sort((a, b) => {
        const scoreB = b.totalViews + b.reelsCount * 10 + b.productsCount * 5;
        const scoreA = a.totalViews + a.reelsCount * 10 + a.productsCount * 5;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [users, reels, products]);

  const periodLabels: Record<FunnelTimePeriod, string> = {
    day: "Hoy (Por Día)",
    week: "Esta Semana (7 Días)",
    month: "Este Mes (30 Días)",
    year: "Este Año (365 Días)",
    all: "Histórico Total",
  };

  return (
    <div className="space-y-6 select-none" id="admin-tab-content-metrica">
      <ResumenMetrica users={users} reels={reels} products={products} orders={orders}
      onCreatorClick={onCreatorClick} onProductClick={onProductClick} onReelClick={onReelClick}
      activeSection={activeSection} setActiveSection={setActiveSection}
      dailyVisitorData={dailyVisitorData} dailyVisitorLoading={dailyVisitorLoading}
      dailyVisitorError={dailyVisitorError} refreshDailyVisitors={refreshDailyVisitors}
      totalRevenue={totalRevenue} avgOrderValue={avgOrderValue} totalItemsSold={totalItemsSold}
      totalReelViews={totalReelViews} totalReelLikes={totalReelLikes}
      totalReelComments={totalReelComments} totalReelSaves={totalReelSaves}
      engagementRate={engagementRate} totalInventoryValue={totalInventoryValue}
      totalInventoryUnits={totalInventoryUnits} totalProductViews={totalProductViews}
      onlineUsersCount={onlineUsersCount} activeSellersCount={activeSellersCount}
      selectedFunnelPeriod={selectedFunnelPeriod} setSelectedFunnelPeriod={setSelectedFunnelPeriod}
      periodLabels={periodLabels} computedFunnelData={computedFunnelData}
      funnelLayers={funnelLayers} funnelApiData={funnelApiData}
      tokenSearchFilter={tokenSearchFilter} setTokenSearchFilter={setTokenSearchFilter}
      tokenLayerFilter={tokenLayerFilter} setTokenLayerFilter={setTokenLayerFilter}
      totalShippingRevenue={totalShippingRevenue} orderStatusBreakdown={orderStatusBreakdown}
      topProducts={topProducts} topReels={topReels} topCreators={topCreators} />
      <EmbudoMetrica users={users} reels={reels} products={products} orders={orders}
      onCreatorClick={onCreatorClick} onProductClick={onProductClick} onReelClick={onReelClick}
      activeSection={activeSection} setActiveSection={setActiveSection}
      dailyVisitorData={dailyVisitorData} dailyVisitorLoading={dailyVisitorLoading}
      dailyVisitorError={dailyVisitorError} refreshDailyVisitors={refreshDailyVisitors}
      totalRevenue={totalRevenue} avgOrderValue={avgOrderValue} totalItemsSold={totalItemsSold}
      totalReelViews={totalReelViews} totalReelLikes={totalReelLikes}
      totalReelComments={totalReelComments} totalReelSaves={totalReelSaves}
      engagementRate={engagementRate} totalInventoryValue={totalInventoryValue}
      totalInventoryUnits={totalInventoryUnits} totalProductViews={totalProductViews}
      onlineUsersCount={onlineUsersCount} activeSellersCount={activeSellersCount}
      selectedFunnelPeriod={selectedFunnelPeriod} setSelectedFunnelPeriod={setSelectedFunnelPeriod}
      periodLabels={periodLabels} computedFunnelData={computedFunnelData}
      funnelLayers={funnelLayers} funnelApiData={funnelApiData}
      tokenSearchFilter={tokenSearchFilter} setTokenSearchFilter={setTokenSearchFilter}
      tokenLayerFilter={tokenLayerFilter} setTokenLayerFilter={setTokenLayerFilter}
      totalShippingRevenue={totalShippingRevenue} orderStatusBreakdown={orderStatusBreakdown}
      topProducts={topProducts} topReels={topReels} topCreators={topCreators} />
      <VentasMetrica users={users} reels={reels} products={products} orders={orders}
      onCreatorClick={onCreatorClick} onProductClick={onProductClick} onReelClick={onReelClick}
      activeSection={activeSection} setActiveSection={setActiveSection}
      dailyVisitorData={dailyVisitorData} dailyVisitorLoading={dailyVisitorLoading}
      dailyVisitorError={dailyVisitorError} refreshDailyVisitors={refreshDailyVisitors}
      totalRevenue={totalRevenue} avgOrderValue={avgOrderValue} totalItemsSold={totalItemsSold}
      totalReelViews={totalReelViews} totalReelLikes={totalReelLikes}
      totalReelComments={totalReelComments} totalReelSaves={totalReelSaves}
      engagementRate={engagementRate} totalInventoryValue={totalInventoryValue}
      totalInventoryUnits={totalInventoryUnits} totalProductViews={totalProductViews}
      onlineUsersCount={onlineUsersCount} activeSellersCount={activeSellersCount}
      selectedFunnelPeriod={selectedFunnelPeriod} setSelectedFunnelPeriod={setSelectedFunnelPeriod}
      periodLabels={periodLabels} computedFunnelData={computedFunnelData}
      funnelLayers={funnelLayers} funnelApiData={funnelApiData}
      tokenSearchFilter={tokenSearchFilter} setTokenSearchFilter={setTokenSearchFilter}
      tokenLayerFilter={tokenLayerFilter} setTokenLayerFilter={setTokenLayerFilter}
      totalShippingRevenue={totalShippingRevenue} orderStatusBreakdown={orderStatusBreakdown}
      topProducts={topProducts} topReels={topReels} topCreators={topCreators} />
      <VideosMetrica users={users} reels={reels} products={products} orders={orders}
      onCreatorClick={onCreatorClick} onProductClick={onProductClick} onReelClick={onReelClick}
      activeSection={activeSection} setActiveSection={setActiveSection}
      dailyVisitorData={dailyVisitorData} dailyVisitorLoading={dailyVisitorLoading}
      dailyVisitorError={dailyVisitorError} refreshDailyVisitors={refreshDailyVisitors}
      totalRevenue={totalRevenue} avgOrderValue={avgOrderValue} totalItemsSold={totalItemsSold}
      totalReelViews={totalReelViews} totalReelLikes={totalReelLikes}
      totalReelComments={totalReelComments} totalReelSaves={totalReelSaves}
      engagementRate={engagementRate} totalInventoryValue={totalInventoryValue}
      totalInventoryUnits={totalInventoryUnits} totalProductViews={totalProductViews}
      onlineUsersCount={onlineUsersCount} activeSellersCount={activeSellersCount}
      selectedFunnelPeriod={selectedFunnelPeriod} setSelectedFunnelPeriod={setSelectedFunnelPeriod}
      periodLabels={periodLabels} computedFunnelData={computedFunnelData}
      funnelLayers={funnelLayers} funnelApiData={funnelApiData}
      tokenSearchFilter={tokenSearchFilter} setTokenSearchFilter={setTokenSearchFilter}
      tokenLayerFilter={tokenLayerFilter} setTokenLayerFilter={setTokenLayerFilter}
      totalShippingRevenue={totalShippingRevenue} orderStatusBreakdown={orderStatusBreakdown}
      topProducts={topProducts} topReels={topReels} topCreators={topCreators} />
      <CreadoresMetrica users={users} reels={reels} products={products} orders={orders}
      onCreatorClick={onCreatorClick} onProductClick={onProductClick} onReelClick={onReelClick}
      activeSection={activeSection} setActiveSection={setActiveSection}
      dailyVisitorData={dailyVisitorData} dailyVisitorLoading={dailyVisitorLoading}
      dailyVisitorError={dailyVisitorError} refreshDailyVisitors={refreshDailyVisitors}
      totalRevenue={totalRevenue} avgOrderValue={avgOrderValue} totalItemsSold={totalItemsSold}
      totalReelViews={totalReelViews} totalReelLikes={totalReelLikes}
      totalReelComments={totalReelComments} totalReelSaves={totalReelSaves}
      engagementRate={engagementRate} totalInventoryValue={totalInventoryValue}
      totalInventoryUnits={totalInventoryUnits} totalProductViews={totalProductViews}
      onlineUsersCount={onlineUsersCount} activeSellersCount={activeSellersCount}
      selectedFunnelPeriod={selectedFunnelPeriod} setSelectedFunnelPeriod={setSelectedFunnelPeriod}
      periodLabels={periodLabels} computedFunnelData={computedFunnelData}
      funnelLayers={funnelLayers} funnelApiData={funnelApiData}
      tokenSearchFilter={tokenSearchFilter} setTokenSearchFilter={setTokenSearchFilter}
      tokenLayerFilter={tokenLayerFilter} setTokenLayerFilter={setTokenLayerFilter}
      totalShippingRevenue={totalShippingRevenue} orderStatusBreakdown={orderStatusBreakdown}
      topProducts={topProducts} topReels={topReels} topCreators={topCreators} />
    </div>
  );
}
