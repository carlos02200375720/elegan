import { FunnelAnalyticsData, getLocalFunnelCounts } from "../../../utils/analyticsTracker";
import { Order, Product } from "../tipos";
export function calcularDatosEmbudo(funnelApiData: FunnelAnalyticsData | null, orders: Order[]) {

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const localDay = getLocalFunnelCounts(ONE_DAY);
    const localWeek = getLocalFunnelCounts(ONE_DAY * 7);
    const localMonth = getLocalFunnelCounts(ONE_DAY * 30);
    const localYear = getLocalFunnelCounts(ONE_DAY * 365);

    if (funnelApiData) {
      return {
        pageVisits: {
          day: funnelApiData.pageVisits.day,
          week: funnelApiData.pageVisits.week,
          month: funnelApiData.pageVisits.month,
          year: funnelApiData.pageVisits.year,
        },
        pageUsers: {
          day: funnelApiData.pageUsers?.day ?? localDay.allUsers,
          week: funnelApiData.pageUsers?.week ?? localWeek.allUsers,
          month: funnelApiData.pageUsers?.month ?? localMonth.allUsers,
          year: funnelApiData.pageUsers?.year ?? localYear.allUsers,
        },
        funnelByPeriod: funnelApiData.funnelByPeriod,
      };
    }

    const now = Date.now();
    const getRealOrdersStatsInWindow = (windowMs: number) => {
      const matched = orders.filter((o) => {
        if (!o.createdAt) return windowMs >= ONE_DAY * 365;
        const createdMs = new Date(o.createdAt).getTime();
        if (Number.isNaN(createdMs)) return windowMs >= ONE_DAY * 365;
        return now - createdMs <= windowMs;
      });
      const buyers = new Set<string>();
      matched.forEach((o, idx) => {
        buyers.add(
          String(
            (o as any).userId || o.buyerUsername || o.buyerName || o.id || `b_${idx}`
          ).toLowerCase()
        );
      });
      return { visits: matched.length, users: buyers.size };
    };

    const buildRealPeriod = (
      windowMs: number,
      localCounts: ReturnType<typeof getLocalFunnelCounts>
    ) => {
      const ordStats = getRealOrdersStatsInWindow(windowMs);
      return {
        capa1_tienda: localCounts.tienda,
        capa2_producto_id: localCounts.producto_id,
        capa3_carrito: localCounts.carrito,
        capa4_verificacion: localCounts.verificacion,
        capa5_gracia: Math.max(localCounts.gracia, ordStats.visits),
        users: {
          capa1_tienda: localCounts.users.tienda,
          capa2_producto_id: localCounts.users.producto_id,
          capa3_carrito: localCounts.users.carrito,
          capa4_verificacion: localCounts.users.verificacion,
          capa5_gracia: Math.max(localCounts.users.gracia, ordStats.users),
        },
      };
    };

    return {
      pageVisits: {
        day: localDay.allVisits,
        week: localWeek.allVisits,
        month: localMonth.allVisits,
        year: localYear.allVisits,
      },
      pageUsers: {
        day: localDay.allUsers,
        week: localWeek.allUsers,
        month: localMonth.allUsers,
        year: localYear.allUsers,
      },
      funnelByPeriod: {
        day: buildRealPeriod(ONE_DAY, localDay),
        week: buildRealPeriod(ONE_DAY * 7, localWeek),
        month: buildRealPeriod(ONE_DAY * 30, localMonth),
        year: buildRealPeriod(ONE_DAY * 365, localYear),
        all: buildRealPeriod(ONE_DAY * 365 * 50, localYear),
      },
    };
}
import { ShoppingBag, Eye, ShoppingCart, CreditCard, CheckCircle2 } from "lucide-react";
export function crearCapasEmbudo(activeFunnelMetrics: any, products: Product[]) {

    const rawC1 = activeFunnelMetrics.capa1_tienda;
    const c1 = Math.max(1, rawC1);
    const c2 = activeFunnelMetrics.capa2_producto_id;
    const c3 = activeFunnelMetrics.capa3_carrito;
    const c4 = activeFunnelMetrics.capa4_verificacion;
    const c5 = activeFunnelMetrics.capa5_gracia;

    const u1 = activeFunnelMetrics.users?.capa1_tienda ?? rawC1;
    const u1Base = Math.max(1, u1);
    const u2 = activeFunnelMetrics.users?.capa2_producto_id ?? c2;
    const u3 = activeFunnelMetrics.users?.capa3_carrito ?? c3;
    const u4 = activeFunnelMetrics.users?.capa4_verificacion ?? c4;
    const u5 = activeFunnelMetrics.users?.capa5_gracia ?? c5;

    return [
      {
        layerNumber: 1,
        badge: "CAPA 1",
        title: "Visitantes en la Tienda",
        routeDisplay: "dominio/tienda",
        targetPath: "/tienda",
        description: "Visitas totales y usuarios únicos que entraron a dominio/tienda",
        count: rawC1,
        usersCount: u1,
        unitLabel: "visitas",
        usersUnitLabel: "usuarios",
        pctOfTop: rawC1 > 0 ? 100 : 0,
        usersPctOfTop: u1 > 0 ? 100 : 0,
        stepConversionPct: rawC1 > 0 ? 100 : 0,
        usersStepConversionPct: u1 > 0 ? 100 : 0,
        widthClass: "w-full",
        bgGradient: "from-indigo-600/10 via-indigo-500/5 to-white",
        borderColor: "border-indigo-200 hover:border-indigo-400",
        badgeClass: "bg-indigo-600 text-white",
        routeBadgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        barColor: "bg-indigo-600",
        numberColor: "text-indigo-700",
        icon: ShoppingBag,
      },
      {
        layerNumber: 2,
        badge: "CAPA 2",
        title: "Visitas a Detalle del Producto",
        routeDisplay: "dominio/tienda/id del producto",
        targetPath: products[0] ? `/tienda/${products[0].id}` : "/tienda",
        description: "Visitas totales y usuarios únicos en dominio/tienda/id del producto",
        count: c2,
        usersCount: u2,
        unitLabel: "visitas",
        usersUnitLabel: "usuarios",
        pctOfTop: rawC1 > 0 ? Math.min(100, Math.round((c2 / c1) * 100)) : 0,
        usersPctOfTop: u1 > 0 ? Math.min(100, Math.round((u2 / u1Base) * 100)) : 0,
        stepConversionPct: rawC1 > 0 ? Math.min(100, Math.round((c2 / c1) * 100)) : 0,
        usersStepConversionPct: u1 > 0 ? Math.min(100, Math.round((u2 / u1Base) * 100)) : 0,
        widthClass: "w-full md:w-[92%]",
        bgGradient: "from-violet-600/10 via-violet-500/5 to-white",
        borderColor: "border-violet-200 hover:border-violet-400",
        badgeClass: "bg-violet-600 text-white",
        routeBadgeClass: "bg-violet-50 text-violet-700 border-violet-200",
        barColor: "bg-violet-600",
        numberColor: "text-violet-700",
        icon: Eye,
      },
      {
        layerNumber: 3,
        badge: "CAPA 3",
        title: "Personas que Visitaron el Carrito",
        routeDisplay: "dominio/tienda/carrito",
        targetPath: "/tienda/carrito",
        description: "Visitas totales y usuarios únicos en dominio/tienda/carrito",
        count: c3,
        usersCount: u3,
        unitLabel: "visitas",
        usersUnitLabel: "usuarios",
        pctOfTop: rawC1 > 0 ? Math.min(100, Math.round((c3 / c1) * 100)) : 0,
        usersPctOfTop: u1 > 0 ? Math.min(100, Math.round((u3 / u1Base) * 100)) : 0,
        stepConversionPct: c2 > 0 ? Math.min(100, Math.round((c3 / c2) * 100)) : 0,
        usersStepConversionPct: u2 > 0 ? Math.min(100, Math.round((u3 / u2) * 100)) : 0,
        widthClass: "w-full md:w-[84%]",
        bgGradient: "from-amber-500/15 via-amber-500/5 to-white",
        borderColor: "border-amber-200 hover:border-amber-400",
        badgeClass: "bg-amber-500 text-slate-950",
        routeBadgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        barColor: "bg-amber-500",
        numberColor: "text-amber-600",
        icon: ShoppingCart,
      },
      {
        layerNumber: 4,
        badge: "CAPA 4",
        title: "Visitas a Página de Verificación",
        routeDisplay: "dominio/tienda/verificación",
        targetPath: "/tienda/verificacion",
        description: "Visitas totales y usuarios únicos en dominio/tienda/verificación",
        count: c4,
        usersCount: u4,
        unitLabel: "visitas",
        usersUnitLabel: "usuarios",
        pctOfTop: rawC1 > 0 ? Math.min(100, Math.round((c4 / c1) * 100)) : 0,
        usersPctOfTop: u1 > 0 ? Math.min(100, Math.round((u4 / u1Base) * 100)) : 0,
        stepConversionPct: c3 > 0 ? Math.min(100, Math.round((c4 / c3) * 100)) : 0,
        usersStepConversionPct: u3 > 0 ? Math.min(100, Math.round((u4 / u3) * 100)) : 0,
        widthClass: "w-full md:w-[76%]",
        bgGradient: "from-cyan-600/10 via-cyan-500/5 to-white",
        borderColor: "border-cyan-200 hover:border-cyan-400",
        badgeClass: "bg-cyan-600 text-white",
        routeBadgeClass: "bg-cyan-50 text-cyan-800 border-cyan-200",
        barColor: "bg-cyan-600",
        numberColor: "text-cyan-700",
        icon: CreditCard,
      },
      {
        layerNumber: 5,
        badge: "CAPA 5",
        title: "Personas que Compraron (Página de Gracias)",
        routeDisplay: "dominio/tienda/gracia",
        targetPath: "/tienda/gracia",
        description: "Compras totales y compradores únicos que llegaron a dominio/tienda/gracia",
        count: c5,
        usersCount: u5,
        unitLabel: "visitas",
        usersUnitLabel: "usuarios",
        pctOfTop: rawC1 > 0 ? Math.min(100, Math.round((c5 / c1) * 100)) : 0,
        usersPctOfTop: u1 > 0 ? Math.min(100, Math.round((u5 / u1Base) * 100)) : 0,
        stepConversionPct: c4 > 0 ? Math.min(100, Math.round((c5 / c4) * 100)) : 0,
        usersStepConversionPct: u4 > 0 ? Math.min(100, Math.round((u5 / u4) * 100)) : 0,
        widthClass: "w-full md:w-[68%]",
        bgGradient: "from-emerald-600/15 via-emerald-500/5 to-white",
        borderColor: "border-emerald-300 hover:border-emerald-500",
        badgeClass: "bg-emerald-600 text-white",
        routeBadgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        barColor: "bg-emerald-600",
        numberColor: "text-emerald-700",
        icon: CheckCircle2,
      },
    ];
}
